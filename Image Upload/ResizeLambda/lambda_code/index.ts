import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { S3Event } from "aws-lambda";
import Jimp from "jimp";
import { Readable } from "stream";

const s3 = new S3Client();
const ddb = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(ddb);

export const handler = async (event: S3Event) => {
    console.log("Event received:", JSON.stringify(event, null, 2));
    
    const record = event.Records?.[0];
    if (!record) {
        console.log("No records in event");
        return;
    }

    const bucket = record.s3.bucket.name;
    let key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    // If key starts with 'thumbnails/', skip it (we only process originals)
    if (key.startsWith("thumbnails/")) {
        console.log("Already a thumbnail, exiting:", key);
        return;
    }

    try {
        // 1. Get original image from S3
        const getObj = await s3.send(new GetObjectCommand({ 
            Bucket: bucket, 
            Key: key 
        }));

        // Metadata keys are lowercase
        const userId = getObj.Metadata?.userid;
        const imageId = getObj.Metadata?.imageid;

        console.log("S3 object metadata:", getObj.Metadata);
        console.log("Extracted userId:", userId);
        console.log("Extracted imageId:", imageId);

        // Validate required metadata
        if (!userId || !imageId) {
            console.error("Missing required metadata - userId:", userId, "imageId:", imageId);
            throw new Error(`Missing metadata: userId=${userId}, imageId=${imageId}`);
        }
        
        const imageBuffer = await streamToBuffer(getObj.Body as Readable);

        // 2. Resize to 200px and 400px widths using Jimp
        const sizes = [200, 400];
        const originalFileName = key.split("/").pop(); // e.g. '12345-photo.jpg'

        // Load image with Jimp
        const image = await Jimp.read(imageBuffer);

        await Promise.all(sizes.map(async (size) => {
            // Clone the image and resize
            const resized = image.clone()
                .resize(size, Jimp.AUTO) // width = size, height auto-calculated
                .quality(80); // set JPEG quality

            // Get buffer
            const resizedBuffer = await resized.getBufferAsync(Jimp.MIME_JPEG);

            const thumbKey = `thumbnails/${size}/${originalFileName}`;

            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: thumbKey,
                Body: resizedBuffer,
                ContentType: "image/jpeg",
            }));

            console.log("Saved thumbnail:", thumbKey);
        }));

        // 3. Update DynamoDB item to status 'done' and set thumbnail keys
        const params = {
            TableName: process.env.DYNAMODB_TABLE, // set this env var in Lambda
            Key: { userId: userId, imageId: imageId }, // example key schema
            UpdateExpression: "SET #st = :s, thumb200Key = :t200, thumb400Key = :t400",
            ExpressionAttributeNames: { "#st": "status" },
            ExpressionAttributeValues: {
                ":s": "done",
                ":t200": `thumbnails/200/${originalFileName}`,
                ":t400": `thumbnails/400/${originalFileName}`,
            }
        };

        console.log("Updating DynamoDB with params:", JSON.stringify(params, null, 2));
        
        try {
            await docClient.send(new UpdateCommand(params));
            console.log("DynamoDB item updated to done.");
        } catch (dynamoError) {
            console.error("Failed to update DynamoDB:", dynamoError);
            console.error("Update params were:", JSON.stringify(params, null, 2));
            throw dynamoError;
        }
    } catch (err) {
        console.error("Error processing file:", err);
        throw err;
    }
};

// Helper: Convert stream (from S3) to Buffer
function streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.once("end", () => resolve(Buffer.concat(chunks)));
        stream.once("error", reject);
    });
}