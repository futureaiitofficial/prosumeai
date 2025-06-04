import { Express, Request, Response } from "express";
import { BlogService } from "../../services/blog-service";
import path from "path";
import fs from "fs";

/**
 * Register public blog routes
 */
export function registerBlogRoutes(app: Express) {
  
  // Get published blog posts (public)
  app.get("/api/blog/posts", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined;
      const search = req.query.search as string;
      const featured = req.query.featured === 'true' ? true : undefined;
      const orderBy = req.query.orderBy as 'newest' | 'oldest' | 'views' | 'title' || 'newest';

      const result = await BlogService.getPosts({
        page,
        limit,
        status: 'published', // Only show published posts
        categoryId,
        tagId,
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

  // Get single published blog post by slug (public)
  app.get("/api/blog/posts/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const post = await BlogService.getPostBySlug(slug, true); // Increment views
      
      if (!post || post.status !== 'published') {
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

  // Get published categories (public)
  app.get("/api/blog/categories", async (req: Request, res: Response) => {
    try {
      const categories = await BlogService.getCategories(true);
      return res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({ 
        message: "Failed to fetch categories",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get tags (public)
  app.get("/api/blog/tags", async (req: Request, res: Response) => {
    try {
      const tags = await BlogService.getTags(true);
      return res.json(tags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      return res.status(500).json({ 
        message: "Failed to fetch tags",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Protected media serving route - images can be viewed in articles but not directly downloaded
  app.get("/api/blog/protected-media/:type/:filename", async (req: Request, res: Response) => {
    try {
      const { type, filename } = req.params;
      
      // Validate file type
      if (!['images', 'videos', 'audio', 'documents', 'other', 'featured'].includes(type)) {
        return res.status(400).json({ message: "Invalid file type" });
      }
      
      let filePath;
      let media = null;
      
      if (type === 'featured') {
        // Featured images don't need to be in the media database
        filePath = path.join(process.cwd(), 'server', 'uploads', 'blog', 'featured', filename);
      } else {
        // Check if media exists in database for other types
        media = await BlogService.getMediaByFilename(filename);
        if (!media) {
          return res.status(404).json({ message: "Media not found" });
        }
        filePath = path.join(process.cwd(), 'server', 'uploads', 'blog', type, filename);
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Set headers to prevent easy downloading while allowing inline display
      res.setHeader('Content-Disposition', 'inline'); // Display inline, not as download
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour for performance
      res.setHeader('X-Content-Type-Options', 'nosniff');
      
      // Prevent right-click save and disable hotlinking
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Referrer-Policy', 'same-origin');
      
      // Additional protection headers
      res.setHeader('Content-Security-Policy', "default-src 'self'");
      
      // Set appropriate content type
      if (media) {
        res.setHeader('Content-Type', media.mimeType);
      } else {
        // For featured images, determine content type from file extension
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.mp4': 'video/mp4',
          '.avi': 'video/avi',
          '.mov': 'video/quicktime',
          '.mp3': 'audio/mpeg',
          '.wav': 'audio/wav',
          '.pdf': 'application/pdf'
        };
        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      }
      
      // Send file
      res.sendFile(filePath);
    } catch (error) {
      console.error("Error serving protected media:", error);
      res.status(500).json({ 
        message: "Failed to serve media",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default registerBlogRoutes; 