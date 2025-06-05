import { Express, Request, Response } from "express";
import { requireAdmin } from "server/middleware/admin";
import { BlogService } from "../../../services/blog-service";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for featured image uploads
const blogImageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'server', 'uploads', 'blog', 'images');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp
    const fileExtension = path.extname(file.originalname);
    const fileName = `blog-${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    cb(null, fileName);
  }
});

// Configure multer for general media uploads (for content)
const mediaStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    let subDir = 'other';
    
    if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subDir = 'audio';
    } else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) {
      subDir = 'documents';
    }
    
    // Use protected directory instead of public
    const uploadDir = path.join(process.cwd(), 'server', 'uploads', 'blog', subDir);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp
    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExtension}`;
    cb(null, fileName);
  }
});

const upload = multer({
  storage: blogImageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error("Only image files are allowed!"));
  }
});

const mediaUpload = multer({
  storage: mediaStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for general media
  },
  fileFilter: function (req, file, cb) {
    // Accept images, videos, audio, and documents
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|avi|mov|mp3|wav|pdf|doc|docx|txt/;
    const mimetype = allowedTypes.test(file.mimetype) || 
                    file.mimetype.startsWith('image/') || 
                    file.mimetype.startsWith('video/') || 
                    file.mimetype.startsWith('audio/') ||
                    file.mimetype.includes('pdf') ||
                    file.mimetype.includes('document');
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype || extname) {
      return cb(null, true);
    }
    
    cb(new Error("File type not allowed!"));
  }
});

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  slug: z.string().optional(),
  excerpt: z.string().max(500, "Excerpt must be less than 500 characters").optional(),
  content: z.string().min(1, "Content is required"),
  status: z.enum(['draft', 'published', 'archived', 'scheduled']).default('draft'),
  categoryId: z.number().positive().nullable().optional(),
  featuredImage: z.string().nullable().optional().transform(val => val === null ? undefined : val),
  featuredImageAlt: z.string().nullable().optional().transform(val => val === null ? undefined : val),
  seoTitle: z.string().max(60, "SEO title should be less than 60 characters").nullable().optional().transform(val => val === null ? undefined : val),
  seoDescription: z.string().max(160, "SEO description should be less than 160 characters").nullable().optional().transform(val => val === null ? undefined : val),
  seoKeywords: z.string().nullable().optional().transform(val => val === null ? undefined : val),
  canonicalUrl: z.string().url().nullable().optional().transform(val => val === null || val === "" ? undefined : val),
  allowComments: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isSticky: z.boolean().default(false),
  scheduledAt: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  metaTags: z.record(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  tags: z.array(z.number()).optional()
});

const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  parentId: z.number().optional(),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0)
});

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be less than 50 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color").default("#4f46e5")
});

/**
 * Register admin blog routes
 */
