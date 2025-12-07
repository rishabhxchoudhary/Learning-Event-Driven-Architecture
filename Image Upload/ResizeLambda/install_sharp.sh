#!/bin/bash

# Install Sharp for Lambda (Linux runtime)
echo "Installing Sharp for Lambda runtime..."

cd lambda_code

# Remove existing sharp and node_modules
rm -rf node_modules
rm -f package-lock.json

# Install dependencies including Sharp for Linux
npm install

# Install Sharp specifically for Lambda runtime
npm install --platform=linux --arch=x64 sharp

echo "Sharp installation complete for Lambda runtime"