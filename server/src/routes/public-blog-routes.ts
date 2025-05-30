import { Express, Request, Response } from "express";
import { BlogService } from "../../services/blog-service";

/**
 * Register public blog routes
 * These routes are accessible to everyone and only return published content
 */
export function registerPublicBlogRoutes(app: Express) {
  
  // ============= Public Blog Posts =============
  
  // Get all published blog posts with filters and pagination
  app.get("/api/blog/posts", async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const tagId = req.query.tagId ? parseInt(req.query.tagId as string) : undefined;
      const search = req.query.search as string;
      const featured = req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined;
      const orderBy = req.query.orderBy as 'newest' | 'oldest' | 'views' | 'title' || 'newest';

      const result = await BlogService.getPosts({
        page,
        limit,
        status: 'published', // Only published posts for public
        categoryId,
        tagId,
        search,
        featured,
        orderBy
      });

      return res.json(result);
    } catch (error) {
      console.error("Error fetching public blog posts:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get single published blog post by slug
  app.get("/api/blog/posts/:slug", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      
      if (!slug) {
        return res.status(400).json({ message: "Invalid post slug" });
      }

      // Increment view count when fetching post
      const post = await BlogService.getPostBySlug(slug, true);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Only return published posts to public
      if (post.status !== 'published') {
        return res.status(404).json({ message: "Blog post not found" });
      }

      return res.json(post);
    } catch (error) {
      console.error("Error fetching public blog post:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog post",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get featured blog posts
  app.get("/api/blog/featured", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const result = await BlogService.getPosts({
        page: 1,
        limit,
        status: 'published',
        featured: true,
        orderBy: 'newest'
      });

      return res.json(result.posts);
    } catch (error) {
      console.error("Error fetching featured blog posts:", error);
      return res.status(500).json({ 
        message: "Failed to fetch featured blog posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get recent blog posts
  app.get("/api/blog/recent", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;

      const result = await BlogService.getPosts({
        page: 1,
        limit,
        status: 'published',
        orderBy: 'newest'
      });

      return res.json(result.posts);
    } catch (error) {
      console.error("Error fetching recent blog posts:", error);
      return res.status(500).json({ 
        message: "Failed to fetch recent blog posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Public Categories =============

  // Get all active categories with post counts
  app.get("/api/blog/categories", async (req: Request, res: Response) => {
    try {
      const categories = await BlogService.getCategories(true);
      
      // Filter only active categories for public view
      const activeCategories = categories.filter(cat => cat.isActive);
      
      return res.json(activeCategories);
    } catch (error) {
      console.error("Error fetching public categories:", error);
      return res.status(500).json({ 
        message: "Failed to fetch categories",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get posts by category slug
  app.get("/api/blog/categories/:slug/posts", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // First find the category by slug
      const categories = await BlogService.getCategories(false);
      const category = categories.find(cat => cat.slug === slug && cat.isActive);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      const result = await BlogService.getPosts({
        page,
        limit,
        status: 'published',
        categoryId: category.id,
        orderBy: 'newest'
      });

      return res.json({
        ...result,
        category
      });
    } catch (error) {
      console.error("Error fetching posts by category:", error);
      return res.status(500).json({ 
        message: "Failed to fetch posts by category",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Public Tags =============

  // Get all tags with post counts
  app.get("/api/blog/tags", async (req: Request, res: Response) => {
    try {
      const tags = await BlogService.getTags(true);
      return res.json(tags);
    } catch (error) {
      console.error("Error fetching public tags:", error);
      return res.status(500).json({ 
        message: "Failed to fetch tags",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get posts by tag slug
  app.get("/api/blog/tags/:slug/posts", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // First find the tag by slug
      const tags = await BlogService.getTags(false);
      const tag = tags.find(t => t.slug === slug);
      
      if (!tag) {
        return res.status(404).json({ message: "Tag not found" });
      }

      const result = await BlogService.getPosts({
        page,
        limit,
        status: 'published',
        tagId: tag.id,
        orderBy: 'newest'
      });

      return res.json({
        ...result,
        tag
      });
    } catch (error) {
      console.error("Error fetching posts by tag:", error);
      return res.status(500).json({ 
        message: "Failed to fetch posts by tag",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Blog Settings =============

  // Get public blog settings
  app.get("/api/blog/settings", async (req: Request, res: Response) => {
    try {
      const settings = await BlogService.getSettings();
      
      // Return only public-safe settings
      const publicSettings = {
        blogTitle: settings.blogTitle,
        blogDescription: settings.blogDescription,
        postsPerPage: settings.postsPerPage,
        allowComments: settings.allowComments,
        enableReadTime: settings.enableReadTime,
        enableTableOfContents: settings.enableTableOfContents,
        socialShareButtons: settings.socialShareButtons
      };
      
      return res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public blog settings:", error);
      return res.status(500).json({ 
        message: "Failed to fetch blog settings",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ============= Search =============

  // Search blog posts
  app.get("/api/blog/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }

      const result = await BlogService.getPosts({
        page,
        limit,
        status: 'published',
        search: query.trim(),
        orderBy: 'newest'
      });

      return res.json(result);
    } catch (error) {
      console.error("Error searching blog posts:", error);
      return res.status(500).json({ 
        message: "Failed to search blog posts",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default registerPublicBlogRoutes; 