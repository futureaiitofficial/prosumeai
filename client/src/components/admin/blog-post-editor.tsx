import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { 
  Save, 
  Eye, 
  Globe, 
  ImageIcon, 
  Tag, 
  Settings,
  X,
  Upload,
  EyeOff,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TiptapLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
}

interface BlogTag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

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

interface BlogPostEditorProps {
  post?: BlogPost;
  onSave: (post: BlogPost) => Promise<void>;
  onCancel: () => void;
}

// Toolbar component for Tiptap
const EditorToolbar = ({ editor }: { editor: any }) => {
  const [imageDialog, setImageDialog] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imageSize, setImageSize] = useState('medium');
  const [imageAlignment, setImageAlignment] = useState('center');
  const { toast } = useToast();

  if (!editor) return null;

  const handleImageUpload = async (file: File) => {
    try {
      // Blur the editor to prevent focus issues with dialog
      if (editor) {
        editor.commands.blur();
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/admin/blog/upload-media', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadedImageUrl(response.data.url);
      setImageDialog(true);
    } catch (error) {
      console.error('Image upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'Failed to upload image. Please try again.',
      });
    }
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleImageUpload(file);
      }
    };
    input.click();
  };

  const insertImageWithOptions = () => {
    if (!uploadedImageUrl) return;

    // Define size classes
    const sizeClasses = {
      small: 'max-w-xs',     // ~320px
      medium: 'max-w-md',    // ~448px  
      large: 'max-w-2xl',    // ~672px
      full: 'max-w-full'     // 100%
    };

    // Define alignment classes
    const alignmentClasses = {
      left: 'float-left mr-4 mb-2',
      center: 'mx-auto block',
      right: 'float-right ml-4 mb-2'
    };

    const sizeClass = sizeClasses[imageSize as keyof typeof sizeClasses];
    const alignClass = alignmentClasses[imageAlignment as keyof typeof alignmentClasses];
    
    const className = `${sizeClass} ${alignClass} h-auto rounded-lg`.trim();

    // Insert image with custom attributes
    editor.chain().focus().setImage({ 
      src: uploadedImageUrl,
      class: className
    }).run();

    // Reset dialog state
    setImageDialog(false);
    setUploadedImageUrl('');
    setImageSize('medium');
    setImageAlignment('center');
    
    // Restore focus to editor after dialog closes
    setTimeout(() => {
      if (editor) {
        editor.commands.focus();
      }
    }, 100);
  };

  const handleDialogClose = (open: boolean) => {
    setImageDialog(open);
    if (!open) {
      // Reset state when dialog closes
      setUploadedImageUrl('');
      setImageSize('medium');
      setImageAlignment('center');
      
      // Restore focus to editor
      setTimeout(() => {
        if (editor) {
          editor.commands.focus();
        }
      }, 100);
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1">
      <Button
        size="sm"
        variant={editor.isActive('bold') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('italic') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('underline') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 mx-1" />
      
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>

      <div className="w-px h-8 bg-gray-300 mx-1" />
      
      <Button
        size="sm"
        variant={editor.isActive('bulletList') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('orderedList') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('blockquote') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive('codeBlock') ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 mx-1" />
      
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'outline'}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-300 mx-1" />
      
      <Button
        size="sm"
        variant="outline"
        onClick={setLink}
      >
        <Link className="h-4 w-4" />
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={addImage}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Dialog open={imageDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md" aria-describedby="image-dialog-description">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription id="image-dialog-description">
              Choose the size and alignment for your image.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {uploadedImageUrl && (
              <div className="flex justify-center">
                <img 
                  src={uploadedImageUrl} 
                  alt="Preview" 
                  className="max-w-xs h-auto rounded-lg border"
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image-size">Size</Label>
                <Select value={imageSize} onValueChange={setImageSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (320px)</SelectItem>
                    <SelectItem value="medium">Medium (448px)</SelectItem>
                    <SelectItem value="large">Large (672px)</SelectItem>
                    <SelectItem value="full">Full Width</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image-alignment">Alignment</Label>
                <Select value={imageAlignment} onValueChange={setImageAlignment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={insertImageWithOptions}>
              Insert Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export function BlogPostEditor({ post, onSave, onCancel }: BlogPostEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<BlogPost>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    status: 'draft',
    categoryId: null,
    allowComments: true,
    isFeatured: false,
    isSticky: false,
    tags: [],
    ...post
  });

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showSeoSettings, setShowSeoSettings] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Tiptap editor configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData(prev => ({ ...prev, content: html }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4 max-w-none',
        style: 'outline: none; border: none;'
      },
    },
  });

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  useEffect(() => {
    if (post) {
      setFormData(post);
      if (editor && post.content !== editor.getHTML()) {
        editor.commands.setContent(post.content);
      }
      // Load selected tags
      const postTags = tags.filter(tag => post.tags.includes(tag.id));
      setSelectedTags(postTags);
    }
  }, [post, tags, editor]);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        axios.get('/api/admin/blog/categories'),
        axios.get('/api/admin/blog/tags')
      ]);
      setCategories(categoriesRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Error fetching categories and tags:', error);
      toast({
        title: "Error",
        description: "Failed to load categories and tags",
        variant: "destructive"
      });
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTitleChange = (title: string) => {
    const slug = generateSlug(title);
    setFormData(prev => ({ ...prev, title, slug }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/admin/blog/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFormData(prev => ({
        ...prev,
        featuredImage: response.data.imageUrl
      }));

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const addTag = (tag: BlogTag) => {
    if (!selectedTags.find(t => t.id === tag.id)) {
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      setFormData(prev => ({
        ...prev,
        tags: newSelectedTags.map(t => t.id)
      }));
    }
  };

  const removeTag = (tagId: number) => {
    const newSelectedTags = selectedTags.filter(t => t.id !== tagId);
    setSelectedTags(newSelectedTags);
    setFormData(prev => ({
      ...prev,
      tags: newSelectedTags.map(t => t.id)
    }));
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await axios.post('/api/admin/blog/tags', {
        name: newTagName,
        slug: generateSlug(newTagName)
      });

      const newTag = response.data;
      setTags(prev => [...prev, newTag]);
      addTag(newTag);
      setNewTagName('');

      toast({
        title: "Success",
        description: "Tag created successfully"
      });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (status?: 'draft' | 'published' | 'scheduled') => {
    try {
      setLoading(true);

      const postData = {
        ...formData,
        status: status || formData.status,
        publishedAt: status === 'published' ? new Date().toISOString() : formData.publishedAt
      };

      await onSave(postData);
      
      toast({
        title: "Success",
        description: `Post ${status === 'published' ? 'published' : 'saved'} successfully`
      });
    } catch (error) {
      console.error('Error saving post:', error);
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {post?.id ? 'Edit Post' : 'Create New Post'}
          </h1>
          <p className="text-muted-foreground">
            Create and publish your blog post with rich content
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {previewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSave('draft')}
            disabled={loading}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSave('published')}
            disabled={loading}
          >
            <Globe className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter post title..."
                  className="text-lg"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="post-url-slug"
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="Brief description of the post..."
                  rows={3}
                />
              </div>

              {/* Tiptap Editor */}
              <div>
                <Label>Content</Label>
                
                {!previewMode ? (
                  <div className="border rounded-md overflow-hidden">
                    <EditorToolbar editor={editor} />
                    <EditorContent editor={editor} />
                  </div>
                ) : (
                  /* Preview Mode */
                  <div className="min-h-[400px] p-4 border rounded-md bg-gray-50">
                    <div className="prose prose-sm max-w-none">
                      <h1>{formData.title}</h1>
                      {formData.excerpt && <p className="text-gray-600 italic">{formData.excerpt}</p>}
                      <div dangerouslySetInnerHTML={{ __html: formData.content }} />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SEO Settings</CardTitle>
                  <CardDescription>Optimize your post for search engines</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowSeoSettings(!showSeoSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            {showSeoSettings && (
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                    placeholder="SEO-optimized title (60 chars max)"
                    maxLength={60}
                  />
                  <p className="text-sm text-muted-foreground">
                    {(formData.seoTitle || '').length}/60 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                    placeholder="Meta description for search results (160 chars max)"
                    maxLength={160}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    {(formData.seoDescription || '').length}/160 characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="seoKeywords">SEO Keywords</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, seoKeywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div>
                  <Label htmlFor="canonicalUrl">Canonical URL</Label>
                  <Input
                    id="canonicalUrl"
                    value={formData.canonicalUrl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                    placeholder="https://example.com/canonical-url"
                    type="url"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'scheduled' && (
                <div>
                  <Label htmlFor="scheduledAt">Publish Date</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured Post</Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isSticky">Sticky Post</Label>
                <Switch
                  id="isSticky"
                  checked={formData.isSticky}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSticky: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowComments">Allow Comments</Label>
                <Switch
                  id="allowComments"
                  checked={formData.allowComments}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowComments: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.categoryId?.toString() || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag.name}</span>
                    <button onClick={() => removeTag(tag.id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <Select onValueChange={(value) => {
                const tag = tags.find(t => t.id.toString() === value);
                if (tag) addTag(tag);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Add tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.filter(tag => !selectedTags.find(st => st.id === tag.id)).map((tag) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Input
                  placeholder="New tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createNewTag()}
                />
                <Button onClick={createNewTag} size="sm">
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.featuredImage ? (
                <div className="space-y-2">
                  <img
                    src={formData.featuredImage}
                    alt="Featured"
                    className="w-full h-32 object-cover rounded"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, featuredImage: undefined }))}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                  </p>
                  <Button variant="outline" size="sm" disabled={uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              {formData.featuredImage && (
                <div>
                  <Label htmlFor="featuredImageAlt">Alt Text</Label>
                  <Input
                    id="featuredImageAlt"
                    value={formData.featuredImageAlt || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, featuredImageAlt: e.target.value }))}
                    placeholder="Describe the image..."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 