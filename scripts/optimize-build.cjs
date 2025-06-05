#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Build optimization and monitoring script
 */

const DIST_PATH = path.join(__dirname, '../dist/public');
const ASSETS_PATH = path.join(DIST_PATH, 'assets');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function analyzeBundle() {
  console.log('🔍 Analyzing build output...\n');
  
  if (!fs.existsSync(ASSETS_PATH)) {
    console.log('❌ No build found. Run npm run build:client first.');
    return;
  }
  
  const files = fs.readdirSync(ASSETS_PATH);
  const jsFiles = files.filter(file => file.endsWith('.js'));
  const cssFiles = files.filter(file => file.endsWith('.css'));
  
  let totalJSSize = 0;
  let totalCSSSize = 0;
  
  console.log('📦 JavaScript Bundles:');
  jsFiles.forEach(file => {
    const filePath = path.join(ASSETS_PATH, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalJSSize += size;
    
    let category = '📄 Other';
    if (file.includes('vendor-react')) category = '⚛️  React';
    else if (file.includes('vendor-ui')) category = '🎨 UI Components';
    else if (file.includes('vendor-forms')) category = '📝 Forms';
    else if (file.includes('vendor-charts')) category = '📊 Charts';
    else if (file.includes('vendor-editor')) category = '✏️  Editor';
    else if (file.includes('vendor-utils')) category = '🔧 Utils';
    else if (file.includes('index-')) category = '🏠 Main App';
    
    console.log(`  ${category}: ${file} - ${formatBytes(size)}`);
  });
  
  console.log(`\n🎨 CSS Bundles:`);
  cssFiles.forEach(file => {
    const filePath = path.join(ASSETS_PATH, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalCSSSize += size;
    
    console.log(`  📄 ${file} - ${formatBytes(size)}`);
  });
  
  console.log('\n📊 Summary:');
  console.log(`  Total JavaScript: ${formatBytes(totalJSSize)}`);
  console.log(`  Total CSS: ${formatBytes(totalCSSSize)}`);
  console.log(`  Total Assets: ${formatBytes(totalJSSize + totalCSSSize)}`);
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (totalJSSize > 3 * 1024 * 1024) {
    console.log('  ⚠️  JavaScript bundles are large (>3MB). Consider:');
    console.log('     - More aggressive code splitting');
    console.log('     - Lazy loading of heavy components');
    console.log('     - Tree shaking optimization');
  } else if (totalJSSize > 2 * 1024 * 1024) {
    console.log('  ✅ JavaScript bundle size is reasonable but could be optimized');
  } else {
    console.log('  ✅ JavaScript bundle size is well optimized');
  }
  
  if (totalCSSSize > 200 * 1024) {
    console.log('  ⚠️  CSS bundle is large (>200KB). Consider:');
    console.log('     - PurgeCSS for unused styles');
    console.log('     - CSS splitting by route');
  } else {
    console.log('  ✅ CSS bundle size is reasonable');
  }
  
  // Check for specific optimizations
  const hasVendorSplitting = jsFiles.some(f => f.includes('vendor-'));
  if (hasVendorSplitting) {
    console.log('  ✅ Vendor code splitting is active');
  } else {
    console.log('  ⚠️  No vendor code splitting detected');
  }
  
  console.log('\n🚀 Next steps to improve performance:');
  console.log('  1. Enable gzip compression on your server');
  console.log('  2. Set up proper cache headers for static assets');
  console.log('  3. Consider using a CDN for asset delivery');
  console.log('  4. Implement service worker for caching');
  console.log('  5. Use image optimization (WebP, lazy loading)');
}

// Check for common performance issues
function checkPerformanceIssues() {
  console.log('\n🔍 Checking for common performance issues...\n');
  
  // Check robots.txt
  const robotsPath = path.join(__dirname, '../public/robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf8');
    if (robotsContent.includes('<!DOCTYPE html>')) {
      console.log('❌ robots.txt contains HTML content instead of robots directives');
    } else {
      console.log('✅ robots.txt is properly configured');
    }
  } else {
    console.log('⚠️  No robots.txt found');
  }
  
  // Check sitemap
  const sitemapPath = path.join(__dirname, '../public/sitemap.xml');
  if (fs.existsSync(sitemapPath)) {
    console.log('✅ sitemap.xml exists');
  } else {
    console.log('⚠️  No sitemap.xml found');
  }
  
  // Check index.html for meta tags
  const indexPath = path.join(__dirname, '../client/index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    
    if (indexContent.includes('meta name="description"')) {
      console.log('✅ Meta description is present');
    } else {
      console.log('❌ Missing meta description');
    }
    
    if (indexContent.includes('rel="preload"')) {
      console.log('✅ Resource preloading is configured');
    } else {
      console.log('⚠️  No resource preloading detected');
    }
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 ProsumeAI Build Performance Analyzer\n');
  analyzeBundle();
  checkPerformanceIssues();
  console.log('\n✨ Analysis complete!\n');
}

module.exports = { analyzeBundle, checkPerformanceIssues }; 