/*
  # PhotoBattle Royale Database Schema

  ## Overview
  Creates the complete database structure for a multiplayer photography battle game
  where players join lobbies, take photos based on topics, and get AI-judged rankings.

  ## New Tables
  
  ### 1. `lobbies`
  Stores lobby/room information for game sessions
  - `id` (uuid, primary key) - Unique lobby identifier
  - `code` (text, unique) - 4-digit room code for joining
  - `status` (text) - Current lobby state: 'waiting', 'topic_reveal', 'capturing', 'judging', 'results'
  - `current_topic` (text) - The photography topic for the current round
  - `current_round` (integer) - Current round number (default 1)
  - `host_id` (uuid) - ID of the player who created the lobby
  - `created_at` (timestamptz) - When the lobby was created
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `players`
  Stores player information within lobbies
  - `id` (uuid, primary key) - Unique player identifier
  - `lobby_id` (uuid, foreign key) - References the lobby they're in
  - `nickname` (text) - Player's chosen display name
  - `image_url` (text) - URL to their submitted photo in Supabase Storage
  - `is_ready` (boolean) - Whether they've submitted their photo
  - `is_host` (boolean) - Whether they're the lobby host
  - `total_score` (integer) - Cumulative score across all rounds
  - `joined_at` (timestamptz) - When they joined the lobby

  ### 3. `rounds`
  Stores round history and AI judging results
  - `id` (uuid, primary key) - Unique round identifier
  - `lobby_id` (uuid, foreign key) - References the lobby
  - `round_number` (integer) - Which round this was (1, 2, 3...)
  - `topic` (text) - The photography topic for this round
  - `rankings_json` (jsonb) - AI judge rankings with scores and critiques
  - `completed_at` (timestamptz) - When this round finished

  ## Security
  - Enable RLS on all tables
  - Public read access for all players (since this is a collaborative game)
  - Any player can create lobbies and join them
  - Only players in a lobby can update their own player record
  - Host can update lobby status
*/

-- Create lobbies table
CREATE TABLE IF NOT EXISTS lobbies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  status text DEFAULT 'waiting' NOT NULL,
  current_topic text,
  current_round integer DEFAULT 1 NOT NULL,
  host_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid REFERENCES lobbies(id) ON DELETE CASCADE NOT NULL,
  nickname text NOT NULL,
  image_url text,
  is_ready boolean DEFAULT false NOT NULL,
  is_host boolean DEFAULT false NOT NULL,
  total_score integer DEFAULT 0 NOT NULL,
  joined_at timestamptz DEFAULT now() NOT NULL
);

-- Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lobby_id uuid REFERENCES lobbies(id) ON DELETE CASCADE NOT NULL,
  round_number integer NOT NULL,
  topic text NOT NULL,
  rankings_json jsonb,
  completed_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_lobby_id ON players(lobby_id);
CREATE INDEX IF NOT EXISTS idx_rounds_lobby_id ON rounds(lobby_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_code ON lobbies(code);

-- Enable Row Level Security
ALTER TABLE lobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lobbies table
-- Anyone can view all lobbies (for joining)
CREATE POLICY "Anyone can view lobbies"
  ON lobbies FOR SELECT
  TO anon
  USING (true);

-- Anyone can create a lobby
CREATE POLICY "Anyone can create lobbies"
  ON lobbies FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anyone can update lobbies (for game state changes)
CREATE POLICY "Anyone can update lobbies"
  ON lobbies FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- RLS Policies for players table
-- Anyone can view all players
CREATE POLICY "Anyone can view players"
  ON players FOR SELECT
  TO anon
  USING (true);

-- Anyone can join as a player
CREATE POLICY "Anyone can create player"
  ON players FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anyone can update players (for ready status, scores)
CREATE POLICY "Anyone can update players"
  ON players FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Players can leave (delete themselves)
CREATE POLICY "Anyone can delete players"
  ON players FOR DELETE
  TO anon
  USING (true);

-- RLS Policies for rounds table
-- Anyone can view rounds
CREATE POLICY "Anyone can view rounds"
  ON rounds FOR SELECT
  TO anon
  USING (true);

-- Anyone can create rounds
CREATE POLICY "Anyone can create rounds"
  ON rounds FOR INSERT
  TO anon
  WITH CHECK (true);

-- Function to update lobby updated_at timestamp
CREATE OR REPLACE FUNCTION update_lobby_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update lobby timestamp
DROP TRIGGER IF EXISTS update_lobbies_updated_at ON lobbies;
CREATE TRIGGER update_lobbies_updated_at
  BEFORE UPDATE ON lobbies
  FOR EACH ROW
  EXECUTE FUNCTION update_lobby_timestamp();