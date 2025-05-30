import { db } from '../config/db';
import { 
  blogPosts, 
  blogCategories, 
  blogTags, 
  blogPostTags, 
  blogComments, 
  blogSettings,
  blogMedia,
  users,
  type BlogPost,
  type BlogCategory,
  type BlogTag,
  type BlogMedia,
  type BlogPostWithDetails,
  type BlogCategoryWithPosts,
  type InsertBlogPost,
  type InsertBlogCategory,
  type InsertBlogTag,
  type InsertBlogSettings,
  type InsertBlogMedia
} from '@shared/schema';
import { eq, desc, asc, count, sql, and, or, like, ilike, isNull, inArray } from 'drizzle-orm';

/**
 * Service for managing blog posts, categories, tags, and settings
 */
export class BlogService {
  
  // ============= Blog Posts =============
  
  /**
   * Get all blog posts with pagination and filters
   */
  public static async getPosts(options: {
    page?: number;
    limit?: number;
    status?: 'draft' | 'published' | 'archived' | 'scheduled';
    categoryId?: number;
    tagId?: number;
    authorId?: number;
    search?: string;
    featured?: boolean;
    orderBy?: 'newest' | 'oldest' | 'views' | 'title';
  } = {}): Promise<{ posts: BlogPostWithDetails[]; total: number; pages: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      categoryId,
      tagId,
      authorId,
      search,
      featured,
      orderBy = 'newest'
    } = options;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    if (status) {
      conditions.push(eq(blogPosts.status, status));
    }
    
    if (categoryId) {
      conditions.push(eq(blogPosts.categoryId, categoryId));
    }
    
    if (authorId) {
      conditions.push(eq(blogPosts.authorId, authorId));
    }
    
