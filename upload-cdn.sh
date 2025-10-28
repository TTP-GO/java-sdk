#!/bin/bash

# Simple CDN Upload Script for TTP Agent SDK
# This script uploads files to cdn.talktopc.com using curl

set -e

# Configuration
CDN_BASE_URL="https://cdn.talktopc.com"
DEPLOY_DIR="/tmp/ttp-agent-sdk-cdn-deploy/ttp-agent-sdk"
SDK_VERSION="2.1.0"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if deploy directory exists
if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Deploy directory not found: $DEPLOY_DIR"
    print_error "Please run deploy-cdn.sh first"
    exit 1
fi

print_status "Starting CDN upload for TTP Agent SDK v$SDK_VERSION..."

# Function to upload a file
upload_file() {
    local local_file="$1"
    local remote_path="$2"
    local content_type="$3"
    
    if [ ! -f "$local_file" ]; then
        print_error "File not found: $local_file"
        return 1
    fi
    
    print_status "Uploading: $local_file → $remote_path"
    
    # Upload using curl
    curl -X PUT \
         -H "Content-Type: $content_type" \
         -H "Cache-Control: public, max-age=86400" \
         -H "Access-Control-Allow-Origin: *" \
         --data-binary "@$local_file" \
         "$CDN_BASE_URL$remote_path" \
         --fail \
         --silent \
         --show-error
    
    if [ $? -eq 0 ]; then
        print_success "Uploaded: $remote_path"
    else
        print_error "Failed to upload: $remote_path"
        return 1
    fi
}

# Upload main SDK files
print_status "Uploading main SDK files..."

upload_file "$DEPLOY_DIR/agent-widget.js" "/ttp-agent-sdk/agent-widget.js" "application/javascript"
upload_file "$DEPLOY_DIR/agent-widget.js.map" "/ttp-agent-sdk/agent-widget.js.map" "application/json"
upload_file "$DEPLOY_DIR/agent-widget.js.LICENSE.txt" "/ttp-agent-sdk/agent-widget.js.LICENSE.txt" "text/plain"

# Upload documentation
print_status "Uploading documentation..."

upload_file "$DEPLOY_DIR/index.html" "/ttp-agent-sdk/index.html" "text/html"
upload_file "$DEPLOY_DIR/README.md" "/ttp-agent-sdk/README.md" "text/markdown"
upload_file "$DEPLOY_DIR/version.json" "/ttp-agent-sdk/version.json" "application/json"

# Upload examples
print_status "Uploading examples..."

for example_file in "$DEPLOY_DIR/examples"/*; do
    if [ -f "$example_file" ]; then
        filename=$(basename "$example_file")
        extension="${filename##*.}"
        
        case "$extension" in
            "html")
                content_type="text/html"
                ;;
            "js")
                content_type="application/javascript"
                ;;
            "jsx")
                content_type="text/javascript"
                ;;
            *)
                content_type="text/plain"
                ;;
        esac
        
        upload_file "$example_file" "/ttp-agent-sdk/examples/$filename" "$content_type"
    fi
done

print_success "🎉 All files uploaded successfully!"

# Test the uploads
print_status "Testing uploaded files..."

test_urls=(
    "/ttp-agent-sdk/"
    "/ttp-agent-sdk/agent-widget.js"
    "/ttp-agent-sdk/version.json"
    "/ttp-agent-sdk/examples/enhanced-widget-examples.html"
)

for url in "${test_urls[@]}"; do
    print_status "Testing: $CDN_BASE_URL$url"
    if curl -s -I "$CDN_BASE_URL$url" | grep -q "200 OK"; then
        print_success "✓ $url is accessible"
    else
        print_error "✗ $url is not accessible"
    fi
done

echo ""
print_success "✅ CDN upload completed!"
print_status "SDK Documentation: https://cdn.talktopc.com/ttp-agent-sdk/"
print_status "SDK File: https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js"
print_status "Version Info: https://cdn.talktopc.com/ttp-agent-sdk/version.json"
print_status "Examples: https://cdn.talktopc.com/ttp-agent-sdk/examples/"
echo ""
print_status "Users can now use:"
echo "  <script src=\"https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js\"></script>"
