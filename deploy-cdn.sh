#!/bin/bash

# TTP Agent SDK CDN Deployment Script
# This script uploads the enhanced widget SDK to cdn.talktopc.com

set -e

echo "🚀 Starting TTP Agent SDK CDN Deployment..."

# Configuration
CDN_BASE_URL="https://cdn.talktopc.com"
SDK_VERSION="2.1.0"
LOCAL_DIST_DIR="/home/yinon11/ttp-agent-sdk/dist"
CDN_DOCS_DIR="/home/yinon11/ttp-agent-sdk/cdn-docs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required directories exist
if [ ! -d "$LOCAL_DIST_DIR" ]; then
    print_error "Distribution directory not found: $LOCAL_DIST_DIR"
    print_error "Please run 'npm run build' first"
    exit 1
fi

if [ ! -d "$CDN_DOCS_DIR" ]; then
    print_error "CDN docs directory not found: $CDN_DOCS_DIR"
    exit 1
fi

print_status "Found distribution files in: $LOCAL_DIST_DIR"
print_status "Found CDN documentation in: $CDN_DOCS_DIR"

# Create deployment package
DEPLOY_DIR="/tmp/ttp-agent-sdk-cdn-deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/ttp-agent-sdk"

print_status "Creating deployment package..."

# Copy SDK files
cp "$LOCAL_DIST_DIR/agent-widget.js" "$DEPLOY_DIR/ttp-agent-sdk/"
cp "$LOCAL_DIST_DIR/agent-widget.js.map" "$DEPLOY_DIR/ttp-agent-sdk/"
cp "$LOCAL_DIST_DIR/agent-widget.js.LICENSE.txt" "$DEPLOY_DIR/ttp-agent-sdk/"

# Copy examples
mkdir -p "$DEPLOY_DIR/ttp-agent-sdk/examples"
cp "$LOCAL_DIST_DIR/examples/"* "$DEPLOY_DIR/ttp-agent-sdk/examples/"

# Copy documentation
cp "$CDN_DOCS_DIR/index.html" "$DEPLOY_DIR/ttp-agent-sdk/"

# Create version info file
cat > "$DEPLOY_DIR/ttp-agent-sdk/version.json" << EOF
{
  "version": "$SDK_VERSION",
  "buildDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "files": {
    "agent-widget.js": "$(stat -c%s "$DEPLOY_DIR/ttp-agent-sdk/agent-widget.js")",
    "agent-widget.js.map": "$(stat -c%s "$DEPLOY_DIR/ttp-agent-sdk/agent-widget.js.map")"
  },
  "features": [
    "Enhanced Customizable Widget",
    "Custom Icons (Image, Emoji, Text)",
    "Flexible Positioning",
    "Advanced Styling Options",
    "Glass Morphism Effects",
    "Smooth Animations",
    "Accessibility Support",
    "React Integration",
    "Vanilla JS Support"
  ]
}
EOF

# Create README for CDN
cat > "$DEPLOY_DIR/ttp-agent-sdk/README.md" << EOF
# TTP Agent SDK v$SDK_VERSION - CDN Distribution

This directory contains the TTP Agent SDK files served via CDN.

## Files

- \`agent-widget.js\` - Enhanced widget SDK (minified)
- \`agent-widget.js.map\` - Source map for debugging
- \`agent-widget.js.LICENSE.txt\` - License information
- \`examples/\` - Interactive examples and demos
- \`version.json\` - Version and build information

## Usage

\`\`\`html
<script src="https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js"></script>
<script>
  new TTPAgentSDK.EnhancedAgentWidget({
    agentId: 'your_agent_id',
    getSessionUrl: async ({ agentId, variables }) => {
      // Your session URL logic
    }
  });
</script>
\`\`\`

## Documentation

Visit: https://cdn.talktopc.com/ttp-agent-sdk/

## Version: $SDK_VERSION
Build Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)
EOF

print_success "Deployment package created in: $DEPLOY_DIR"

# Display package contents
print_status "Package contents:"
ls -la "$DEPLOY_DIR/ttp-agent-sdk/"

# Create upload instructions
cat > "$DEPLOY_DIR/UPLOAD_INSTRUCTIONS.md" << EOF
# CDN Upload Instructions

## Files to Upload

Upload the following files to your CDN at \`cdn.talktopc.com\`:

### Main SDK Files
- \`ttp-agent-sdk/agent-widget.js\` → \`https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js\`
- \`ttp-agent-sdk/agent-widget.js.map\` → \`https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js.map\`
- \`ttp-agent-sdk/agent-widget.js.LICENSE.txt\` → \`https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js.LICENSE.txt\`

### Documentation
- \`ttp-agent-sdk/index.html\` → \`https://cdn.talktopc.com/ttp-agent-sdk/index.html\`
- \`ttp-agent-sdk/README.md\` → \`https://cdn.talktopc.com/ttp-agent-sdk/README.md\`
- \`ttp-agent-sdk/version.json\` → \`https://cdn.talktopc.com/ttp-agent-sdk/version.json\`

### Examples
- \`ttp-agent-sdk/examples/\` → \`https://cdn.talktopc.com/ttp-agent-sdk/examples/\`

## CDN Configuration

Ensure your CDN is configured with:
- Content-Type: \`application/javascript\` for .js files
- CORS headers: \`Access-Control-Allow-Origin: *\`
- Cache headers: \`Cache-Control: public, max-age=86400\`

## Testing

After upload, test the CDN:
1. Visit: https://cdn.talktopc.com/ttp-agent-sdk/
2. Check: https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js
3. Verify: https://cdn.talktopc.com/ttp-agent-sdk/version.json

## Rollback

If issues occur, you can rollback by uploading the previous version files.
EOF

print_success "Upload instructions created: $DEPLOY_DIR/UPLOAD_INSTRUCTIONS.md"

# Test CDN connectivity
print_status "Testing CDN connectivity..."
if curl -s -I "$CDN_BASE_URL" > /dev/null; then
    print_success "CDN is accessible at: $CDN_BASE_URL"
else
    print_warning "CDN may not be accessible. Please check your CDN configuration."
fi

# Display next steps
echo ""
print_success "🎉 Deployment package ready!"
echo ""
print_status "Next steps:"
echo "1. Upload files from: $DEPLOY_DIR/ttp-agent-sdk/"
echo "2. Follow instructions in: $DEPLOY_DIR/UPLOAD_INSTRUCTIONS.md"
echo "3. Test the CDN after upload"
echo "4. Verify at: https://cdn.talktopc.com/ttp-agent-sdk/"
echo ""
print_status "Package size: $(du -sh "$DEPLOY_DIR" | cut -f1)"
print_status "SDK version: $SDK_VERSION"
print_status "Build date: $(date)"

echo ""
print_success "✅ CDN deployment package created successfully!"
