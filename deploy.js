/**
 * 🚀 Deployment Script for Deep Roots Operations Dashboard
 * 
 * This script handles various deployment scenarios:
 * - GitHub Pages
 * - Google Apps Script HTML Service
 * - Static hosting platforms
 */

const fs = require('fs');
const path = require('path');

class DeploymentManager {
    constructor() {
        this.deploymentType = process.env.DEPLOY_TYPE || 'github-pages';
        this.projectRoot = __dirname;
        this.buildDir = path.join(this.projectRoot, 'dist');
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const configPath = path.join(this.projectRoot, 'config.json');
            return JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            console.warn('Could not load config.json, using defaults');
            return {};
        }
    }

    async deploy() {
        console.log(`🚀 Starting ${this.deploymentType} deployment...`);
        
        try {
            // Create build directory
            this.ensureBuildDir();
            
            // Copy and optimize files
            await this.prepareFiles();
            
            // Generate deployment-specific files
            switch (this.deploymentType) {
                case 'github-pages':
                    await this.deployToGitHubPages();
                    break;
                case 'google-apps-script':
                    await this.deployToGoogleAppsScript();
                    break;
                case 'static':
                    await this.deployStatic();
                    break;
                default:
                    throw new Error(`Unknown deployment type: ${this.deploymentType}`);
            }
            
            console.log('✅ Deployment completed successfully!');
        } catch (error) {
            console.error('❌ Deployment failed:', error);
            process.exit(1);
        }
    }

    ensureBuildDir() {
        if (fs.existsSync(this.buildDir)) {
            fs.rmSync(this.buildDir, { recursive: true });
        }
        fs.mkdirSync(this.buildDir, { recursive: true });
    }

    async prepareFiles() {
        console.log('📦 Preparing files...');
        
        // Copy main files
        this.copyFile('index.html');
        this.copyFile('config.json');
        
        // Copy directories
        this.copyDirectory('styles');
        this.copyDirectory('js');
        
        // Minify CSS and JS for production
        if (process.env.NODE_ENV === 'production') {
            await this.optimizeFiles();
        }
    }

    copyFile(filename) {
        const src = path.join(this.projectRoot, filename);
        const dest = path.join(this.buildDir, filename);
        
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`  ✓ Copied ${filename}`);
        } else {
            console.warn(`  ⚠️  File not found: ${filename}`);
        }
    }

    copyDirectory(dirname) {
        const src = path.join(this.projectRoot, dirname);
        const dest = path.join(this.buildDir, dirname);
        
        if (fs.existsSync(src)) {
            fs.mkdirSync(dest, { recursive: true });
            this.copyDirectoryRecursive(src, dest);
            console.log(`  ✓ Copied ${dirname}/`);
        } else {
            console.warn(`  ⚠️  Directory not found: ${dirname}`);
        }
    }

    copyDirectoryRecursive(src, dest) {
        const items = fs.readdirSync(src);
        
        items.forEach(item => {
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            
            if (fs.statSync(srcPath).isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                this.copyDirectoryRecursive(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }

    async optimizeFiles() {
        console.log('⚡ Optimizing files...');
        
        // Basic minification (can be enhanced with proper tools)
        const cssFiles = this.findFiles(path.join(this.buildDir, 'styles'), '.css');
        const jsFiles = this.findFiles(path.join(this.buildDir, 'js'), '.js');
        
        // Remove comments and extra whitespace
        [...cssFiles, ...jsFiles].forEach(file => {
            let content = fs.readFileSync(file, 'utf8');
            
            // Remove comments
            content = content.replace(/\/\*[\s\S]*?\*\//g, '');
            content = content.replace(/\/\/.*$/gm, '');
            
            // Remove extra whitespace
            content = content.replace(/\s+/g, ' ').trim();
            
            fs.writeFileSync(file, content);
        });
    }

    findFiles(dir, extension) {
        const files = [];
        
        if (!fs.existsSync(dir)) return files;
        
        const items = fs.readdirSync(dir);
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            if (fs.statSync(itemPath).isDirectory()) {
                files.push(...this.findFiles(itemPath, extension));
            } else if (item.endsWith(extension)) {
                files.push(itemPath);
            }
        });
        
        return files;
    }

    async deployToGitHubPages() {
        console.log('🔄 Configuring for GitHub Pages...');
        
        // Create .nojekyll file
        fs.writeFileSync(path.join(this.buildDir, '.nojekyll'), '');
        
        // Create CNAME file if custom domain is configured
        if (this.config.deployment?.domain) {
            fs.writeFileSync(
                path.join(this.buildDir, 'CNAME'), 
                this.config.deployment.domain
            );
        }
        
        console.log('✅ GitHub Pages configuration complete');
        console.log('📋 Next steps:');
        console.log('   1. Copy contents of dist/ to your repository');
        console.log('   2. Enable GitHub Pages in repository settings');
        console.log('   3. Choose "Deploy from a branch" -> main/docs');
    }

    async deployToGoogleAppsScript() {
        console.log('🔄 Configuring for Google Apps Script...');
        
        // Create Apps Script manifest
        const manifest = {
            timeZone: "America/New_York",
            dependencies: {},
            webapp: {
                access: "ANYONE",
                executeAs: "USER_DEPLOYING"
            },
            runtimeVersion: "V8"
        };
        
        fs.writeFileSync(
            path.join(this.buildDir, 'appsscript.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        // Create Code.gs file
        const codeGs = `
function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  
  // Pass any URL parameters to the template
  template.params = e.parameter;
  
  return template.evaluate()
    .setTitle('Deep Roots Operations Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Helper functions for the dashboard
function getDashboardConfig() {
  try {
    const config = include('config.json');
    return JSON.parse(config);
  } catch (error) {
    console.error('Error loading config:', error);
    return {};
  }
}

function logDashboardUsage(toolId, action) {
  try {
    const sheet = SpreadsheetApp.openById('YOUR_ANALYTICS_SHEET_ID');
    const logSheet = sheet.getSheetByName('Dashboard_Usage') || sheet.insertSheet('Dashboard_Usage');
    
    logSheet.appendRow([
      new Date(),
      Session.getActiveUser().getEmail(),
      toolId,
      action,
      JSON.stringify(Session.getActiveUser().getEmail())
    ]);
  } catch (error) {
    console.warn('Could not log usage:', error);
  }
}
`;
        
        fs.writeFileSync(path.join(this.buildDir, 'Code.gs'), codeGs);
        
        console.log('✅ Google Apps Script configuration complete');
        console.log('📋 Next steps:');
        console.log('   1. Create new Google Apps Script project');
        console.log('   2. Copy all files from dist/ to the project');
        console.log('   3. Deploy as web app');
        console.log('   4. Update tool URLs in config.json');
    }

    async deployStatic() {
        console.log('🔄 Configuring for static hosting...');
        
        // Create _redirects file for SPA routing (Netlify)
        const redirects = `
/*    /index.html   200
/api/*  https://script.google.com/:splat  200
        `;
        fs.writeFileSync(path.join(this.buildDir, '_redirects'), redirects.trim());
        
        // Create vercel.json for Vercel
        const vercelConfig = {
            "version": 2,
            "name": "deep-roots-dashboard",
            "builds": [
                {
                    "src": "index.html",
                    "use": "@vercel/static"
                }
            ],
            "routes": [
                {
                    "src": "/(.*)",
                    "dest": "/index.html"
                }
            ]
        };
        
        fs.writeFileSync(
            path.join(this.buildDir, 'vercel.json'),
            JSON.stringify(vercelConfig, null, 2)
        );
        
        console.log('✅ Static hosting configuration complete');
        console.log('📋 Deployment options:');
        console.log('   • Netlify: drag dist/ folder to netlify.app/drop');
        console.log('   • Vercel: vercel --prod');
        console.log('   • Firebase: firebase deploy');
    }

    generateManifest() {
        const manifest = {
            name: this.config.app?.name || "Deep Roots Operations Dashboard",
            short_name: "Deep Roots",
            description: this.config.app?.description || "Unified operational tools dashboard",
            start_url: "/",
            display: "standalone",
            background_color: "#1a1b23",
            theme_color: "#4CAF50",
            icons: [
                {
                    src: "icon-192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    src: "icon-512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ]
        };
        
        fs.writeFileSync(
            path.join(this.buildDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployer = new DeploymentManager();
    deployer.deploy();
}

module.exports = DeploymentManager;