#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('🔄 Migrating blog images to protected storage...');

// Define paths
const publicBlogImagesDir = path.join(process.cwd(), 'public', 'images', 'blog');
const publicBlogUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'blog');
const protectedBlogDir = path.join(process.cwd(), 'server', 'uploads', 'blog');

// Create protected directories
const protectedDirs = [
  path.join(protectedBlogDir, 'featured'),
  path.join(protectedBlogDir, 'images'),
  path.join(protectedBlogDir, 'videos'),
  path.join(protectedBlogDir, 'audio'),
  path.join(protectedBlogDir, 'documents'),
  path.join(protectedBlogDir, 'other')
];

protectedDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Move featured images from public/images/blog to server/uploads/blog/featured
if (fs.existsSync(publicBlogImagesDir)) {
  const featuredImages = fs.readdirSync(publicBlogImagesDir);
  featuredImages.forEach(filename => {
    const sourcePath = path.join(publicBlogImagesDir, filename);
    const destPath = path.join(protectedBlogDir, 'featured', filename);
    
    if (fs.statSync(sourcePath).isFile()) {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`📷 Moved featured image: ${filename}`);
    }
  });
  
  console.log(`✅ Moved ${featuredImages.length} featured images`);
}

// Move media files from public/uploads/blog to server/uploads/blog
if (fs.existsSync(publicBlogUploadsDir)) {
  const mediaTypes = ['images', 'videos', 'audio', 'documents', 'other'];
  
  mediaTypes.forEach(type => {
    const sourceTypeDir = path.join(publicBlogUploadsDir, type);
    const destTypeDir = path.join(protectedBlogDir, type);
    
    if (fs.existsSync(sourceTypeDir)) {
      const files = fs.readdirSync(sourceTypeDir);
      files.forEach(filename => {
        const sourcePath = path.join(sourceTypeDir, filename);
        const destPath = path.join(destTypeDir, filename);
        
        if (fs.statSync(sourcePath).isFile()) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`📁 Moved ${type} file: ${filename}`);
        }
      });
      
      console.log(`✅ Moved ${files.length} ${type} files`);
    }
  });
}

console.log('🎉 Blog image migration completed!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Test that blog images still display correctly');
console.log('2. Remove the old public blog directories once confirmed:');
console.log('   - rm -rf public/images/blog');
console.log('   - rm -rf public/uploads/blog');
console.log('');
console.log('🔒 Your blog images are now protected from direct download!'); 