import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authOptions } from "@/lib/auth";

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddb);
const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.email;

    // Query by userId (partition key)
    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId }
    };

    const data = await docClient.send(new QueryCommand(params));
    const items = data.Items ?? [];
    const bucket = process.env.S3_BUCKET_NAME!;

    // Generate pre-signed URLs for thumbnail images
    const images = await Promise.all(
        items.map(async (img: any) => {
            if (img.status !== "done") return img;

            const result: any = { ...img };

            // Generate pre-signed URL for 200px thumbnail
            if (img.thumb200Key) {
                result.thumb200Url = await getSignedUrl(
                    s3,
                    new GetObjectCommand({
                        Bucket: bucket,
                        Key: img.thumb200Key,
                    }),
                    { expiresIn: 60 * 10 } // 10 minutes
                );
            }

            // Generate pre-signed URL for 400px thumbnail
            if (img.thumb400Key) {
                result.thumb400Url = await getSignedUrl(
                    s3,
                    new GetObjectCommand({
                        Bucket: bucket,
                        Key: img.thumb400Key,
                    }),
                    { expiresIn: 60 * 10 } // 10 minutes
                );
            }

            return result;
        })
    );

    return NextResponse.json({ images });
}