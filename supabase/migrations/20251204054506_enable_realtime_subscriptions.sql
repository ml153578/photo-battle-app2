/*
  # Enable Realtime Subscriptions for PhotoBattle
  
  ## Changes
  Enables Realtime functionality for all game tables so players can see updates in real-time.
  
  1. Enable Realtime on tables:
    - `lobbies` - So all players see lobby status changes (waiting -> topic_reveal -> capturing, etc.)
    - `players` - So all players see when new players join or when players update their ready status
    - `rounds` - So all players see round results when they're completed
  
  ## Why This Is Needed
  Without this, the Supabase Realtime subscriptions won't work, and players won't see 
  live updates when other players join or when the game state changes.
*/

-- Enable realtime for lobbies table
ALTER PUBLICATION supabase_realtime ADD TABLE lobbies;

-- Enable realtime for players table  
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- Enable realtime for rounds table
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;