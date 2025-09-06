# 🚀 Deployment Guide

This guide covers all deployment options for the Deep Roots Operations Dashboard.

## 📋 Prerequisites

Before deploying, ensure you have:
- ✅ All 4 Google Apps Script tools deployed as web apps
- ✅ Tool URLs ready for configuration
- ✅ Basic understanding of your chosen deployment platform

## 🎯 Quick Deploy Options

### 1. GitHub Pages (Recommended - Free & Easy)

**Perfect for**: Small teams, quick setup, automatic updates

```bash
# 1. Fork/clone this repository
git clone <your-repo-url>
cd dashboard

# 2. Configure your tool URLs in config.json
# Edit: services.inventory.url, services.grading.url, etc.

# 3. Build and deploy
npm install
npm run build
npm run deploy

# 4. Enable GitHub Pages
# Go to Settings > Pages > Source: GitHub Actions
```

**Access**: `https://yourusername.github.io/repository-name`

### 2. One-Click Netlify Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy)

**Perfect for**: Custom domains, form handling, advanced features

### 3. Vercel Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

**Perfect for**: Edge deployment, fast global CDN, serverless functions

## 🔧 Detailed Setup Instructions

### GitHub Pages Setup

1. **Repository Setup**
   ```bash
   # Create repository from template
   gh repo create deep-roots-dashboard --template=this-repo --public
   cd deep-roots-dashboard
   ```

2. **Configure Tools**
   ```bash
   # Edit config.json with your URLs
   nano config.json
   ```

3. **Deploy**
   ```bash
   npm run build
   git add .
   git commit -m "Deploy dashboard"
   git push origin main
   ```

4. **Enable Pages**
   - Go to repository Settings
   - Navigate to Pages section
   - Source: GitHub Actions
   - Wait for deployment (2-3 minutes)

### Google Apps Script Deployment

**Perfect for**: Google Workspace integration, enterprise settings

1. **Prepare Files**
   ```bash
   npm run build:gas
   ```

2. **Create Apps Script Project**
   - Visit [script.google.com](https://script.google.com)
   - New Project → "Deep Roots Dashboard"

3. **Upload Files**
   - Copy content from `dist/` folder
   - Create files: `Code.gs`, `index.html`, `config.json`
   - Copy CSS/JS content inline or as separate HTML files

4. **Deploy as Web App**
   - Click Deploy → New Deployment
   - Type: Web app
   - Execute as: User accessing
   - Access: Anyone
   - Deploy → Copy URL

### Self-Hosted Deployment

**Perfect for**: Full control, custom integrations, enterprise needs

```bash
# Using Docker
docker build -t deep-roots-dashboard .
docker run -p 8080:80 deep-roots-dashboard

# Using Node.js server
npm install -g http-server
npm run build
http-server dist/ -p 8080

# Using Apache/Nginx
# Copy dist/ contents to web server root
cp -r dist/* /var/www/html/
```

## ⚙️ Configuration

### Tool URL Configuration

Each Google Apps Script tool must be deployed as a web app:

1. **Open Apps Script project**
2. **Deploy → New Deployment**
3. **Settings:**
   - Type: Web app
   - Execute as: User accessing the web app
   - Who has access: Anyone
4. **Copy deployment URL**
5. **Add to config.json:**

```json
{
  "services": {
    "inventory": {
      "url": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    },
    "grading": {
      "url": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    },
    "scheduler": {
      "url": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    },
    "tools": {
      "url": "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
    }
  }
}
```

### Domain Configuration

#### Custom Domain (GitHub Pages)
```bash
# Add CNAME file
echo "dashboard.deeproots.com" > dist/CNAME
```

#### Environment Variables
```bash
# .env file
NODE_ENV=production
DEPLOY_TYPE=github-pages
DOMAIN=dashboard.deeproots.com
ANALYTICS_ID=G-XXXXXXXXXX
```

## 🔒 Security Setup

### HTTPS Configuration
All deployments automatically use HTTPS, but verify:
- ✅ Force HTTPS in hosting settings
- ✅ Update Google Apps Script CORS settings
- ✅ Use HTTPS URLs in all configurations

### Access Control
```javascript
// Add to Google Apps Script tools
function checkAccess() {
  const allowedDomains = [
    'yourusername.github.io',
    'dashboard.deeproots.com'
  ];
  
  const origin = getOrigin();
  return allowedDomains.some(domain => origin.includes(domain));
}
```

## 📊 Analytics Setup

### Google Analytics
```html
<!-- Add to index.html <head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Usage Tracking
Dashboard automatically tracks:
- Tool usage statistics
- Search queries (anonymized)
- Performance metrics
- Error reports

## 🚨 Troubleshooting

### Common Issues

#### 1. Tool URLs Not Working
```bash
# Check CORS settings in Google Apps Script
# Verify deployment settings
# Test URLs directly in browser
```

#### 2. GitHub Pages Not Updating
```bash
# Check Actions tab for build status
# Clear browser cache
# Verify GitHub Pages is enabled
```

#### 3. Mobile Issues
```bash
# Check viewport meta tag
# Test on actual devices
# Verify responsive CSS
```

### Debug Mode
Add `?debug=true` to any deployment URL for detailed logging:
```
https://yourusername.github.io/dashboard?debug=true
```

### Health Check
Built-in health check endpoint:
```
https://your-dashboard.com/api/health
```

## 🔄 Updates & Maintenance

### Automatic Updates (GitHub)
Dashboard automatically updates when you push to main branch:
```bash
git add .
git commit -m "Update dashboard"
git push origin main
# Wait 2-3 minutes for deployment
```

### Manual Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and deploy
npm run build
npm run deploy
```

### Rollback Deployment
```bash
# GitHub: Go to Actions → Re-run previous successful deployment
# Manual: git revert HEAD && git push
```

## 📈 Performance Optimization

### Build Optimization
```bash
# Enable production optimizations
NODE_ENV=production npm run build

# Analyze bundle size
npm run analyze
```

### Caching Strategy
- ✅ CSS/JS assets cached for 1 year
- ✅ HTML cached for 1 hour
- ✅ API responses cached for 5 minutes
- ✅ Service worker for offline support

## 🆘 Support

### Getting Help
1. **Check deployment logs** in GitHub Actions
2. **Review browser console** for errors
3. **Test individual tool URLs** directly
4. **Verify Google Apps Script** permissions

### Emergency Fixes
```bash
# Quick config fix via GitHub web interface
# Edit config.json directly in browser
# Changes deploy automatically
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] All 4 tools deployed as Google Apps Script web apps
- [ ] Tool URLs configured in config.json
- [ ] Custom domain configured (if needed)
- [ ] HTTPS enforced
- [ ] Analytics setup (optional)
- [ ] Mobile testing completed
- [ ] Team access verified
- [ ] Backup procedures documented

**🎉 Ready to deploy? Choose your option above and get started!**