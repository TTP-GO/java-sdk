#!/bin/bash

# ============================================
# TTP Agent SDK - NPM Publish Script
# ============================================
# This script automates publishing the package to npm
# 
# How it works:
# 1. Checks for uncommitted changes
# 2. Runs tests (if available)
# 3. Builds the project
# 4. Bumps version in package.json
# 5. Commits version change
# 6. Creates git tag
# 7. Pushes to GitHub with tags
# 8. Publishes to npm
#
# Usage:
#   ./npm_publish.sh [version-type]
#
# Version types:
#   patch - Bug fixes (1.0.0 -> 1.0.1)
#   minor - New features (1.0.0 -> 1.1.0)
#   major - Breaking changes (1.0.0 -> 2.0.0)
#
# Examples:
#   ./npm_publish.sh patch
#   ./npm_publish.sh minor
#   ./npm_publish.sh major
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
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

# Check if version type is provided
VERSION_TYPE="${1}"

print_header "TTP Agent SDK - NPM Publish"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
print_status "Current version: ${MAGENTA}v${CURRENT_VERSION}${NC}"

# If no version type provided, ask user
if [ -z "$VERSION_TYPE" ]; then
    echo ""
    echo "Select version bump type:"
    echo "  1) patch - Bug fixes (v${CURRENT_VERSION} -> v$(npm version patch --no-git-tag-version --dry-run 2>/dev/null | grep -o '[0-9]*\.[0-9]*\.[0-9]*'))"
    echo "  2) minor - New features (v${CURRENT_VERSION} -> v$(npm version minor --no-git-tag-version --dry-run 2>/dev/null | grep -o '[0-9]*\.[0-9]*\.[0-9]*'))"
    echo "  3) major - Breaking changes (v${CURRENT_VERSION} -> v$(npm version major --no-git-tag-version --dry-run 2>/dev/null | grep -o '[0-9]*\.[0-9]*\.[0-9]*'))"
    echo ""
    read -p "Enter choice (1-3): " -n 1 -r
    echo
    
    case $REPLY in
        1) VERSION_TYPE="patch" ;;
        2) VERSION_TYPE="minor" ;;
        3) VERSION_TYPE="major" ;;
        *) 
            print_error "Invalid choice"
            exit 1
            ;;
    esac
fi

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    print_error "Invalid version type. Must be: patch, minor, or major"
    exit 1
fi

# Step 1: Check for uncommitted changes
print_header "Pre-publish Checks"
print_status "Checking for uncommitted changes..."

if [[ -n $(git status -s) ]]; then
    print_error "Found uncommitted changes. Please commit or stash them first."
    git status -s
    exit 1
fi

print_success "No uncommitted changes"

# Step 2: Check if logged into npm
print_status "Checking npm authentication..."

if ! npm whoami &>/dev/null; then
    print_error "Not logged into npm. Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
print_success "Logged in as: ${NPM_USER}"

# Step 3: Run tests (if test script exists)
print_header "Running Tests"

if grep -q '"test"' package.json && ! grep -q '"test": "echo \\"Error: no test specified\\"' package.json; then
    print_status "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
else
    print_warning "No tests configured - skipping"
fi

# Step 4: Build the project
print_header "Building Project"
print_status "Running npm run build..."

if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 5: Verify build output
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

# Step 6: Bump version
print_header "Version Update"
print_status "Bumping version (${VERSION_TYPE})..."

# Update version in package.json
NEW_VERSION=$(npm version $VERSION_TYPE --no-git-tag-version)
NEW_VERSION=${NEW_VERSION#v}  # Remove 'v' prefix

print_success "Version bumped: ${MAGENTA}v${CURRENT_VERSION}${NC} → ${MAGENTA}v${NEW_VERSION}${NC}"

# Step 7: Commit version change
print_status "Committing version change..."
git add package.json package-lock.json
git commit -m "chore: Bump version to v${NEW_VERSION}"
print_success "Version change committed"

# Step 8: Create git tag
print_status "Creating git tag v${NEW_VERSION}..."
git tag -a "v${NEW_VERSION}" -m "Release v${NEW_VERSION}"
print_success "Git tag created"

# Step 9: Final confirmation
print_header "Ready to Publish"
echo -e "${YELLOW}You are about to publish:${NC}"
echo -e "  Package: ${CYAN}$(node -p "require('./package.json').name")${NC}"
echo -e "  Version: ${MAGENTA}v${NEW_VERSION}${NC}"
echo -e "  NPM User: ${CYAN}${NPM_USER}${NC}"
echo ""
read -p "Continue with publish? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Publish cancelled"
    print_status "Rolling back changes..."
    git reset --hard HEAD~1
    git tag -d "v${NEW_VERSION}"
    print_status "Changes rolled back"
    exit 0
fi

# Step 10: Push to GitHub (with tags)
print_header "Pushing to GitHub"
print_status "Pushing commit and tags to GitHub..."

if git push origin master && git push origin "v${NEW_VERSION}"; then
    print_success "Pushed to GitHub successfully"
else
    print_error "Failed to push to GitHub"
    print_warning "You may need to push manually: git push origin master --tags"
    read -p "Continue with npm publish anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 11: Publish to npm
print_header "Publishing to NPM"
print_status "Publishing package to npm..."

if npm publish; then
    print_success "Package published successfully!"
else
    print_error "Failed to publish to npm"
    exit 1
fi

# Step 12: Verify publication
print_status "Verifying publication..."
sleep 3

NPM_VERSION=$(npm view $(node -p "require('./package.json').name") version 2>/dev/null || echo "unknown")
if [ "$NPM_VERSION" = "$NEW_VERSION" ]; then
    print_success "Verified: v${NEW_VERSION} is live on npm"
else
    print_warning "Could not verify publication (may take a few moments to propagate)"
fi

# Final summary
print_header "Publication Summary"

echo -e "${GREEN}🎉 Package published successfully!${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  📦 Package:${NC}      $(node -p "require('./package.json').name")"
echo -e "${GREEN}  🏷️  Version:${NC}      v${NEW_VERSION}"
echo -e "${GREEN}  🔗 NPM:${NC}          https://www.npmjs.com/package/$(node -p "require('./package.json').name")"
echo -e "${GREEN}  📚 GitHub:${NC}       https://github.com/yinon11/ttp-sdk-front"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
print_status "Users can now install with:"
echo -e "  ${CYAN}npm install ttp-agent-sdk@${NEW_VERSION}${NC}"
echo ""
print_status "Don't forget to deploy to CDN if needed:"
echo -e "  ${CYAN}./production_deploy.sh \"Release v${NEW_VERSION}\"${NC}"
echo ""
print_success "✅ Publication completed successfully!"

exit 0

