import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/layout';
import { BlogPostEditor } from '@/components/admin/blog-post-editor';
import axios from 'axios';

interface BlogPost {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  categoryId: number | null;
  featuredImage?: string;
  featuredImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  allowComments: boolean;
  isFeatured: boolean;
  isSticky: boolean;
  scheduledAt?: string;
  publishedAt?: string;
  tags: number[];
  metaTags?: Record<string, string>;
  customFields?: Record<string, any>;
}

export default function BlogEdit() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/blog/posts/${id}`);
      const postData = response.data;
      
      // Transform the data to match our BlogPost interface
      const transformedPost: BlogPost = {
        id: postData.id,
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt || '',
        content: postData.content,
        status: postData.status,
        categoryId: postData.categoryId,
        featuredImage: postData.featuredImage,
        featuredImageAlt: postData.featuredImageAlt,
        seoTitle: postData.seoTitle,
        seoDescription: postData.seoDescription,
        seoKeywords: postData.seoKeywords,
        canonicalUrl: postData.canonicalUrl,
        allowComments: postData.allowComments,
        isFeatured: postData.isFeatured,
        isSticky: postData.isSticky,
        scheduledAt: postData.scheduledAt,
        publishedAt: postData.publishedAt,
        tags: postData.tags?.map((tag: any) => tag.id) || [],
        metaTags: postData.metaTags,
        customFields: postData.customFields,
      };
      
      setPost(transformedPost);
    } catch (error: any) {
      console.error('Error fetching blog post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load blog post',
      });
      // Redirect back to blog management if post not found
      setLocation('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedPost: BlogPost) => {
    try {
      const response = await axios.put(`/api/admin/blog/posts/${id}`, updatedPost);
      
      toast({
        title: 'Success',
        description: 'Blog post updated successfully!',
      });

      // Redirect to the blog management page
      setLocation('/admin/blog');
    } catch (error: any) {
      console.error('Error updating blog post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update blog post',
      });
    }
  };

  const handleCancel = () => {
    setLocation('/admin/blog');
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading blog post...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground">Blog post not found</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Blog Post</h1>
          <p className="text-muted-foreground">
            Modify your blog post content and settings
          </p>
        </div>

        <BlogPostEditor 
          post={post}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </AdminLayout>
  );
} 