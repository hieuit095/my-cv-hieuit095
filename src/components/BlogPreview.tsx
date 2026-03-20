import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useBlogPosts } from "@/hooks/usePortfolioData";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { AnimatedSection, staggerContainer, staggerItem } from "@/components/animations/AnimatedComponents";

export const BlogPreview = () => {
  const { data: posts, isLoading } = useBlogPosts();

  if (isLoading) {
    return (
      <section id="blog" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <Skeleton className="h-10 w-48 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border">
                <Skeleton className="h-48 rounded-lg mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) return null;

  const displayPosts = posts.slice(0, 3);

  return (
    <section id="blog" className="py-24">
      <div className="container mx-auto px-4">
        <AnimatedSection className="text-center mb-16">
          <p className="section-label">Articles</p>
          <h2 className="section-title">Latest Blog Posts</h2>
        </AnimatedSection>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {displayPosts.map((post) => (
            <motion.div key={post.id} variants={staggerItem}>
              <Link
                to={`/blog/${post.slug}`}
                className="group block p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
              >
                {post.cover_image_url && (
                  <div className="relative overflow-hidden rounded-lg mb-4">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-44 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground mb-2">
                  {post.published_at && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(post.published_at), "MMM d, yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {post.reading_time_minutes} min read
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {post.tags.slice(0, 3).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs rounded-md bg-secondary text-secondary-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {posts.length > 3 && (
          <AnimatedSection delay={0.3} className="text-center mt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              View all posts
              <ArrowRight size={16} />
            </Link>
          </AnimatedSection>
        )}
      </div>
    </section>
  );
};
