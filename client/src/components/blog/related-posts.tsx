import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  createdAt: string;
  publishedAt?: string;
  featuredImage?: string;
  readTime?: number;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

interface BlogSettings {
  enableReadTime?: boolean;
}

interface RelatedPostsProps {
  posts: BlogPost[];
  blogSettings?: BlogSettings;
  appName: string;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ posts, blogSettings }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.0 }}
      className="mt-20 pt-12 border-t"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Continue Reading</h2>
      <p className="text-gray-600 mb-8">Check more recommended readings to get the job of your dreams.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((relatedPost) => (
          <Card key={relatedPost.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <Link href={`/blog/${relatedPost.slug}`}>
              {relatedPost.featuredImage && (
                <div className="aspect-video bg-gray-100 overflow-hidden rounded-t-lg">
                  <img
                    src={relatedPost.featuredImage}
                    alt={relatedPost.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
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
  );
};

export default RelatedPosts; 