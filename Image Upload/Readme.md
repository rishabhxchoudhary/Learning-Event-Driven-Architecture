## Create an S3 Bucket
1. Sign in to the AWS Console and go to S3.
2. Click Create bucket.
3. Choose a globally unique name - my-image-app-123abc
4. Select your Region (ap-south-1)
5. For a learning setup, leave defaults but keep “Block all public access” ON (we won’t serve images publicly; the console can preview them).
6. Finish Create bucket.


This bucket will hold our files. We will use keys (paths) like:
```text
uploads/<userId>/<timestamp>-<filename> – for original images.
thumbnails/200/<timestamp>-<filename> – for 200px-wide thumbnails.
thumbnails/400/<timestamp>-<filename> – for 400px-wide thumbnails.
```

## Create a dynamodb table
1. In the AWS Console, search for DynamoDB
2. Click Create table.
3. Table name: 
4. Partition key: userId (String). This lets us query all images by a user.
5. Sort key: imageId key. (String). This can be a unique ID we generate for each image (or part of the S3 key)
6. Leave other defaults and create the table

We’ll store items with attributes like:

userId : (String) which user uploaded.
imageId : (String) unique ID for the image (UUID or timestamp-based).
originalKey : (String) S3 key of the original image (from uploads/ folder).
thumb200Key : (String) S3 key of 200px thumbnail (if created).
thumb400Key : (String) S3 key of 400px thumbnail (if created).
status : (String) e.g. "processing" or "done" .
createdAt : (Number) timestamp of upload.

## Create an IAM User for Next.js

1. In AWS Console, go to IAM → Users → Create user.
2. Name: e.g. vercel-nextjs-uploader.
3. Access type: Enable Programmatic access (so we get Access Key ID and Secret).
4. Permissions: For a simple demo, attach AmazonS3FullAccess and AmazonDynamoDBFullAccess. (In production, you’d restrict this tightly to just the uploads/* prefix on your bucket and your table.)
5. Finish and copy the Access Key ID and Secret Access Key. Keep them secret (you’ll put them in .env or Vercel’s dashboard)

## Create an IAM Role for Lambda
1. In IAM, go to Roles → Create role.
2. Trusted entity: Choose AWS service and select Lambda
3. Attach the following policies (for demo simplicity)
4. AmazonS3FullAccess (allows GetObject and PutObject on all buckets).
5. AmazonDynamoDBFullAccess (allows read/write on DynamoDB). (Again, for production one would restrict this to specific bucket ARN and table ARN.)
6. Name it LambdaResizeRole (or similar) and create the role

## Write and Package the Lambda Function
I will use sam cli to create this lambda function 
1. sam init
2.  1 - AWS Quick Start Templates
3. 1 - Hello World Example
4. 11 - nodejs22.x
5.  1 - Zip
6.  2 - Hello World Example TypeScript
7. keep the rest as default

write the code, and build it.
