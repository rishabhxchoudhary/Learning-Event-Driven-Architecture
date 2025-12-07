#!/bin/zsh
# Build and package Lambda function for deployment

set -e

echo "Building SAM application..."
sam build

cd .aws-sam/build/ImageResizeFunction
echo "Zipping build output..."
zip -r -9 ../build.zip .
echo "Moving build.zip to lambda_code.zip..."
mv ../build.zip ../../../lambda_code.zip
echo "Done. Output: lambda_code.zip"