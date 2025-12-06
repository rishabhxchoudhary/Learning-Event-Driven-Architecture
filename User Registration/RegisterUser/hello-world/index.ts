// src/registerUser.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const dynamoDbClient = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(dynamoDbClient);
const eventBridge = new EventBridgeClient({});

const USERS_TABLE_NAME = process.env.USERS_TABLE_NAME!;
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME!;

function generateId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export const handler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    console.log('Received event:', JSON.stringify(event));

    try {
        const body = event.body ? JSON.parse(event.body) : {};
        const email = body.email;
        const name = body.name || 'anonymous';

        if (!email) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'email is required' }),
            };
        }

        const userId = generateId();
        const timestamp = new Date().toISOString();

        // 1) Save user to DynamoDB
        const userItem = {
            userId: userId,
            email: email,
            name: name,
            createdAt: timestamp,
        };

        await dynamoDb.send(new PutCommand({
            TableName: USERS_TABLE_NAME,
            Item: userItem,
        }));

        console.log('User saved to DynamoDB:', userItem);

        // 2) Publish UserRegistered event to EventBridge
        const detail = {
            userId: userId,
            email: email,
            name: name,
            timestamp: timestamp,
        };

        await eventBridge.send(new PutEventsCommand({
            Entries: [
                {
                    EventBusName: EVENT_BUS_NAME,
                    Source: 'myapp.userservice',
                    DetailType: 'UserRegistered',
                    Detail: JSON.stringify(detail),
                },
            ],
        }));

        console.log('UserRegistered event published:', detail);

        // 3) Return 202 Accepted quickly
        return {
            statusCode: 202,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'User registered (async processing started)',
                userId: userId,
            }),
        };
    } catch (err) {
        console.error('Error in RegisterUser:', err);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Internal server error' }),
        };
    }
};
