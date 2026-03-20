/*
  # Enable RSS Scheduler Extensions

  ## Overview
  Enables pg_cron and pg_net extensions to support background scheduled processing
  of RSS feeds without requiring the dashboard to be open.

  ## Changes
  - Enables `pg_cron` extension for scheduling periodic jobs
  - Enables `pg_net` extension for making HTTP requests from the database
  - Creates `rss_cron_settings` table to store the Supabase project URL and anon key
    needed for the cron job to call the edge function
  - Creates a helper function `trigger_rss_feed_processing(feed_config_id uuid, user_id uuid)`
    that calls the process-rss-feeds edge function via HTTP
  - Creates a scheduled job that runs every hour to process all due active feeds

  ## Important Notes
  1. After applying this migration, you must run the following SQL once to configure
     your project URL and service role key:
     SELECT setup_rss_scheduler('https://YOUR_PROJECT_REF.supabase.co', 'YOUR_ANON_KEY');
  2. The cron job runs hourly and checks which feeds are due based on their interval setting
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS rss_cron_settings (
  id integer PRIMARY KEY DEFAULT 1,
  supabase_url text NOT NULL DEFAULT '',
  anon_key text NOT NULL DEFAULT '',
  is_configured boolean NOT NULL DEFAULT false,
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE rss_cron_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cron settings"
  ON rss_cron_settings FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO rss_cron_settings (id, supabase_url, anon_key, is_configured)
VALUES (1, '', '', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION setup_rss_scheduler(p_supabase_url text, p_anon_key text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE rss_cron_settings
  SET supabase_url = p_supabase_url,
      anon_key = p_anon_key,
      is_configured = true
  WHERE id = 1;
END;
$$;

CREATE OR REPLACE FUNCTION process_due_rss_feeds()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url text;
  v_key text;
  v_configured boolean;
  v_feed record;
BEGIN
  SELECT supabase_url, anon_key, is_configured
  INTO v_url, v_key, v_configured
  FROM rss_cron_settings
  WHERE id = 1;

  IF NOT v_configured OR v_url = '' OR v_key = '' THEN
    RETURN;
  END IF;

  FOR v_feed IN
    SELECT id, user_id
    FROM rss_feed_configs
    WHERE is_active = true
      AND (
        last_run_at IS NULL
        OR last_run_at < now() - (interval_hours || ' hours')::interval
      )
  LOOP
    PERFORM extensions.http_post(
      url := v_url || '/functions/v1/process-rss-feeds',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_key,
        'Content-Type', 'application/json'
      )::text,
      content := jsonb_build_object(
        'feed_config_id', v_feed.id::text,
        'user_id', v_feed.user_id::text
      )::text
    );
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'process-due-rss-feeds',
  '0 * * * *',
  'SELECT process_due_rss_feeds()'
);
