import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user?.email;
    const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

    // Query by userId (partition key)
    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: { ":uid": userId }
    };

    const data = await docClient.send(new QueryCommand(params));
    return NextResponse.json({ images: data.Items });
}