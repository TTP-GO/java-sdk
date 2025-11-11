#!/bin/bash

# ============================================
# TTP Agent SDK - Production Deployment Script
# ============================================
# This script automates the deployment process to Cloudflare Pages
# 
# How it works:
# 1. Builds the project
# 2. Commits changes
# 3. Pushes to GitHub
# 4. Cloudflare Pages auto-deploys from GitHub
#
# Usage:
#   ./production_deploy.sh [commit-message]
#
# Example:
#   ./production_deploy.sh "Updated documentation styling"
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}\n"
}

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

# Check if commit message is provided
COMMIT_MESSAGE="${1:-chore: Production deployment}"

print_header "TTP Agent SDK - Production Deployment"

# Step 1: Check for uncommitted changes
print_status "Checking for uncommitted changes..."
if [[ -n $(git status -s) ]]; then
    print_warning "Found uncommitted changes:"
    git status -s
    echo ""
    read -p "Do you want to commit these changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Staging all changes..."
        git add -A
        
        print_status "Committing with message: \"$COMMIT_MESSAGE\""
        git commit -m "$COMMIT_MESSAGE"
        print_success "Changes committed"
    else
        print_error "Deployment cancelled - uncommitted changes remain"
        exit 1
    fi
else
    print_success "No uncommitted changes"
fi

# Step 2: Build the project
print_header "Building Project"
print_status "Running npm run build..."

if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 3: Check if dist files exist
print_status "Verifying build output..."
REQUIRED_FILES=("dist/agent-widget.js" "dist/index.html" "dist/styles.css" "dist/script.js")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "✓ $file exists"
    else
        print_error "✗ $file is missing"
        exit 1
    fi
done

# Step 4: Push to GitHub
print_header "Pushing to GitHub"
print_status "Current branch: $(git branch --show-current)"
print_status "Pushing to origin/master..."

if git push origin master; then
    print_success "Pushed to GitHub successfully"
else
    print_error "Failed to push to GitHub"
    exit 1
fi

# Step 5: Deployment info
print_header "Cloudflare Pages Deployment"
print_success "✅ Code pushed to GitHub"
print_status "Cloudflare Pages will automatically deploy from GitHub"
print_status "Monitor deployment at: https://dash.cloudflare.com"
echo ""
print_status "Waiting 10 seconds before testing endpoints..."
sleep 10

# Step 6: Test deployment (may take a minute to propagate)
print_header "Testing CDN Endpoints"
print_warning "Note: It may take 1-2 minutes for the new deployment to go live"
echo ""

TEST_URLS=(
    "https://cdn.talktopc.com/ttp-agent-sdk/"
    "https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js"
    "https://cdn.talktopc.com/ttp-agent-sdk/styles.css"
    "https://cdn.talktopc.com/ttp-agent-sdk/script.js"
)

ALL_TESTS_PASSED=true

for url in "${TEST_URLS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "✓ $url - OK ($HTTP_CODE)"
    else
        print_warning "⚠ $url - ($HTTP_CODE) - May still be deploying"
        ALL_TESTS_PASSED=false
    fi
done

# Final summary
print_header "Deployment Summary"

echo -e "${GREEN}🎉 Code pushed successfully!${NC}"
echo ""
echo -e "${CYAN}Cloudflare Pages is now building and deploying your changes.${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  📚 Documentation:${NC}  https://cdn.talktopc.com/ttp-agent-sdk/"
echo -e "${GREEN}  📦 SDK File:${NC}       https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js"
echo -e "${GREEN}  🎨 Widget Demo:${NC}    https://cdn.talktopc.com/ttp-agent-sdk/examples/test-text-chat.html"
echo -e "${GREEN}  🔧 Dashboard:${NC}      https://dash.cloudflare.com"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$ALL_TESTS_PASSED" = false ]; then
    print_warning "Some endpoints returned non-200 status codes"
    print_status "This is normal if deployment is still in progress"
    print_status "Wait 1-2 minutes and refresh: https://cdn.talktopc.com/ttp-agent-sdk/"
fi

echo ""
print_status "Users can include the SDK with:"
echo -e "  ${CYAN}<script src=\"https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js\"></script>${NC}"
echo ""
print_success "✅ Deployment initiated successfully!"

exit 0
