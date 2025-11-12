-- Claude Code Online Platform Database Schema
-- Purpose: Enable users to access fullstack-deploy skill via web interface

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- User Credentials Table
-- Stores encrypted third-party service credentials for each user
-- ============================================================================
CREATE TABLE user_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- GitHub credentials
  github_token TEXT,
  github_username TEXT,

  -- Vercel credentials
  vercel_token TEXT,
  vercel_team_id TEXT,

  -- Supabase credentials
  supabase_url TEXT,
  supabase_anon_key TEXT,
  supabase_project_ref TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one credential set per user
  UNIQUE(user_id)
);

-- Row Level Security
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credentials"
  ON user_credentials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credentials"
  ON user_credentials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credentials"
  ON user_credentials FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Projects Table
-- Stores information about deployed projects
-- ============================================================================
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Project details
  name TEXT NOT NULL,
  description TEXT,
  framework TEXT NOT NULL, -- 'nextjs', 'flask', 'fastapi', 'vue', etc.

  -- URLs
  github_url TEXT,
  vercel_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status options: 'pending', 'in_queue', 'processing', 'deploying', 'success', 'failed'

  error_message TEXT,

  -- Metadata
  features JSONB DEFAULT '[]'::jsonb,
  tech_stack JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Deployment Logs Table
-- Stores detailed execution logs for each deployment phase
-- ============================================================================
CREATE TABLE deployment_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Log details
  phase TEXT NOT NULL, -- 'requirements', 'database', 'development', 'git', 'deployment', 'completion'
  phase_number INTEGER NOT NULL,
  message TEXT NOT NULL,
  log_type TEXT DEFAULT 'info', -- 'info', 'success', 'error', 'warning'

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deployment_logs_project_id ON deployment_logs(project_id);
CREATE INDEX idx_deployment_logs_created_at ON deployment_logs(created_at);

-- Row Level Security
ALTER TABLE deployment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deployment logs"
  ON deployment_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployment_logs.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert deployment logs"
  ON deployment_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = deployment_logs.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Task Queue Table
-- Manages deployment task queue with concurrent processing limits
-- ============================================================================
CREATE TABLE task_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Queue details
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status options: 'pending', 'processing', 'completed', 'failed'

  priority INTEGER DEFAULT 0,
  queue_position INTEGER,

  -- Processing details
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_queue_status ON task_queue(status);
CREATE INDEX idx_task_queue_created_at ON task_queue(created_at);
CREATE INDEX idx_task_queue_user_id ON task_queue(user_id);

-- Row Level Security
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON task_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON task_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_task_queue_updated_at
  BEFORE UPDATE ON task_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Conversations Table
-- Stores chat conversations between users and the AI
-- ============================================================================
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

  -- Conversation details
  title TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Messages Table
-- Stores individual messages within conversations
-- ============================================================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Message details
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- ============================================================================
-- User Profiles Table (Extended user information)
-- ============================================================================
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile details
  display_name TEXT,
  avatar_url TEXT,

  -- Usage limits
  daily_request_limit INTEGER DEFAULT 5,
  daily_request_count INTEGER DEFAULT 0,
  last_request_date DATE DEFAULT CURRENT_DATE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to reset daily request count
CREATE OR REPLACE FUNCTION reset_daily_request_count()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET daily_request_count = 0
  WHERE last_request_date < CURRENT_DATE;

  UPDATE user_profiles
  SET last_request_date = CURRENT_DATE
  WHERE last_request_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create new project
CREATE OR REPLACE FUNCTION can_create_project(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_daily_limit INTEGER;
  v_daily_count INTEGER;
  v_last_date DATE;
BEGIN
  -- Get user's current usage
  SELECT daily_request_limit, daily_request_count, last_request_date
  INTO v_daily_limit, v_daily_count, v_last_date
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Reset count if it's a new day
  IF v_last_date < CURRENT_DATE THEN
    UPDATE user_profiles
    SET daily_request_count = 0, last_request_date = CURRENT_DATE
    WHERE user_id = p_user_id;
    v_daily_count := 0;
  END IF;

  -- Check if under limit
  RETURN v_daily_count < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment request count
CREATE OR REPLACE FUNCTION increment_request_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Reset count if it's a new day
  UPDATE user_profiles
  SET daily_request_count = 0, last_request_date = CURRENT_DATE
  WHERE user_id = p_user_id AND last_request_date < CURRENT_DATE;

  -- Increment count
  UPDATE user_profiles
  SET daily_request_count = daily_request_count + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update queue positions
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS void AS $$
BEGIN
  WITH ranked_tasks AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY priority DESC, created_at ASC) as new_position
    FROM task_queue
    WHERE status = 'pending'
  )
  UPDATE task_queue
  SET queue_position = ranked_tasks.new_position
  FROM ranked_tasks
  WHERE task_queue.id = ranked_tasks.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Note: Sample data should only be inserted in development environment
-- Uncomment the following lines if you want to test with sample data

/*
-- Insert sample user (requires auth.users to exist first)
INSERT INTO user_credentials (user_id, github_token, vercel_token, supabase_url, supabase_anon_key)
VALUES (
  'your-test-user-uuid-here',
  'ghp_test_token',
  'vercel_test_token',
  'https://test.supabase.co',
  'test_anon_key'
);
*/
