import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const dynamoDb = DynamoDBDocumentClient.from(client);

const ANALYTICS_TABLE_NAME = process.env.ANALYTICS_TABLE_NAME;

export const handler = async (event: any) => {
    console.log('EventBridge event in Analytics:', JSON.stringify(event));

    const timestamp = new Date().toISOString();

    const params = {
        TableName: ANALYTICS_TABLE_NAME,
        Key: { metricName: 'signups' },
        UpdateExpression: 'ADD #count :inc SET lastSignupAt = :ts',
        ExpressionAttributeNames: {
            '#count': 'count',
        },
        ExpressionAttributeValues: {
            ':inc': 1,
            ':ts': timestamp,
        },
        ReturnValues: 'UPDATED_NEW' as const,
    };

    try {
        const result = await dynamoDb.send(new UpdateCommand(params));
        console.log('Analytics updated:', JSON.stringify(result.Attributes));
    } catch (err) {
        console.error('Error updating analytics:', err);
        throw err;
    }
};