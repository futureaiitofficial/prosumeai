import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Tag, 
  ArrowLeft, 
  Share2,
  Eye,
  Heart,
  BookOpen,
  ChevronRight,
  Copy,
  Facebook,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  isFeatured: boolean;
  viewCount: number;
  readTime: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  author?: {
    id: number;
    username: string;
    fullName: string;
  };
  tags?: Array<{
    id: number;
    name: string;
    slug: string;
    color: string;
  }>;
}

interface BlogSettings {
  blogTitle: string;
  blogDescription: string;
  enableReadTime: boolean;
  enableTableOfContents: boolean;
  socialShareButtons: string[];
}

export default function BlogPostPage() {
  const { appName } = useBranding();
  const { toast } = useToast();
  const { slug } = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [tableOfContents, setTableOfContents] = useState<Array<{
    id: string;
    text: string;
    level: number;
  }>>([]);

  // Fetch blog settings
  const { data: blogSettings } = useQuery<BlogSettings>({
    queryKey: ['/api/blog/settings'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/settings');
      return response.data;
    }
  });

  // Fetch the blog post
  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ['/api/blog/posts', slug],
    queryFn: async () => {
      const response = await axios.get(`/api/blog/posts/${slug}`);
      return response.data;
    },
    enabled: !!slug
  });

  // Fetch related posts
  const { data: relatedPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/related', post?.category?.id],
    queryFn: async () => {
      if (!post?.category?.id) return [];
      const response = await axios.get(`/api/blog/posts?categoryId=${post.category.id}&limit=3`);
      return response.data.posts.filter((p: BlogPost) => p.id !== post.id).slice(0, 3);
    },
    enabled: !!post?.category?.id
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/blog/categories'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/categories');
      return response.data;
    }
  });

  // Fetch recent posts for sidebar
  const { data: recentPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/recent'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/recent?limit=6');
      return response.data.filter((p: BlogPost) => p.id !== post?.id);
    },
    enabled: !!post
  });

  // Generate table of contents
  useEffect(() => {
    if (post?.content && blogSettings?.enableTableOfContents) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = post.content;
      
      const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const toc = Array.from(headings).map((heading, index) => {
        const id = `heading-${index}`;
        return {
          id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName.charAt(1))
        };
      });
      
      setTableOfContents(toc);
    }
  }, [post?.content, blogSettings?.enableTableOfContents]);

  // Update document title and meta tags
  useEffect(() => {
    if (post) {
      document.title = post.seoTitle || post.title;
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.seoDescription || post.excerpt || '');
      }
      
      // Update meta keywords
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords && post.seoKeywords) {
        metaKeywords.setAttribute('content', post.seoKeywords);
      }
      
      // Update canonical URL
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', post.canonicalUrl || window.location.href);
      }
    }
    
    return () => {
      document.title = appName;
    };
  }, [post, appName]);

  const sharePost = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    const text = post?.excerpt || '';
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        toast({
          title: 'Link copied!',
          description: 'The post URL has been copied to your clipboard.',
        });
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const scrollToHeading = (headingId: string) => {
    const element = document.getElementById(headingId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Process content to add IDs to headings for table of contents
  const processedContent = React.useMemo(() => {
    if (!post?.content) return '';
    
    let content = post.content;
    if (blogSettings?.enableTableOfContents && tableOfContents.length > 0) {
      tableOfContents.forEach((heading, index) => {
        const headingRegex = new RegExp(`<h${heading.level}([^>]*)>(.*?)<\/h${heading.level}>`, 'i');
        content = content.replace(headingRegex, `<h${heading.level}$1 id="heading-${index}">$2</h${heading.level}>`);
      });
    }
    
    return content;
  }, [post?.content, tableOfContents, blogSettings?.enableTableOfContents]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <SharedHeader forceBackground />
        <div className="flex items-center justify-center min-h-[60vh] pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
        <SharedFooter />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-white">
        <SharedHeader forceBackground />
        <div className="container mx-auto px-4 py-20 text-center pt-32">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link href="/blog">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
        <SharedFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SharedHeader forceBackground />
      
      {/* Breadcrumb */}
      <div className="bg-gray-50 border-b pt-20">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
            {post.category && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/blog?category=${post.category.slug}`} className="hover:text-indigo-600 transition-colors">
                  {post.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">{post.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="max-w-4xl">
              {/* Article Header */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                {/* Category Badge */}
                {post.category && (
                  <div className="mb-4">
                    <Link href={`/blog?category=${post.category.slug}`}>
                      <Badge 
                        variant="secondary" 
                        className="uppercase text-xs font-semibold tracking-wide bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer px-3 py-1"
                      >
                        {post.category.name}
                      </Badge>
                    </Link>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  {post.title}
                </h1>

                {/* Author and Meta Info */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {post.author?.fullName?.[0] || post.author?.username?.[0] || 'A'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Written by <strong>{post.author?.fullName || post.author?.username || 'Anonymous'}</strong>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      Pub: {format(new Date(post.publishedAt || post.createdAt), 'M/d/yyyy')}
                    </span>
                    {post.updatedAt && new Date(post.updatedAt) > new Date(post.createdAt) && (
                      <span>
                        Upd: {format(new Date(post.updatedAt), 'M/d/yyyy')}
                      </span>
                    )}
                    {blogSettings?.enableReadTime && post.readTime && (
                      <span>{post.readTime} min read</span>
                    )}
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex items-center gap-3 pb-8 border-b">
                  <span className="text-sm font-medium text-gray-700">Share:</span>
                  <div className="flex items-center gap-2">
                    {blogSettings?.socialShareButtons?.includes('twitter') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => sharePost('twitter')}
                        className="h-8 w-8 p-0"
                      >
                        <Twitter className="h-4 w-4" />
                      </Button>
                    )}
                    {blogSettings?.socialShareButtons?.includes('facebook') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => sharePost('facebook')}
                        className="h-8 w-8 p-0"
                      >
                        <Facebook className="h-4 w-4" />
                      </Button>
                    )}
                    {blogSettings?.socialShareButtons?.includes('linkedin') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => sharePost('linkedin')}
                        className="h-8 w-8 p-0"
                      >
                        <Linkedin className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => sharePost('copy')}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="ml-auto flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.viewCount} views
                    </div>
                  </div>
                </div>
              </motion.header>

              {/* Featured Image */}
              {post.featuredImage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mb-12"
                >
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              )}

              {/* Article Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-strong:font-semibold prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-blockquote:border-l-4 prose-blockquote:border-indigo-200 prose-blockquote:bg-indigo-50 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:not-italic prose-blockquote:text-gray-700 prose-img:rounded-lg prose-img:shadow-sm prose-ul:list-disc prose-ol:list-decimal prose-li:mb-2 prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3"
                dangerouslySetInnerHTML={{ __html: processedContent }}
              />

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="mt-12 pt-8 border-t"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-gray-50 transition-colors text-sm"
                          style={{ borderColor: tag.color, color: tag.color }}
                        >
                          {tag.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Back to Blog */}
              <div className="mt-12 pt-8 border-t">
                <Link href="/blog">
                  <Button variant="outline" className="font-medium">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Blog
                  </Button>
                </Link>
              </div>
            </article>
          </div>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="lg:col-span-1"
          >
            <div className="sticky top-24 space-y-6">
              {/* Call to Action Card */}
              <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Upgrade your resume in minutes
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      Use this AI resume builder to create an ATS resume and get more interviews.
                    </p>
                    <Link href="/register">
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium">
                        Upgrade Your Resume
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Resume Resources */}
              <Card className="border-0 shadow-sm bg-green-50 border border-green-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {categories.slice(0, 6).map((category: any) => (
                      <Link 
                        key={category.id} 
                        href={`/blog?category=${category.slug}`} 
                        className="block text-sm text-gray-600 hover:text-green-600 transition-colors"
                      >
                        {category.name} ({category.postCount})
                      </Link>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-gray-500">No categories available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Continue Reading */}
              <Card className="border-0 shadow-sm bg-amber-50 border border-amber-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Continue Reading
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-4">
                    Check more recommended readings to get the job of your dreams.
                  </p>
                  <div className="space-y-4">
                    {recentPosts.slice(0, 3).map((recentPost: BlogPost) => (
                      <div key={recentPost.id} className="border-b pb-3 last:border-b-0">
                        <div className="flex gap-3">
                          <div className="w-16 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                            {recentPost.featuredImage ? (
                              <img 
                                src={recentPost.featuredImage} 
                                alt={recentPost.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Link href={`/blog/${recentPost.slug}`} className="block">
                              <h4 className="text-sm font-medium text-gray-900 hover:text-amber-600 transition-colors line-clamp-2 mb-1">
                                {recentPost.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{recentPost.category?.name || 'BLOG'}</span>
                                <span>•</span>
                                {blogSettings?.enableReadTime && recentPost.readTime && (
                                  <span>{recentPost.readTime} min read</span>
                                )}
                              </div>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {recentPosts.length === 0 && (
                      <p className="text-sm text-gray-500">No recent posts available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Get Started Section */}
              <Card className="border-0 shadow-sm bg-slate-50 border border-slate-100">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Get started
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <Link href="/register" className="block text-sm text-gray-600 hover:text-slate-600 transition-colors">
                      • Create Resume
                    </Link>
                    <Link href="/pricing" className="block text-sm text-gray-600 hover:text-slate-600 transition-colors">
                      • Pricing
                    </Link>
                    <Link href="/terms" className="block text-sm text-gray-600 hover:text-slate-600 transition-colors">
                      • Terms of Service
                    </Link>
                    <Link href="/privacy" className="block text-sm text-gray-600 hover:text-slate-600 transition-colors">
                      • Privacy Policy
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.aside>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-20 pt-12 border-t"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Continue Reading</h2>
            <p className="text-gray-600 mb-8">Check more recommended readings to get the job of your dreams.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <Link href={`/blog/${relatedPost.slug}`}>
                    {relatedPost.featuredImage && (
                      <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                        <img
                          src={relatedPost.featuredImage}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      {relatedPost.category && (
                        <Badge variant="secondary" className="mb-3 text-xs uppercase tracking-wide">
                          {relatedPost.category.name}
                        </Badge>
                      )}
                      <CardTitle className="text-lg line-clamp-2 hover:text-indigo-600 transition-colors mb-2">
                        {relatedPost.title}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Pub: {format(new Date(relatedPost.publishedAt || relatedPost.createdAt), 'M/d/yyyy')}</span>
                        {blogSettings?.enableReadTime && relatedPost.readTime && (
                          <span>{relatedPost.readTime} min read</span>
                        )}
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      <SharedFooter />
    </div>
  );
} 