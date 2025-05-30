import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { 
  Search, 
  Calendar, 
  Clock, 
  Tag, 
  ArrowRight, 
  Filter,
  X,
  Loader2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SharedHeader from '@/components/layouts/shared-header';
import SharedFooter from '@/components/layouts/SharedFooter';
import { useBranding } from '@/components/branding/branding-provider';
import { useQuery } from '@tanstack/react-query';
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
  publishedAt?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
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

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  postCount: number;
  isActive: boolean;
}

interface BlogTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  postCount: number;
}

interface BlogSettings {
  blogTitle: string;
  blogDescription: string;
  postsPerPage: number;
  allowComments: boolean;
  enableReadTime: boolean;
  enableTableOfContents: boolean;
  socialShareButtons: string[];
}

export default function BlogPage() {
  const { appName } = useBranding();
  const [, setLocation] = useLocation();
  const search = useSearch();
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(search);
  const pageParam = parseInt(urlParams.get('page') || '1');
  const categoryParam = urlParams.get('category') || '';
  const searchParam = urlParams.get('q') || '';
  const tagParam = urlParams.get('tag') || '';
  
  const [currentPage, setCurrentPage] = useState(pageParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchTerm, setSearchTerm] = useState(searchParam);
  const [selectedTag, setSelectedTag] = useState(tagParam);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch blog settings
  const { data: blogSettings } = useQuery<BlogSettings>({
    queryKey: ['/api/blog/settings'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/settings');
      return response.data;
    }
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<BlogCategory[]>({
    queryKey: ['/api/blog/categories'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/categories');
      return response.data;
    }
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<BlogTag[]>({
    queryKey: ['/api/blog/tags'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/tags');
      return response.data;
    }
  });

  // Fetch posts
  const { data: postsData, isLoading } = useQuery({
    queryKey: ['/api/blog/posts', {
      page: currentPage,
      category: selectedCategory,
      search: searchTerm,
      tag: selectedTag
    }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: (blogSettings?.postsPerPage || 10).toString()
      });
      
      if (selectedCategory) {
        // Find category ID by slug
        const category = categories.find(cat => cat.slug === selectedCategory);
        if (category) {
          params.set('categoryId', category.id.toString());
        }
      }
      
      if (searchTerm.trim()) {
        params.set('search', searchTerm.trim());
      }
      
      if (selectedTag) {
        // Find tag ID by slug
        const tag = tags.find(t => t.slug === selectedTag);
        if (tag) {
          params.set('tagId', tag.id.toString());
        }
      }
      
      const response = await axios.get(`/api/blog/posts?${params.toString()}`);
      return response.data;
    },
    enabled: !!(blogSettings && categories.length > 0 && tags.length > 0)
  });

  // Fetch featured posts
  const { data: featuredPosts = [] } = useQuery<BlogPost[]>({
    queryKey: ['/api/blog/featured'],
    queryFn: async () => {
      const response = await axios.get('/api/blog/featured?limit=3');
      return response.data;
    }
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (selectedCategory) params.set('category', selectedCategory);
    if (searchTerm.trim()) params.set('q', searchTerm.trim());
    if (selectedTag) params.set('tag', selectedTag);
    
    const newSearch = params.toString();
    const newPath = newSearch ? `/blog?${newSearch}` : '/blog';
    
    if (newPath !== window.location.pathname + window.location.search) {
      window.history.replaceState({}, '', newPath);
    }
  }, [currentPage, selectedCategory, searchTerm, selectedTag]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string) => {
    setSelectedCategory(categorySlug === 'all' ? '' : categorySlug);
    setCurrentPage(1);
  };

  const handleTagSelect = (tagSlug: string) => {
    setSelectedTag(tagSlug);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setSelectedTag('');
    setCurrentPage(1);
  };

  const activeFiltersCount = [selectedCategory, searchTerm, selectedTag].filter(Boolean).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getReadingTime = (post: BlogPost) => {
    if (blogSettings?.enableReadTime && post.readTime) {
      return `${post.readTime} min read`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <SharedHeader forceBackground />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white py-20 pt-32 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {blogSettings?.blogTitle || 'Blog'}
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-10">
              {blogSettings?.blogDescription || 'Latest insights, tips, and updates'}
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Filters Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex flex-wrap items-center gap-4">
                {/* Category Filter */}
                <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.slug}>
                        {category.name} ({category.postCount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Mobile Filters Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="md:hidden"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>

                {/* Clear Filters */}
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Results Count */}
              {postsData && (
                <span className="text-sm text-gray-600">
                  {postsData.total} articles found
                </span>
              )}
            </div>

            {/* Mobile Filters Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white p-4 rounded-lg shadow-sm border md:hidden"
                >
                  <h3 className="font-semibold mb-3">Filter by Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.slice(0, 10).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTag === tag.slug ? "default" : "outline"}
                        className="cursor-pointer hover:bg-indigo-100"
                        style={{ backgroundColor: selectedTag === tag.slug ? tag.color : undefined }}
                        onClick={() => handleTagSelect(tag.slug)}
                      >
                        {tag.name} ({tag.postCount})
                      </Badge>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            )}

            {/* Posts Grid */}
            {postsData?.posts && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-8"
              >
                {postsData.posts.map((post: BlogPost) => (
                  <motion.article
                    key={post.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <Link href={`/blog/${post.slug}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Featured Image */}
                          {post.featuredImage && (
                            <div className="md:col-span-1">
                              <div className="aspect-video md:aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg overflow-hidden">
                                <img
                                  src={post.featuredImage}
                                  alt={post.featuredImageAlt || post.title}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className={`${post.featuredImage ? 'md:col-span-2' : 'md:col-span-3'} p-6`}>
                            <CardHeader className="p-0 mb-4">
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                {post.category && (
                                  <Badge variant="secondary">
                                    {post.category.name}
                                  </Badge>
                                )}
                                {post.isFeatured && (
                                  <Badge className="bg-yellow-100 text-yellow-800">
                                    Featured
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(post.publishedAt || post.createdAt), 'MMM d, yyyy')}
                                </div>
                                {getReadingTime(post) && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {getReadingTime(post)}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  {post.viewCount}
                                </div>
                              </div>
                              
                              <CardTitle className="text-2xl hover:text-indigo-600 transition-colors">
                                {post.title}
                              </CardTitle>
                              
                              {post.excerpt && (
                                <CardDescription className="text-base mt-2 line-clamp-3">
                                  {post.excerpt}
                                </CardDescription>
                              )}
                            </CardHeader>
                            
                            <CardContent className="p-0">
                              {/* Tags */}
                              {post.tags && post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {post.tags.slice(0, 3).map((tag) => (
                                    <Badge
                                      key={tag.id}
                                      variant="outline"
                                      className="text-xs"
                                      style={{ borderColor: tag.color, color: tag.color }}
                                    >
                                      <Tag className="h-3 w-3 mr-1" />
                                      {tag.name}
                                    </Badge>
                                  ))}
                                  {post.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{post.tags.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                              
                              {/* Author & Read More */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {post.author?.fullName?.[0] || post.author?.username?.[0] || 'A'}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {post.author?.fullName || post.author?.username || 'Anonymous'}
                                  </span>
                                </div>
                                
                                <Button variant="ghost" size="sm" className="group">
                                  Read more
                                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                              </div>
                            </CardContent>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  </motion.article>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {postsData && postsData.pages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                {[...Array(Math.min(5, postsData.pages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  disabled={currentPage >= postsData.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}

            {/* No Results */}
            {postsData?.posts && postsData.posts.length === 0 && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button onClick={clearFilters}>Clear all filters</Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Featured Articles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {featuredPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`}>
                      <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        {post.featuredImage && (
                          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {format(new Date(post.publishedAt || post.createdAt), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto"
                        onClick={() => handleCategoryChange(category.slug)}
                      >
                        <span className={selectedCategory === category.slug ? 'font-semibold' : ''}>
                          {category.name}
                        </span>
                        <Badge variant="secondary" className="ml-2">
                          {category.postCount}
                        </Badge>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 15).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTag === tag.slug ? "default" : "outline"}
                      className="cursor-pointer hover:bg-indigo-100"
                      style={{ backgroundColor: selectedTag === tag.slug ? tag.color : undefined }}
                      onClick={() => handleTagSelect(tag.slug)}
                    >
                      {tag.name} ({tag.postCount})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SharedFooter />
    </div>
  );
} 