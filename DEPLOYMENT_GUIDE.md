# Production Deployment Guide

This guide explains how to deploy the TTP Agent SDK to production (Cloudflare Pages CDN).

## Quick Deploy

For a standard deployment with automatic commit:

```bash
./production_deploy.sh
```

With a custom commit message:

```bash
./production_deploy.sh "Updated widget styling and fixed mobile responsiveness"
```

## What the Script Does

The `production_deploy.sh` script automates the entire deployment process:

1. ✅ **Checks for uncommitted changes** - Prompts you to commit if needed
2. 🔨 **Builds the project** - Runs `npm run build`
3. ✔️ **Verifies build output** - Ensures all required files exist
4. 📤 **Pushes to GitHub** - Updates the `master` branch
5. 🚀 **Triggers Cloudflare deployment** - Via Cloudflare API
6. 👀 **Monitors deployment** - Real-time status updates
7. 🧪 **Tests CDN endpoints** - Verifies files are accessible

## Prerequisites

- **Node.js** installed (for `npm run build`)
- **Git** configured with push access
- **Cloudflare API Token** with Pages:Edit permission (already configured in script)

## Deployment Steps (Manual)

If you prefer to deploy manually without the script:

### 1. Build the Project

```bash
npm run build
```

### 2. Commit Changes

```bash
git add -A
git commit -m "Your commit message"
```

### 3. Push to GitHub

```bash
git push origin master
```

### 4. Monitor Deployment

- Cloudflare Pages will automatically detect the push and start building
- Visit: https://dash.cloudflare.com/pages
- Click on "ttp-sdk-front" project to see deployment status

## Environment Variables

The script uses these environment variables (with defaults):

```bash
CLOUDFLARE_API_TOKEN="your_token_here"  # Already set in script
CLOUDFLARE_ACCOUNT_ID="a1658096528eef5519b66755bbcfaa9b"
CLOUDFLARE_PROJECT_NAME="ttp-sdk-front"
```

To use a different API token:

```bash
export CLOUDFLARE_API_TOKEN="your_new_token"
./production_deploy.sh
```

## Deployment URLs

After successful deployment, your SDK will be available at:

- **Documentation:** https://cdn.talktopc.com/ttp-agent-sdk/
- **SDK File:** https://cdn.talktopc.com/ttp-agent-sdk/agent-widget.js
- **Widget Demo:** https://cdn.talktopc.com/ttp-agent-sdk/examples/test-text-chat.html

## Troubleshooting

### Build Fails

**Problem:** `npm run build` fails

**Solution:**
```bash
# Clear node_modules and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Push to GitHub Fails

**Problem:** Git push is rejected

**Solutions:**
```bash
# Pull latest changes first
git pull origin master --rebase
git push origin master

# Or force push (use with caution!)
git push origin master --force
```

### Cloudflare Deployment Fails

**Problem:** Deployment stuck or failing

**Solutions:**
1. Check Cloudflare Pages dashboard: https://dash.cloudflare.com
2. Verify build command in Cloudflare settings: `npm run build`
3. Verify output directory in Cloudflare settings: `dist`
4. Check build logs in Cloudflare dashboard

### CSS Not Applied

**Problem:** Documentation page loads but has no styling

**Solutions:**
1. **Clear browser cache:** Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Purge Cloudflare cache:**
   - Go to: https://dash.cloudflare.com
   - Select your domain → Caching → Configuration
   - Click "Purge Everything"
3. **Verify webpack config:**
   - Ensure `styles.css` and `script.js` are in `CopyWebpackPlugin` patterns
   - Run `npm run build` and check `dist/` folder

### API Token Issues

**Problem:** Cloudflare API calls fail with 403/401 errors

**Solutions:**
1. **Regenerate API token:**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Create new token with "Edit Cloudflare Workers" permissions
   - Update token in `production_deploy.sh`
2. **Verify token permissions:**
   - Account → Cloudflare Pages → Edit

## Build Configuration

The project uses webpack to build. Key files:

- `webpack.config.js` - Build configuration
- `package.json` - Build scripts and dependencies
- `src/` - Source code
- `dist/` - Build output (deployed to CDN)

### Important Webpack Settings

```javascript
// webpack.config.js
plugins: [
  new CopyWebpackPlugin({
    patterns: [
      { from: 'index.html', to: 'index.html' },
      { from: 'styles.css', to: 'styles.css' },      // Documentation CSS
      { from: 'script.js', to: 'script.js' },        // Documentation JS
      { from: 'examples', to: 'examples' },
      { from: 'src/audio-processor.js', to: 'audio-processor.js' },
      { from: '_headers', to: '_headers' }            // Cloudflare Pages headers
    ]
  })
]
```

### CORS Headers Configuration

**⚠️ IMPORTANT:** The `audio-processor.js` file requires CORS headers to work properly with AudioWorklet when loaded from a CDN.

The `_headers` file configures Cloudflare Pages to add CORS headers:

```
/audio-processor.js
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Content-Type: application/javascript
```

This file is automatically copied to the `dist/` directory during build and deployed to Cloudflare Pages.

**Verification:**
```bash
curl -I https://cdn.talktopc.com/audio-processor.js
# Should show: access-control-allow-origin: *
```

## Cloudflare Pages Configuration

Current settings for the `ttp-sdk-front` project:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** (empty - uses repo root)
- **Node version:** Uses latest compatible version
- **Environment variables:** None required

## Version Management

To deploy a new version:

1. **Update version in `package.json`:**
   ```bash
   npm version patch  # or minor, or major
   ```

2. **Deploy:**
   ```bash
   ./production_deploy.sh "Release v2.3.2"
   ```

3. **Publish to npm (if needed):**
   ```bash
   npm publish
   ```

## Rollback Procedure

If a deployment causes issues:

### Option 1: Revert via Git

```bash
# Find the last good commit
git log --oneline

# Revert to that commit
git revert <commit-hash>
git push origin master
```

### Option 2: Rollback in Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com/pages
2. Click on "ttp-sdk-front" project
3. Go to "Deployments" tab
4. Find the last good deployment
5. Click "..." → "Rollback to this deployment"

## CI/CD Integration (Future Enhancement)

Currently, deployment is triggered manually. To automate:

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
```

Cloudflare Pages will auto-deploy on push.

## Security Notes

⚠️ **IMPORTANT:** The Cloudflare API token in the script has full access to your Pages. 

**Best practices:**
1. Rotate the token regularly
2. Use environment variables instead of hardcoding
3. Restrict token permissions to only Pages:Edit
4. Never commit tokens to public repositories

## Support

For issues or questions:
- Check deployment logs in Cloudflare dashboard
- Review webpack build output for errors
- Contact support at: support@talktopc.com

---

**Last Updated:** November 11, 2025  
**Script Version:** 1.0.0