    if (featured !== undefined) {
      conditions.push(eq(blogPosts.isFeatured, featured));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(blogPosts.title, `%${search}%`),
          ilike(blogPosts.content, `%${search}%`),
          ilike(blogPosts.excerpt, `%${search}%`)
        )
      );
    }

    // Handle tag filtering
    let tagCondition = null;
    if (tagId) {
      const postsWithTag = await db
        .select({ postId: blogPostTags.postId })
        .from(blogPostTags)
        .where(eq(blogPostTags.tagId, tagId));
      
      const postIds = postsWithTag.map(p => p.postId);
      if (postIds.length > 0) {
        tagCondition = inArray(blogPosts.id, postIds);
      }
    }

    const whereCondition = tagCondition 
      ? and(...conditions, tagCondition)
      : conditions.length > 0 
        ? and(...conditions) 
        : undefined;

    // Order by
    let orderByClause;
    switch (orderBy) {
      case 'oldest':
        orderByClause = asc(blogPosts.createdAt);
        break;
      case 'views':
        orderByClause = desc(blogPosts.viewCount);
        break;
      case 'title':
        orderByClause = asc(blogPosts.title);
        break;
      default:
        orderByClause = desc(blogPosts.createdAt);
    }

    // Get posts with related data
    const postsQuery = db
      .select({
        post: blogPosts,
        category: blogCategories,
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName
        }
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .limit(limit)
      .offset(offset)
      .orderBy(orderByClause);

    if (whereCondition) {
      postsQuery.where(whereCondition);
    }

    const results = await postsQuery;

    // Get tags for each post
    const postIds = results.map(r => r.post.id);
    const postTags = postIds.length > 0 ? await db
      .select({
        postId: blogPostTags.postId,
        tag: blogTags
      })
      .from(blogPostTags)
      .leftJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(inArray(blogPostTags.postId, postIds)) : [];

    // Get total count
    const totalQuery = db
      .select({ count: count() })
      .from(blogPosts);

    if (whereCondition) {
      totalQuery.where(whereCondition);
    }

    const [{ count: total }] = await totalQuery;

    // Organize tags by post
    const tagsByPost = postTags.reduce((acc, pt) => {
      if (!acc[pt.postId]) acc[pt.postId] = [];
      if (pt.tag) acc[pt.postId].push(pt.tag);
      return acc;
    }, {} as Record<number, BlogTag[]>);

    // Combine posts with their tags
    const posts: BlogPostWithDetails[] = results.map(r => ({
      ...r.post,
      category: r.category || undefined,
      author: r.author || undefined,
      tags: tagsByPost[r.post.id] || []
    }));

    return {
      posts,
      total: Number(total),
      pages: Math.ceil(Number(total) / limit)
    };
  }

  /**
   * Get a single blog post by slug with all related data
   */
  public static async getPostBySlug(slug: string, incrementViews = false): Promise<BlogPostWithDetails | null> {
    const result = await db
      .select({
        post: blogPosts,
        category: blogCategories,
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName
        }
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.slug, slug))
      .limit(1);

    if (result.length === 0) return null;

    const postData = result[0];

    // Get tags for this post
    const postTags = await db
      .select({
        tag: blogTags
      })
      .from(blogPostTags)
      .leftJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(eq(blogPostTags.postId, postData.post.id));

    // Increment view count if requested
    if (incrementViews) {
      await db
        .update(blogPosts)
        .set({ viewCount: sql`${blogPosts.viewCount} + 1` })
        .where(eq(blogPosts.id, postData.post.id));
    }

    return {
      ...postData.post,
      category: postData.category || undefined,
      author: postData.author || undefined,
      tags: postTags.map(pt => pt.tag).filter(Boolean) as BlogTag[]
    };
  }

  /**
   * Get a single blog post by ID with all related data
   */
  public static async getPostById(id: number): Promise<BlogPostWithDetails | null> {
    const result = await db
      .select({
        post: blogPosts,
        category: blogCategories,
        author: {
          id: users.id,
          username: users.username,
          fullName: users.fullName
        }
      })
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const postData = result[0];

    // Get tags for this post
    const postTags = await db
      .select({
        tag: blogTags
      })
      .from(blogPostTags)
      .leftJoin(blogTags, eq(blogPostTags.tagId, blogTags.id))
      .where(eq(blogPostTags.postId, postData.post.id));

    return {
      ...postData.post,
      category: postData.category || undefined,
      author: postData.author || undefined,
      tags: postTags.map(pt => pt.tag).filter(Boolean) as BlogTag[]
    };
  }

  /**
   * Create a new blog post
   */
  public static async createPost(postData: InsertBlogPost, tagIds: number[] = []): Promise<BlogPost> {
    const { tags, ...postFields } = postData;
    const finalTagIds = tagIds.length > 0 ? tagIds : (tags || []);

    // Calculate read time (approximate: 200 words per minute)
    const wordCount = postFields.content.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);

    // Auto-generate slug if not provided
    if (!postFields.slug) {
      postFields.slug = this.generateSlug(postFields.title);
    }

    // Convert date strings to Date objects
    const insertData = {
      ...postFields,
      readTime,
      publishedAt: postFields.publishedAt ? new Date(postFields.publishedAt) : null,
      scheduledAt: postFields.scheduledAt ? new Date(postFields.scheduledAt) : null,
      updatedAt: new Date()
    };

    const [newPost] = await db
      .insert(blogPosts)
      .values(insertData)
      .returning();

    // Add tags if provided
    if (finalTagIds.length > 0) {
      await this.addTagsToPosts([newPost.id], finalTagIds);
    }

    return newPost;
  }

  /**
   * Update a blog post
   */
  public static async updatePost(id: number, postData: Partial<InsertBlogPost>, tagIds?: number[]): Promise<BlogPost | null> {
    console.log("=== BlogService.updatePost Debug ===");
    console.log("ID:", id);
    console.log("Raw postData:", JSON.stringify(postData, null, 2));
    console.log("TagIds:", tagIds);

    const { tags, ...postFields } = postData;

    console.log("Post fields after extracting tags:", JSON.stringify(postFields, null, 2));

    // Calculate read time if content changed
    if (postFields.content) {
      const wordCount = postFields.content.split(/\s+/).length;
      postFields.readTime = Math.ceil(wordCount / 200);
    }

    // Convert date strings to Date objects
    const updateData = {
      ...postFields,
      publishedAt: postFields.publishedAt ? new Date(postFields.publishedAt) : undefined,
      scheduledAt: postFields.scheduledAt ? new Date(postFields.scheduledAt) : undefined,
      updatedAt: new Date()
    };

    console.log("Final updateData for database:", JSON.stringify(updateData, null, 2));

    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    console.log("Post returned from database:", JSON.stringify(updatedPost, null, 2));

    if (!updatedPost) return null;

    // Update tags if provided
    if (tagIds !== undefined) {
      await this.updatePostTags(id, tagIds);
    }

    console.log("=== End BlogService.updatePost Debug ===");
    return updatedPost;
  }

  /**
   * Delete a blog post
   */
  public static async deletePost(id: number): Promise<boolean> {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();

    return result.length > 0;
  }

  // ============= Categories =============

  /**
   * Get all categories with optional hierarchy
   */
  public static async getCategories(includePostCount = false): Promise<BlogCategory[]> {
    let query = db.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name));

    const categories = await query;

    if (includePostCount) {
      // Update post counts
      for (const category of categories) {
        const [{ count: postCount }] = await db
          .select({ count: count() })
          .from(blogPosts)
          .where(and(
            eq(blogPosts.categoryId, category.id),
            eq(blogPosts.status, 'published')
          ));
        
        category.postCount = Number(postCount);
      }
    }

    return categories;
  }

  /**
   * Create a new category
   */
  public static async createCategory(categoryData: InsertBlogCategory): Promise<BlogCategory> {
    // Auto-generate slug if not provided
    if (!categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }

    const [newCategory] = await db
      .insert(blogCategories)
      .values({
        ...categoryData,
        updatedAt: new Date()
      })
      .returning();

    return newCategory;
  }

  /**
   * Update a category
   */
  public static async updateCategory(id: number, categoryData: Partial<InsertBlogCategory>): Promise<BlogCategory | null> {
    const [updatedCategory] = await db
      .update(blogCategories)
      .set({
        ...categoryData,
        updatedAt: new Date()
      })
      .where(eq(blogCategories.id, id))
      .returning();

    return updatedCategory || null;
  }

  /**
   * Delete a category
   */
  public static async deleteCategory(id: number): Promise<boolean> {
    const result = await db
      .delete(blogCategories)
      .where(eq(blogCategories.id, id))
      .returning();

    return result.length > 0;
  }

  // ============= Tags =============

  /**
   * Get all tags with optional post count
   */
  public static async getTags(includePostCount = false): Promise<BlogTag[]> {
    const tags = await db.select().from(blogTags).orderBy(asc(blogTags.name));

    if (includePostCount) {
      for (const tag of tags) {
        const [{ count: postCount }] = await db
          .select({ count: count() })
          .from(blogPostTags)
          .leftJoin(blogPosts, eq(blogPostTags.postId, blogPosts.id))
          .where(and(
            eq(blogPostTags.tagId, tag.id),
            eq(blogPosts.status, 'published')
          ));
        
        tag.postCount = Number(postCount);
      }
    }

    return tags;
  }

  /**
   * Create a new tag
   */
  public static async createTag(tagData: InsertBlogTag): Promise<BlogTag> {
    // Auto-generate slug if not provided
    if (!tagData.slug) {
      tagData.slug = this.generateSlug(tagData.name);
    }

    const [newTag] = await db
      .insert(blogTags)
      .values({
        ...tagData,
        updatedAt: new Date()
      })
      .returning();

    return newTag;
  }

  /**
   * Update a tag
   */
  public static async updateTag(id: number, tagData: Partial<InsertBlogTag>): Promise<BlogTag | null> {
    const [updatedTag] = await db
      .update(blogTags)
      .set({
        ...tagData,
        updatedAt: new Date()
      })
      .where(eq(blogTags.id, id))
      .returning();

    return updatedTag || null;
  }

  /**
   * Delete a tag
   */
  public static async deleteTag(id: number): Promise<boolean> {
    const result = await db
      .delete(blogTags)
      .where(eq(blogTags.id, id))
      .returning();

    return result.length > 0;
  }

  // ============= Blog Settings =============

  /**
   * Get blog settings
   */
  public static async getSettings(): Promise<any> {
    const result = await db.select().from(blogSettings).limit(1);
    
    if (result.length === 0) {
      // Return default settings if none exist
      return {
        blogTitle: 'Blog',
        blogDescription: 'Latest news and updates',
        blogKeywords: '',
        postsPerPage: 10,
        allowComments: true,
        moderateComments: true,
        enableRss: true,
        enableSitemap: true,
        featuredImageRequired: false,
        enableReadTime: true,
        enableTableOfContents: true,
        socialShareButtons: ['twitter', 'facebook', 'linkedin', 'email'],
        customCss: '',
        customJs: ''
      };
    }
    
    return result[0];
  }

  /**
   * Update blog settings
   */
  public static async updateSettings(settingsData: InsertBlogSettings): Promise<any> {
    const existing = await db.select().from(blogSettings).limit(1);
    
    if (existing.length === 0) {
      // Insert new settings if none exist
      const [newSettings] = await db.insert(blogSettings)
        .values({
          ...settingsData,
          updatedAt: new Date()
        })
        .returning();
      return newSettings;
    } else {
      // Update existing settings
      const [updatedSettings] = await db.update(blogSettings)
        .set({
          ...settingsData,
          updatedAt: new Date()
        })
        .where(eq(blogSettings.id, existing[0].id))
        .returning();
      return updatedSettings;
    }
  }

  // ============= Media Management =============

  /**
   * Upload and save media file
   */
  public static async uploadMedia(mediaData: InsertBlogMedia): Promise<BlogMedia> {
    const [newMedia] = await db
      .insert(blogMedia)
      .values({
        ...mediaData,
        updatedAt: new Date()
      })
      .returning();

    return newMedia;
  }

  /**
   * Get media by ID
   */
  public static async getMediaById(id: number): Promise<BlogMedia | null> {
    const result = await db
      .select()
      .from(blogMedia)
      .where(eq(blogMedia.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get all media with pagination and filters
   */
  public static async getMedia(options: {
    page?: number;
    limit?: number;
    type?: 'image' | 'video' | 'audio' | 'document' | 'other';
    search?: string;
    uploadedBy?: number;
  } = {}): Promise<{ media: BlogMedia[]; total: number; pages: number }> {
    const {
      page = 1,
      limit = 20,
      type,
      search,
      uploadedBy
    } = options;

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    
    if (type) {
      conditions.push(eq(blogMedia.type, type));
    }
    
    if (uploadedBy) {
      conditions.push(eq(blogMedia.uploadedBy, uploadedBy));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(blogMedia.originalName, `%${search}%`),
          ilike(blogMedia.filename, `%${search}%`),
          ilike(blogMedia.alt, `%${search}%`)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get media with uploader info
    const mediaQuery = db
      .select({
        media: blogMedia,
        uploader: {
          id: users.id,
          username: users.username,
          fullName: users.fullName
        }
      })
      .from(blogMedia)
      .leftJoin(users, eq(blogMedia.uploadedBy, users.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(blogMedia.createdAt));

    if (whereCondition) {
      mediaQuery.where(whereCondition);
    }

    const results = await mediaQuery;

    // Get total count
    const totalQuery = db
      .select({ count: count() })
      .from(blogMedia);

    if (whereCondition) {
      totalQuery.where(whereCondition);
    }

    const [{ count: total }] = await totalQuery;

    const media = results.map(r => ({
      ...r.media,
      uploader: r.uploader
    }));

    return {
      media: media as BlogMedia[],
      total: Number(total),
      pages: Math.ceil(Number(total) / limit)
    };
  }

  /**
   * Delete media file
   */
  public static async deleteMedia(id: number): Promise<boolean> {
    const result = await db
      .delete(blogMedia)
      .where(eq(blogMedia.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Mark media as used
   */
  public static async markMediaAsUsed(id: number): Promise<boolean> {
    const result = await db
      .update(blogMedia)
      .set({ 
        isUsed: true,
        updatedAt: new Date()
      })
      .where(eq(blogMedia.id, id))
      .returning();

    return result.length > 0;
  }

  // ============= Utility Methods =============

  /**
   * Generate a URL-friendly slug from a title
   */
  public static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Add tags to posts
   */
  private static async addTagsToPosts(postIds: number[], tagIds: number[]): Promise<void> {
    const insertData = [];
    for (const postId of postIds) {
      for (const tagId of tagIds) {
        insertData.push({ postId, tagId });
      }
    }

    if (insertData.length > 0) {
      await db.insert(blogPostTags).values(insertData);
    }
  }

  /**
   * Update tags for a specific post
   */
  private static async updatePostTags(postId: number, tagIds: number[]): Promise<void> {
    // Remove existing tags
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));

    // Add new tags
    if (tagIds.length > 0) {
      await this.addTagsToPosts([postId], tagIds);
    }
  }

  /**
   * Get blog statistics for admin dashboard
   */
  public static async getStatistics(): Promise<{
    totalPosts: number;
    publishedPosts: number;
    draftPosts: number;
    totalCategories: number;
    totalTags: number;
    totalViews: number;
  }> {
    const [totalPosts] = await db.select({ count: count() }).from(blogPosts);
    const [publishedPosts] = await db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'published'));
    const [draftPosts] = await db.select({ count: count() }).from(blogPosts).where(eq(blogPosts.status, 'draft'));
    const [totalCategories] = await db.select({ count: count() }).from(blogCategories);
    const [totalTags] = await db.select({ count: count() }).from(blogTags);
    const [{ totalViews }] = await db.select({ totalViews: sql<number>`COALESCE(SUM(${blogPosts.viewCount}), 0)` }).from(blogPosts);

    return {
      totalPosts: Number(totalPosts.count),
      publishedPosts: Number(publishedPosts.count),
      draftPosts: Number(draftPosts.count),
      totalCategories: Number(totalCategories.count),
      totalTags: Number(totalTags.count),
      totalViews: Number(totalViews)
    };
  }
}

export default BlogService; 