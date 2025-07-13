/*
  # Initial Schema for Decentralized Crowdfunding Platform

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `wallet_address` (text, nullable)
      - `username` (text, nullable)
      - `avatar_url` (text, nullable)
      - `is_verified` (boolean, default false)
      - `referral_code` (text, unique)
      - `referred_by` (text, nullable, references referral_code)
      - `total_donated` (numeric, default 0)
      - `total_raised` (numeric, default 0)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `campaigns`
      - `id` (uuid, primary key)
      - `creator_id` (uuid, references profiles.id)
      - `title` (text)
      - `description` (text)
      - `funding_goal` (numeric)
      - `current_funding` (numeric, default 0)
      - `deadline` (timestamptz)
      - `category` (text)
      - `image_ipfs_hash` (text, nullable)
      - `media_ipfs_hashes` (text array, default empty)
      - `is_active` (boolean, default true)
      - `contract_address` (text, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `milestones`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, references campaigns.id)
      - `title` (text)
      - `description` (text)
      - `funding_amount` (numeric)
      - `is_completed` (boolean, default false)
      - `voting_deadline` (timestamptz)
      - `votes_for` (integer, default 0)
      - `votes_against` (integer, default 0)
      - `total_voters` (integer, default 0)
      - `created_at` (timestamptz, default now())

    - `contributions`
      - `id` (uuid, primary key)
      - `contributor_id` (uuid, references profiles.id)
      - `campaign_id` (uuid, references campaigns.id)
      - `amount` (numeric)
      - `transaction_hash` (text, unique)
      - `referral_code` (text, nullable)
      - `created_at` (timestamptz, default now())

    - `votes`
      - `id` (uuid, primary key)
      - `voter_id` (uuid, references profiles.id)
      - `milestone_id` (uuid, references milestones.id)
      - `vote` (text, check in ('for', 'against'))
      - `transaction_hash` (text, unique)
      - `created_at` (timestamptz, default now())

    - `referral_rewards`
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, references profiles.id)
      - `referred_id` (uuid, references profiles.id)
      - `contribution_id` (uuid, references contributions.id)
      - `reward_amount` (numeric)
      - `reward_type` (text, check in ('token', 'nft'))
      - `transaction_hash` (text, unique)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to campaigns and contributions
    - Add policies for verified users to participate in governance

  3. Functions
    - Function to increment total donated amount
    - Function to increment total raised amount
    - Triggers for updating timestamps
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  wallet_address text,
  username text,
  avatar_url text,
  is_verified boolean DEFAULT false,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  total_donated numeric DEFAULT 0,
  total_raised numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  funding_goal numeric NOT NULL CHECK (funding_goal > 0),
  current_funding numeric DEFAULT 0 CHECK (current_funding >= 0),
  deadline timestamptz NOT NULL,
  category text NOT NULL,
  image_ipfs_hash text,
  media_ipfs_hashes text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  contract_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  funding_amount numeric NOT NULL CHECK (funding_amount > 0),
  is_completed boolean DEFAULT false,
  voting_deadline timestamptz NOT NULL,
  votes_for integer DEFAULT 0 CHECK (votes_for >= 0),
  votes_against integer DEFAULT 0 CHECK (votes_against >= 0),
  total_voters integer DEFAULT 0 CHECK (total_voters >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  transaction_hash text UNIQUE NOT NULL,
  referral_code text,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  milestone_id uuid REFERENCES milestones(id) ON DELETE CASCADE NOT NULL,
  vote text NOT NULL CHECK (vote IN ('for', 'against')),
  transaction_hash text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(voter_id, milestone_id)
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  contribution_id uuid REFERENCES contributions(id) ON DELETE CASCADE NOT NULL,
  reward_amount numeric NOT NULL CHECK (reward_amount > 0),
  reward_type text NOT NULL CHECK (reward_type IN ('token', 'nft')),
  transaction_hash text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Anyone can read campaigns"
  ON campaigns
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create campaigns"
  ON campaigns
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Campaign creators can update their campaigns"
  ON campaigns
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Milestones policies
CREATE POLICY "Anyone can read milestones"
  ON milestones
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Campaign creators can manage milestones"
  ON milestones
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = milestones.campaign_id 
      AND campaigns.creator_id = auth.uid()
    )
  );

-- Contributions policies
CREATE POLICY "Anyone can read contributions"
  ON contributions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create contributions"
  ON contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contributor_id);

-- Votes policies
CREATE POLICY "Anyone can read votes"
  ON votes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Verified users can vote"
  ON votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = voter_id AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_verified = true
    )
  );

-- Referral rewards policies
CREATE POLICY "Users can read their referral rewards"
  ON referral_rewards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can create referral rewards"
  ON referral_rewards
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION increment_total_donated(user_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET total_donated = total_donated + amount,
      updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_total_raised(user_id uuid, amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET total_raised = total_raised + amount,
      updated_at = now()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();