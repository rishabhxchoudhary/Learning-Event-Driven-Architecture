import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
    // Ensure user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fileName, fileType }: { fileName: string; fileType: string } = body;

    if (!fileName || !fileType) {
        return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const bucket = process.env.S3_BUCKET_NAME;
    const userId = session.user?.email; // partition key in DynamoDB

    if (!userId) {
        return NextResponse.json({ error: "User email not found" }, { status: 400 });
    }

    const imageId = uuidv4(); // sort key in DynamoDB
    const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg";
    const key = `uploads/${imageId}.${ext}`; // short, no user/email/long filename
    const timestamp = Date.now();

    // S3 presigned PUT URL (testing without metadata first)
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: fileType,
        // Temporarily removing metadata to test basic upload
        // Metadata: {
        //     userid: userId,
        //     imageid: imageId,
        // },
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    // Debug logging
    console.log("Generated presigned URL:", uploadUrl);
    console.log("Metadata being signed:", { userid: userId, imageid: imageId });

    // Write metadata to DynamoDB with status = 'processing'
    const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(ddb);

    await docClient.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            userId,           // PK
            imageId,          // SK (uuid)
            originalKey: key,
            originalFileName: fileName,
            thumb200Key: null,
            thumb400Key: null,
            status: "processing",
            createdAt: timestamp,
        }
    }));

    // Return everything the client needs
    return NextResponse.json({ uploadUrl, imageId, userId });
}