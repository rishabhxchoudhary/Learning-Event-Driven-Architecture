#!/bin/zsh
# Build and package Lambda function for deployment

set -e

echo "Installing Sharp for Lambda runtime..."
./install_sharp.sh

echo "Building SAM application..."
sudo sam build

cd .aws-sam/build/ImageResizeFunction
echo "Zipping build output..."
sudo zip -r -9 ../build.zip .
echo "Moving build.zip to lambda_code.zip..."
sudo mv ../build.zip ../../../lambda_code.zip
echo "Done. Output: lambda_code.zip"