export function registerBlogAdminRoutes(app: Express) {
  
  // ============= Blog Posts =============
  
  // Get all blog posts with filters and pagination
  app.get("/api/admin/blog/posts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as 'draft' | 'published' | 'archived' | 'scheduled' | undefined;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined;
      const authorId = req.query.authorId ? parseInt(req.query.authorId as string) : undefined;
      const search = req.query.search as string;
      const featured = req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined;
      const orderBy = req.query.orderBy as 'newest' | 'oldest' | 'views' | 'title' || 'newest';

      const result = await BlogService.getPosts({
        page,
        limit,
        status,
        categoryId,
        tagId,
        authorId,
        search,
        featured,
        orderBy
      });

      return res.json(result);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get single blog post by ID
  app.get("/api/admin/blog/posts/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const post = await BlogService.getPostById(id);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      return res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog post",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new blog post
  app.post("/api/admin/blog/posts", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = createPostSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.issues
        });
      }

      const postData = validationResult.data;
      const user = req.user as Express.User;

      // Ensure slug is generated if not provided
      const slug = postData.slug || BlogService.generateSlug(postData.title);

      // Add author ID from authenticated user
      const postToCreate = {
        ...postData,
        slug,
        authorId: user.id,
        // Handle scheduled publishing
        publishedAt: postData.status === 'published' ? new Date().toISOString() : 
                    postData.status === 'scheduled' ? postData.scheduledAt : 
                    null
      };

      const newPost = await BlogService.createPost(postToCreate, postData.tags);
      
      return res.status(201).json(newPost);
    } catch (error) {
      console.error("Error creating blog post:", error);
      return res.status(500).json({ 
        message: "Failed to create blog post",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update blog post
  app.put("/api/admin/blog/posts/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      console.log("=== Blog Post Update Debug ===");
      console.log("Post ID:", id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      // Validate request body
      const validationResult = createPostSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        console.log("Validation failed:", validationResult.error.issues);
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.issues
        });
      }

      const postData = validationResult.data;
      console.log("Validated post data:", JSON.stringify(postData, null, 2));

      // Handle publishing timestamp
      if (postData.status === 'published' && !postData.publishedAt) {
        postData.publishedAt = new Date().toISOString();
      }

      console.log("Calling BlogService.updatePost with:", {
        id,
        postData: JSON.stringify(postData, null, 2),
        tagIds: postData.tags
      });

      const updatedPost = await BlogService.updatePost(id, postData, postData.tags);
      
      if (!updatedPost) {
        console.log("No post returned from updatePost");
        return res.status(404).json({ message: "Blog post not found" });
      }

      console.log("Updated post result:", JSON.stringify(updatedPost, null, 2));
      console.log("=== End Blog Post Update Debug ===");

      return res.json(updatedPost);
    } catch (error) {
      console.error("Error updating blog post:", error);
      return res.status(500).json({ 
        message: "Failed to update blog post",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete blog post
  app.delete("/api/admin/blog/posts/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const deleted = await BlogService.deletePost(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      return res.json({ message: "Blog post deleted successfully" });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      return res.status(500).json({ 
        message: "Failed to delete blog post",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload featured image for blog post
  app.post("/api/admin/blog/upload-image", requireAdmin, upload.single('image'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = `/uploads/blog/images/${req.file.filename}`;
      
      return res.json({ 
        message: "Image uploaded successfully",
        imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      return res.status(500).json({ 
        message: "Failed to upload image",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Media Management =============

  // Upload media for blog content (used by Quill editor)
  app.post("/api/admin/blog/upload-media", requireAdmin, mediaUpload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const user = req.user as Express.User;
      
      // Determine file type
      let fileType: 'image' | 'video' | 'audio' | 'document' | 'other' = 'other';
      if (req.file.mimetype.startsWith('image/')) {
        fileType = 'image';
      } else if (req.file.mimetype.startsWith('video/')) {
        fileType = 'video';
      } else if (req.file.mimetype.startsWith('audio/')) {
        fileType = 'audio';
      } else if (req.file.mimetype.includes('pdf') || req.file.mimetype.includes('document')) {
        fileType = 'document';
      }

      // Determine subdirectory based on file type
      let subDir = 'other';
      if (fileType === 'image') subDir = 'images';
      else if (fileType === 'video') subDir = 'videos';
      else if (fileType === 'audio') subDir = 'audio';
      else if (fileType === 'document') subDir = 'documents';

      const mediaUrl = `/api/blog/protected-media/${subDir}/${req.file.filename}`;

      // Get image dimensions for images
      let width, height;
      if (fileType === 'image') {
        // You might want to use a library like 'sharp' for better image processing
        // For now, we'll set them as null and let the frontend handle it
        width = null;
        height = null;
      }

      // Save to database
      const media = await BlogService.uploadMedia({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width,
        height,
        url: mediaUrl,
        type: fileType,
        uploadedBy: user.id
      });

      return res.json({ 
        id: media.id,
        url: mediaUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        type: fileType,
        size: req.file.size
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      return res.status(500).json({ 
        message: "Failed to upload media",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all media files
  app.get("/api/admin/blog/media", requireAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as 'image' | 'video' | 'audio' | 'document' | 'other' | undefined;
      const search = req.query.search as string;

      const result = await BlogService.getMedia({
        page,
        limit,
        type,
        search
      });

      return res.json(result);
    } catch (error) {
      console.error("Error fetching media:", error);
      return res.status(500).json({ 
        message: "Failed to fetch media",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete media file
  app.delete("/api/admin/blog/media/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid media ID" });
      }

      // Get media info first to delete the file
      const media = await BlogService.getMediaById(id);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }

      // Delete from database
      const deleted = await BlogService.deleteMedia(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Media not found" });
      }

      // Delete physical file
      try {
        const filePath = path.join(process.cwd(), 'public', media.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.error("Error deleting physical file:", fileError);
        // Continue even if file deletion fails
      }

      return res.json({ message: "Media deleted successfully" });
    } catch (error) {
      console.error("Error deleting media:", error);
      return res.status(500).json({ 
        message: "Failed to delete media",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Categories =============

  // Get all categories
  app.get("/api/admin/blog/categories", requireAdmin, async (req: Request, res: Response) => {
    try {
      const includePostCount = req.query.includePostCount === 'true';
      const categories = await BlogService.getCategories(includePostCount);
      return res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ 
        message: "Failed to fetch categories",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new category
  app.post("/api/admin/blog/categories", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validationResult = createCategorySchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.issues
        });
      }

      const categoryData = validationResult.data;
      
      // Ensure slug is generated if not provided
      const slug = categoryData.slug || BlogService.generateSlug(categoryData.name);

      const newCategory = await BlogService.createCategory({
        ...categoryData,
        slug
      });
      return res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      return res.status(500).json({ 
        message: "Failed to create category",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update category
  app.put("/api/admin/blog/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const validationResult = createCategorySchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.issues
        });
      }

      const updatedCategory = await BlogService.updateCategory(id, validationResult.data);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      return res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      return res.status(500).json({ 
        message: "Failed to update category",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete category
  app.delete("/api/admin/blog/categories/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const deleted = await BlogService.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }

      return res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({ 
        message: "Failed to delete category",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Tags =============

  // Get all tags
  app.get("/api/admin/blog/tags", requireAdmin, async (req: Request, res: Response) => {
    try {
      const includePostCount = req.query.includePostCount === 'true';
      const tags = await BlogService.getTags(includePostCount);
      return res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      return res.status(500).json({ 
        message: "Failed to fetch tags",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create new tag
  app.post("/api/admin/blog/tags", requireAdmin, async (req: Request, res: Response) => {
    try {
      const validationResult = createTagSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.issues
        });
      }

      const tagData = validationResult.data;
      
      // Ensure slug is generated if not provided
      const slug = tagData.slug || BlogService.generateSlug(tagData.name);

      const newTag = await BlogService.createTag({
        ...tagData,
        slug
      });
      return res.status(201).json(newTag);
    } catch (error) {
      console.error("Error creating tag:", error);
      return res.status(500).json({ 
        message: "Failed to create tag",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update tag
  app.put("/api/admin/blog/tags/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }

      const validationResult = createTagSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validationResult.error.issues
        });
      }

      const updatedTag = await BlogService.updateTag(id, validationResult.data);
      
      if (!updatedTag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      return res.json(updatedTag);
    } catch (error) {
      console.error("Error updating tag:", error);
      return res.status(500).json({ 
        message: "Failed to update tag",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete tag
  app.delete("/api/admin/blog/tags/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid tag ID" });
      }

      const deleted = await BlogService.deleteTag(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Tag not found" });
      }

      return res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      return res.status(500).json({ 
        message: "Failed to delete tag",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Blog Settings =============

  // Get blog settings
  app.get("/api/admin/blog/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await BlogService.getSettings();
      return res.json(settings);
    } catch (error) {
      console.error("Error fetching blog settings:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog settings",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update blog settings
  app.put("/api/admin/blog/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await BlogService.updateSettings(req.body);
      return res.json(settings);
    } catch (error) {
      console.error("Error updating blog settings:", error);
      return res.status(500).json({ 
        message: "Failed to update blog settings",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get blog statistics
  app.get("/api/admin/blog/statistics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await BlogService.getStatistics();
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching blog statistics:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog statistics",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Migration endpoint to update blog post image URLs
  app.post("/api/admin/blog/migrate-image-urls", requireAdmin, async (req: Request, res: Response) => {
    try {
      console.log('Starting blog image URL migration...');
      
      // Get all blog posts
      const posts = await BlogService.getAllPostsForMigration();
      console.log(`Found ${posts.length} blog posts to check`);
      
      let updatedCount = 0;
      const updatedPosts = [];
      
      for (const post of posts) {
        let shouldUpdate = false;
        let updatedPost = { ...post };
        
        // Update featured image URL from protected format to uploads format
        if (post.featuredImage && post.featuredImage.includes('/api/blog/protected-media/featured/')) {
          const filename = post.featuredImage.replace('/api/blog/protected-media/featured/', '');
          updatedPost.featuredImage = `/uploads/blog/images/${filename}`;
          shouldUpdate = true;
          console.log(`Updated featured image for post "${post.title}"`);
        }
        
        // Update content images
        if (post.content) {
          let updatedContent = post.content;
          const originalContent = updatedContent;
          
          // Update protected media references to uploads paths
          updatedContent = updatedContent.replace(
            /\/api\/blog\/protected-media\/featured\/([^"'\s>]+)/g,
            '/uploads/blog/images/$1'
          );
          
          updatedContent = updatedContent.replace(
            /\/api\/blog\/protected-media\/images\/([^"'\s>]+)/g,
            '/uploads/blog/images/$1'
          );
          
          updatedContent = updatedContent.replace(
            /\/api\/blog\/protected-media\/videos\/([^"'\s>]+)/g,
            '/uploads/blog/videos/$1'
          );
          
          updatedContent = updatedContent.replace(
            /\/api\/blog\/protected-media\/audio\/([^"'\s>]+)/g,
            '/uploads/blog/audio/$1'
          );
          
          updatedContent = updatedContent.replace(
            /\/api\/blog\/protected-media\/documents\/([^"'\s>]+)/g,
            '/uploads/blog/documents/$1'
          );
          
          updatedContent = updatedContent.replace(
            /\/api\/blog\/protected-media\/other\/([^"'\s>]+)/g,
            '/uploads/blog/other/$1'
          );
          
          if (updatedContent !== originalContent) {
            updatedPost.content = updatedContent;
            shouldUpdate = true;
            console.log(`Updated content images for post "${post.title}"`);
          }
        }
        
        // Update the post if changes were made
        if (shouldUpdate) {
          const updated = await BlogService.updatePostUrls(post.id, {
            featuredImage: updatedPost.featuredImage || undefined,
            content: updatedPost.content || undefined
          });
          
          if (updated) {
            updatedCount++;
            updatedPosts.push({
              id: post.id,
              title: post.title,
              featuredImageUpdated: post.featuredImage !== updatedPost.featuredImage,
              contentUpdated: post.content !== updatedPost.content
            });
          }
        }
      }
      
      return res.json({
        message: `Successfully updated ${updatedCount} blog posts`,
        totalPosts: posts.length,
        updatedCount,
        updatedPosts
      });
    } catch (error) {
      console.error("Error migrating blog post URLs:", error);
      return res.status(500).json({ 
        message: "Failed to migrate blog post URLs",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default registerBlogAdminRoutes; 