-- Test Data Seed for FPL Optimizer
-- Run this in your Supabase SQL Editor to create test users

-- Create test users with different subscription tiers

-- Free Tier Test User
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'free@fploptimizer.test',
  '{"name": "Free User", "tier": "free"}',
  NOW(),
  NOW()
);

-- Pro Tier Test User
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'pro@fploptimizer.test',
  '{"name": "Pro User", "tier": "pro"}',
  NOW(),
  NOW()
);

-- Elite Tier Test User
INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'elite@fploptimizer.test',
  '{"name": "Elite User", "tier": "elite"}',
  NOW(),
  NOW()
);

-- Create profiles for test users
INSERT INTO public.profiles (id, email, name, tier, optimizations_used, optimizations_limit, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'free@fploptimizer.test', 'Free User', 'free', 0, 1, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'pro@fploptimizer.test', 'Pro User', 'pro', 0, NULL, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'elite@fploptimizer.test', 'Elite User', 'elite', 0, NULL, NOW(), NOW());

-- Note: Set passwords via Supabase Auth Admin or use these with email provider
-- For testing, you can use the "Sign In with Google" option or create password reset flows
