# Blog Images Fix Documentation

## Problem Description

**Issue**: Featured images for blog posts disappeared every time Docker containers were rebuilt.

**Root Cause**: Blog images were being stored inside the Docker container filesystem (`server/uploads/blog/`) which gets wiped out on every rebuild. The database correctly stored image URLs, but the actual files were lost.

## The Solution

### 1. Persistent Volume Mounts

Added volume mounts in Docker Compose files to persist the uploads directory:

**Development (`docker-compose.override.yml`)**:
```yaml
volumes:
  - ./server/uploads:/app/server/uploads
```

**Production (`docker-compose.yml`)**:
```yaml
volumes:
  - ./server/uploads:/app/server/uploads
```

### 2. Directory Structure

Created proper directory structure on the host machine:
```
server/uploads/blog/
├── featured/     # Featured images for blog posts
├── images/       # Content images uploaded via editor
├── videos/       # Video files
├── audio/        # Audio files
├── documents/    # PDF and document files
└── other/        # Other file types
```

### 3. How It Works

1. **Upload Process**: When users upload images through the admin panel:
   - Files are saved to `server/uploads/blog/featured/` (inside container)
   - Database stores URL as `/api/blog/protected-media/featured/filename.jpg`

2. **Volume Mount**: The Docker volume mount maps:
   - Container path: `/app/server/uploads/`
   - Host path: `./server/uploads/`

3. **File Serving**: Images are served via the API route:
   - Route: `GET /api/blog/protected-media/:type/:filename`
   - Implementation: `server/src/routes/blog-routes.ts`

### 4. What Changed

**Before**:
- ❌ Files stored only in container filesystem
- ❌ Lost on every rebuild
- ❌ Database had orphaned image URLs

**After**:
- ✅ Files persist on host machine
- ✅ Survive container rebuilds
- ✅ Volume mounted for both dev and production
- ✅ Proper directory permissions (755)

## Usage Instructions

### For Existing Installations

1. **Stop containers**:
   ```bash
   docker compose down
   ```

2. **Run the fix script**:
   ```bash
   ./fix-blog-images.sh
   ```

3. **Restart with development setup**:
   ```bash
   ./docker-dev.sh
   ```

   Or restart normally:
   ```bash
   docker compose up -d
   ```

### For New Blog Posts

1. Upload featured images as usual in the admin panel
2. Images will now persist across rebuilds
3. No code changes needed - everything works the same

### For Existing Posts with Missing Images

**Option 1: Re-upload**
- Go to each blog post in admin panel
- Re-upload the featured image
- Save the post

**Option 2: Bulk Migration** (if you have backup files)
- Copy image files to `server/uploads/blog/featured/`
- Use the migration endpoint: `POST /api/admin/blog/migrate-image-urls`

## Files Modified

- `docker-compose.yml` - Added uploads volume mount
- `docker-compose.override.yml` - Added uploads volume mount for development
- `fix-blog-images.sh` - Helper script for setup
- `BLOG_IMAGES_FIX.md` - This documentation

## Files Analyzed (No Changes Needed)

- `server/src/routes/admin/blog-routes.ts` - Upload logic was correct
- `server/services/blog-service.ts` - Database operations were correct
- `server/src/routes/blog-routes.ts` - Image serving route was correct
- `client/src/components/admin/blog-post-editor.tsx` - Upload UI was correct

## Technical Details

### Volume Mount Benefits

1. **Persistence**: Files survive container lifecycle
2. **Performance**: No file copying during container startup
3. **Development**: Live editing of files possible
4. **Backup**: Files are on host filesystem for easy backup
5. **Debugging**: Direct access to uploaded files

### Security Considerations

- Images served through protected API route
- Content-Type headers properly set
- No direct filesystem access from web
- Cache headers for performance
- CORS and security headers applied

### File Upload Flow

```
Browser Upload → Admin API → Multer → server/uploads/blog/featured/ → Database URL
                                     ↓
                              Volume Mount (Host)
                                     ↓
                              Persistent Storage
```

### Image Access Flow

```
Blog Post Request → Frontend → Image URL → API Route → File System → Browser
                                                    ↑
                                            Volume Mount Access
```

## Troubleshooting

### Issue: Images still not showing after fix

**Check**:
1. Containers restarted after volume mount?
2. Directory permissions correct (755)?
3. Files exist in `server/uploads/blog/featured/`?
4. Database has correct URLs?

**Debug**:
```bash
# Check files exist
ls -la server/uploads/blog/featured/

# Check container has volume mounted
docker compose exec app ls -la /app/server/uploads/blog/

# Check API route
curl http://localhost:3000/api/blog/protected-media/featured/filename.jpg
```

### Issue: Permission denied

**Fix**:
```bash
chmod -R 755 server/uploads/
```

### Issue: Development mode not seeing changes

**Ensure**:
- Using `docker-compose.override.yml`
- Volume mount is active
- Container restarted after adding mount

## Benefits Achieved

✅ **No More Data Loss**: Images persist across rebuilds  
✅ **Development Friendly**: Hot reloading for uploads  
✅ **Production Ready**: Same solution works in production  
✅ **Easy Backup**: Files are on host filesystem  
✅ **No Code Changes**: Existing upload logic unchanged  
✅ **Performance**: Cached image serving  
✅ **Security**: Protected access through API routes  

Your blog images will now persist correctly! 🎉 