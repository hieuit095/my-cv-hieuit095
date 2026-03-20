/*
  # RSS Feed Automation

  ## Overview
  Adds tables to support AI-powered automated blog post generation from RSS feeds.

  ## New Tables

  ### rss_feed_configs
  Stores RSS feed sources configured by users for automated blog generation.
  - `id` - Primary key
  - `user_id` - Owner of this feed config (references auth.users)
  - `feed_name` - Human-readable name for the feed
  - `feed_url` - Full URL of the RSS/Atom feed
  - `interval_hours` - How often to check for new posts (6, 12, or 24 hours)
  - `is_active` - Whether automated processing is enabled
  - `auto_publish` - Whether generated posts are automatically published (vs saved as drafts)
  - `last_run_at` - Timestamp of last successful processing run
  - `posts_generated` - Running count of total posts generated from this feed
  - `created_at` / `updated_at` - Timestamps

  ### rss_processed_items
  Tracks which RSS feed items have already been processed to avoid duplicates.
  - `id` - Primary key
  - `feed_config_id` - References the feed config
  - `item_guid` - Unique identifier from the RSS feed item (GUID or link)
  - `item_url` - Original article URL
  - `item_title` - Original article title
  - `processed_at` - When this item was processed
  - `blog_post_id` - References the generated blog post (nullable)

  ## Security
  - RLS enabled on both tables
  - Users can only access their own feed configs and processed items
*/

CREATE TABLE IF NOT EXISTS rss_feed_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_name text NOT NULL DEFAULT '',
  feed_url text NOT NULL,
  interval_hours integer NOT NULL DEFAULT 24,
  is_active boolean NOT NULL DEFAULT true,
  auto_publish boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  posts_generated integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_interval CHECK (interval_hours IN (6, 12, 24))
);

CREATE TABLE IF NOT EXISTS rss_processed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_config_id uuid NOT NULL REFERENCES rss_feed_configs(id) ON DELETE CASCADE,
  item_guid text NOT NULL,
  item_url text,
  item_title text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  blog_post_id uuid REFERENCES blog_posts(id) ON DELETE SET NULL,
  UNIQUE(feed_config_id, item_guid)
);

CREATE INDEX IF NOT EXISTS idx_rss_feed_configs_user_id ON rss_feed_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_rss_feed_configs_is_active ON rss_feed_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_rss_processed_items_feed_config_id ON rss_processed_items(feed_config_id);

ALTER TABLE rss_feed_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_processed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feed configs"
  ON rss_feed_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feed configs"
  ON rss_feed_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feed configs"
  ON rss_feed_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own feed configs"
  ON rss_feed_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own processed items"
  ON rss_processed_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rss_feed_configs
      WHERE rss_feed_configs.id = rss_processed_items.feed_config_id
      AND rss_feed_configs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own processed items"
  ON rss_processed_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rss_feed_configs
      WHERE rss_feed_configs.id = rss_processed_items.feed_config_id
      AND rss_feed_configs.user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_rss_feed_configs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_rss_feed_configs_updated_at
  BEFORE UPDATE ON rss_feed_configs
  FOR EACH ROW EXECUTE FUNCTION update_rss_feed_configs_updated_at();
