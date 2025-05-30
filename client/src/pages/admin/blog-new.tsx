import React from 'react';
import { useLocation } from 'wouter';
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

export default function BlogNew() {
  const [, setLocation] = useLocation();

  const handleSave = async (post: BlogPost) => {
    try {
      const response = await axios.post('/api/admin/blog/posts', post);
      
      toast({
        title: 'Success',
        description: 'Blog post created successfully!',
      });

      // Redirect to the blog management page
      setLocation('/admin/blog');
    } catch (error: any) {
      console.error('Error creating blog post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create blog post',
      });
    }
  };

  const handleCancel = () => {
    setLocation('/admin/blog');
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Blog Post</h1>
          <p className="text-muted-foreground">
            Create and publish a new blog post with rich content and SEO optimization
          </p>
        </div>

        <BlogPostEditor 
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </AdminLayout>
  );
} 