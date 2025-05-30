import React, { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  Tag, 
  Folder, 
  Settings,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Save,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranding } from '../../components/branding/branding-provider';
import axios from 'axios';
import { useToast } from '../../hooks/use-toast';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useLocation } from 'wouter';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  publishedAt?: string;
  category?: {
    id: number;
    name: string;
  };
  author?: {
    id: number;
    username: string;
    fullName: string;
  };
  tags?: Array<{
    id: number;
    name: string;
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
  sortOrder: number;
}

interface BlogTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  postCount: number;
}

interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
}

interface BlogSettings {
  id?: number;
  blogTitle: string;
  blogDescription: string;
  blogKeywords?: string;
  postsPerPage: number;
  allowComments: boolean;
  moderateComments: boolean;
  enableRss: boolean;
  enableSitemap: boolean;
  featuredImageRequired: boolean;
  enableReadTime: boolean;
  enableTableOfContents: boolean;
  socialShareButtons: string[];
  customCss?: string;
  customJs?: string;
}

export default function AdminBlog() {
  const { appName } = useBranding();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [stats, setStats] = useState<BlogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Dialog states
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BlogCategory | null>(null);
  const [editingTag, setEditingTag] = useState<BlogTag | null>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });
  
  const [tagForm, setTagForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#4f46e5'
  });
  
  // Blog settings
  const [blogSettings, setBlogSettings] = useState<BlogSettings>({
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
  });

  useEffect(() => {
    fetchData();
    fetchBlogSettings();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [postsRes, categoriesRes, tagsRes, statsRes] = await Promise.all([
        axios.get('/api/admin/blog/posts'),
        axios.get('/api/admin/blog/categories?includePostCount=true'),
        axios.get('/api/admin/blog/tags?includePostCount=true'),
        axios.get('/api/admin/blog/statistics')
      ]);

      setPosts(postsRes.data.posts || postsRes.data);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching blog data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch blog data',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch = searchTerm === '' || 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || 
        (post.category && post.category.id.toString() === categoryFilter);
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [posts, searchTerm, statusFilter, categoryFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      published: { label: 'Published', variant: 'default' as const },
      draft: { label: 'Draft', variant: 'secondary' as const },
      scheduled: { label: 'Scheduled', variant: 'outline' as const },
      archived: { label: 'Archived', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const fetchBlogSettings = async () => {
    try {
      const response = await axios.get('/api/admin/blog/settings');
      setBlogSettings(response.data);
    } catch (error) {
      console.error('Error fetching blog settings:', error);
    }
  };

  const saveBlogSettings = async () => {
    try {
      await axios.put('/api/admin/blog/settings', blogSettings);
      toast({
        title: 'Success',
        description: 'Blog settings saved successfully!',
      });
    } catch (error: any) {
      console.error('Error saving blog settings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save settings',
      });
    }
  };

  const handleCreateCategory = async () => {
    try {
      const response = await axios.post('/api/admin/blog/categories', categoryForm);
      setCategories([...categories, response.data]);
      setCategoryDialog(false);
      setCategoryForm({ name: '', slug: '', description: '', isActive: true, sortOrder: 0 });
      toast({
        title: 'Success',
        description: 'Category created successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create category',
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    
    try {
      const response = await axios.put(`/api/admin/blog/categories/${editingCategory.id}`, categoryForm);
      setCategories(categories.map(cat => cat.id === editingCategory.id ? response.data : cat));
      setCategoryDialog(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '', description: '', isActive: true, sortOrder: 0 });
      toast({
        title: 'Success',
        description: 'Category updated successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update category',
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await axios.delete(`/api/admin/blog/categories/${categoryId}`);
      setCategories(categories.filter(cat => cat.id !== categoryId));
      toast({
        title: 'Success',
        description: 'Category deleted successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete category',
      });
    }
  };

  const handleCreateTag = async () => {
    try {
      const response = await axios.post('/api/admin/blog/tags', tagForm);
      setTags([...tags, response.data]);
      setTagDialog(false);
      setTagForm({ name: '', slug: '', description: '', color: '#4f46e5' });
      toast({
        title: 'Success',
        description: 'Tag created successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create tag',
      });
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;
    
    try {
      const response = await axios.put(`/api/admin/blog/tags/${editingTag.id}`, tagForm);
      setTags(tags.map(tag => tag.id === editingTag.id ? response.data : tag));
      setTagDialog(false);
      setEditingTag(null);
      setTagForm({ name: '', slug: '', description: '', color: '#4f46e5' });
      toast({
        title: 'Success',
        description: 'Tag updated successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error updating tag:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update tag',
      });
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;
    
    try {
      await axios.delete(`/api/admin/blog/tags/${tagId}`);
      setTags(tags.filter(tag => tag.id !== tagId));
      toast({
        title: 'Success',
        description: 'Tag deleted successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete tag',
      });
    }
  };

  const handleEditPost = (postId: number) => {
    setLocation(`/admin/blog/edit/${postId}`);
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) return;
    
    try {
      await axios.delete(`/api/admin/blog/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: 'Success',
        description: 'Blog post deleted successfully!',
      });
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete blog post',
      });
    }
  };

  const handleViewPost = (post: BlogPost) => {
    // For now, we'll just show a toast. In the future, this could open a preview or navigate to the public blog post
    toast({
      title: 'View Post',
      description: `Viewing "${post.title}" - Public blog view coming soon!`,
    });
  };

  const openCategoryDialog = (category?: BlogCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        isActive: category.isActive,
        sortOrder: category.sortOrder
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: '', slug: '', description: '', isActive: true, sortOrder: 0 });
    }
    setCategoryDialog(true);
  };

  const openTagDialog = (tag?: BlogTag) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({
        name: tag.name,
        slug: tag.slug,
        description: tag.description || '',
        color: tag.color
      });
    } else {
      setEditingTag(null);
      setTagForm({ name: '', slug: '', description: '', color: '#4f46e5' });
    }
    setTagDialog(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading blog data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <TooltipProvider>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
              <p className="text-muted-foreground">
                Manage your blog posts, categories, and settings
              </p>
            </div>
            <Button onClick={() => window.open('/admin/blog/new', '_blank')}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalPosts}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.publishedPosts} published, {stats.draftPosts} drafts
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all published posts
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Categories & Tags</CardTitle>
                      <Tag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalCategories + stats.totalTags}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalCategories} categories, {stats.totalTags} tags
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Posts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                  <CardDescription>Latest blog posts and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {posts.slice(0, 5).map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {post.isFeatured && (
                                <Badge variant="outline" className="text-xs">Featured</Badge>
                              )}
                              <span>{post.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>{post.category?.name || 'Uncategorized'}</TableCell>
                          <TableCell>{post.viewCount}</TableCell>
                          <TableCell>
                            {format(new Date(post.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleViewPost(post)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View post</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditPost(post.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit post</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete post</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="posts" className="space-y-4">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search posts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Posts Table */}
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Views</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {post.isFeatured && (
                                <Badge variant="outline" className="text-xs">Featured</Badge>
                              )}
                              <span>{post.title}</span>
                            </div>
                            {post.excerpt && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                {post.excerpt}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(post.status)}</TableCell>
                          <TableCell>{post.category?.name || 'Uncategorized'}</TableCell>
                          <TableCell>{post.author?.fullName || post.author?.username}</TableCell>
                          <TableCell>{post.viewCount}</TableCell>
                          <TableCell>
                            {format(new Date(post.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleViewPost(post)}>
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View post</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleEditPost(post.id)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit post</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete post</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Categories</h3>
                <Button onClick={() => openCategoryDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Category
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell className="font-mono text-sm">{category.slug}</TableCell>
                          <TableCell>{category.postCount}</TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? 'default' : 'secondary'}>
                              {category.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{category.sortOrder}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openCategoryDialog(category)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteCategory(category.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Tags</h3>
                <Button onClick={() => openTagDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tag
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Posts</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tags.map((tag) => (
                        <TableRow key={tag.id}>
                          <TableCell className="font-medium">{tag.name}</TableCell>
                          <TableCell className="font-mono text-sm">{tag.slug}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: tag.color }}
                              />
                              <span className="font-mono text-sm">{tag.color}</span>
                            </div>
                          </TableCell>
                          <TableCell>{tag.postCount}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openTagDialog(tag)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteTag(tag.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Blog Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure your blog settings and preferences
                  </p>
                </div>
                <Button onClick={saveBlogSettings}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>

              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Basic blog configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="blogTitle">Blog Title</Label>
                        <Input
                          id="blogTitle"
                          value={blogSettings.blogTitle}
                          onChange={(e) => setBlogSettings({ ...blogSettings, blogTitle: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postsPerPage">Posts Per Page</Label>
                        <Input
                          id="postsPerPage"
                          type="number"
                          value={blogSettings.postsPerPage}
                          onChange={(e) => setBlogSettings({ ...blogSettings, postsPerPage: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="blogDescription">Blog Description</Label>
                      <Textarea
                        id="blogDescription"
                        value={blogSettings.blogDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBlogSettings({ ...blogSettings, blogDescription: e.target.value })}
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="blogKeywords">Blog Keywords</Label>
                      <Input
                        id="blogKeywords"
                        value={blogSettings.blogKeywords || ''}
                        onChange={(e) => setBlogSettings({ ...blogSettings, blogKeywords: e.target.value })}
                        placeholder="Enter keywords separated by commas"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>Enable or disable blog features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Allow Comments</Label>
                        <p className="text-sm text-muted-foreground">Allow visitors to comment on posts</p>
                      </div>
                      <Switch 
                        checked={blogSettings.allowComments}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, allowComments: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Moderate Comments</Label>
                        <p className="text-sm text-muted-foreground">Require approval before comments are published</p>
                      </div>
                      <Switch 
                        checked={blogSettings.moderateComments}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, moderateComments: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable RSS Feed</Label>
                        <p className="text-sm text-muted-foreground">Generate RSS feed for subscribers</p>
                      </div>
                      <Switch 
                        checked={blogSettings.enableRss}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, enableRss: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Sitemap</Label>
                        <p className="text-sm text-muted-foreground">Generate XML sitemap for search engines</p>
                      </div>
                      <Switch 
                        checked={blogSettings.enableSitemap}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, enableSitemap: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Featured Image Required</Label>
                        <p className="text-sm text-muted-foreground">Require featured images for all posts</p>
                      </div>
                      <Switch 
                        checked={blogSettings.featuredImageRequired}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, featuredImageRequired: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Read Time</Label>
                        <p className="text-sm text-muted-foreground">Show estimated reading time for posts</p>
                      </div>
                      <Switch 
                        checked={blogSettings.enableReadTime}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, enableReadTime: value })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable Table of Contents</Label>
                        <p className="text-sm text-muted-foreground">Auto-generate table of contents for posts</p>
                      </div>
                      <Switch 
                        checked={blogSettings.enableTableOfContents}
                        onCheckedChange={(value) => setBlogSettings({ ...blogSettings, enableTableOfContents: value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>Custom CSS and JavaScript</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="customCss">Custom CSS</Label>
                      <Textarea
                        id="customCss"
                        value={blogSettings.customCss || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBlogSettings({ ...blogSettings, customCss: e.target.value })}
                        rows={5}
                        placeholder="Enter custom CSS styles..."
                        className="font-mono text-sm"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customJs">Custom JavaScript</Label>
                      <Textarea
                        id="customJs"
                        value={blogSettings.customJs || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBlogSettings({ ...blogSettings, customJs: e.target.value })}
                        rows={5}
                        placeholder="Enter custom JavaScript code..."
                        className="font-mono text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>

      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Category Form</DialogTitle>
            <DialogDescription>Fill out the form to create or update a category</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <Input
                id="slug"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isActive" className="text-right">
                Status
              </Label>
              <Switch
                id="isActive"
                checked={categoryForm.isActive}
                onCheckedChange={(value) => setCategoryForm({ ...categoryForm, isActive: value })}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sortOrder" className="text-right">
                Order
              </Label>
              <Input
                id="sortOrder"
                type="number"
                value={categoryForm.sortOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tagDialog} onOpenChange={setTagDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tag Form</DialogTitle>
            <DialogDescription>Fill out the form to create or update a tag</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="slug" className="text-right">
                Slug
              </Label>
              <Input
                id="slug"
                value={tagForm.slug}
                onChange={(e) => setTagForm({ ...tagForm, slug: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={tagForm.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTagForm({ ...tagForm, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <Input
                id="color"
                type="color"
                value={tagForm.color}
                onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={editingTag ? handleUpdateTag : handleCreateTag}>
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 