import { useState, useEffect } from 'react';

import { supabase } from './lib/supabase';
import { generateRoomCode, getRandomTopic, compressImage } from './lib/utils';
import { Landing } from './components/Landing';
import { Lobby } from './components/Lobby';
import { TopicReveal } from './components/TopicReveal';
import { CameraCapture } from './components/CameraCapture';
import { Waiting } from './components/Waiting';
import { Results } from './components/Results';

type GameState =
  | 'landing'
  | 'lobby'
  | 'topic_reveal'
  | 'capturing'
  | 'waiting'
  | 'judging'
  | 'results';

interface Ranking {
  nickname: string;
  rank: number;
  score: number;
  funny_critique: string;
  imageUrl: string;
}

function App() {
  const [gameState, setGameState] = useState<GameState>('landing');
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<string | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lobbyId) return;

    console.log('🔌 Setting up realtime subscription for lobby:', lobbyId);

    const channel = supabase
      .channel(`lobby-state:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lobbies',
          filter: `id=eq.${lobbyId}`,
        },
        async (payload) => {
          console.log('🔔 Realtime event received:', payload);
          const newStatus = payload.new.status;
          const newTopic = payload.new.current_topic;

          console.log('Lobby status changed:', { newStatus, isHost, playerId });

          if (newStatus === 'topic_reveal' && newTopic) {
            setCurrentTopic(newTopic);
            setGameState('topic_reveal');
          } else if (newStatus === 'judging') {
            console.log('Status is judging. isHost?', isHost);
            setGameState('judging');
            if (isHost) {
              console.log('Host is triggering judging...');
              await triggerJudging();
            } else {
              console.log('Not host, skipping judging trigger');
            }
          } else if (newStatus === 'results') {
            await fetchResults();
            setGameState('results');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [lobbyId, isHost]);

  useEffect(() => {
    if (!lobbyId || !playerId || gameState !== 'waiting') return;

    const checkAllReady = async () => {
      const { data: players } = await supabase
        .from('players')
        .select('is_ready')
        .eq('lobby_id', lobbyId);

      console.log('⏰ Checking if all ready:', {
        players,
        allReady: players && players.length > 0 && players.every((p) => p.is_ready)
      });

      if (players && players.length > 0 && players.every((p) => p.is_ready)) {
        console.log('✅ All players ready! Updating lobby status to judging...');
        const { error } = await supabase
          .from('lobbies')
          .update({ status: 'judging' })
          .eq('id', lobbyId);

        if (error) {
          console.error('❌ Error updating lobby status:', error);
        } else {
          console.log('✅ Lobby status updated to judging');
        }
      }
    };

    const interval = setInterval(checkAllReady, 2000);

    return () => clearInterval(interval);
  }, [lobbyId, playerId, gameState]);

  const handleCreateLobby = async (nickname: string, topic: string) => {
    try {
      const code = generateRoomCode();

      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .insert({ code, status: 'waiting', current_topic: topic })
        .select()
        .single();

      if (lobbyError) throw lobbyError;

      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          lobby_id: lobby.id,
          nickname,
          is_host: true,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      await supabase
        .from('lobbies')
        .update({ host_id: player.id })
        .eq('id', lobby.id);

      setLobbyId(lobby.id);
      setLobbyCode(code);
      setPlayerId(player.id);
      setIsHost(true);
      setGameState('lobby');
    } catch (err: any) {
      console.error('Error creating lobby:', err);
      setError(err.message);
    }
  };

  const handleJoinLobby = async (nickname: string, code: string) => {
    try {
      const { data: lobby, error: lobbyError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', code)
        .single();

      if (lobbyError || !lobby) {
        setError('Invalid room code');
        return;
      }

      if (lobby.status !== 'waiting') {
        setError('Game already in progress');
        return;
      }

      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({
          lobby_id: lobby.id,
          nickname,
          is_host: false,
        })
        .select()
        .single();

      if (playerError) throw playerError;

      setLobbyId(lobby.id);
      setLobbyCode(code);
      setPlayerId(player.id);
      setIsHost(false);
      setGameState('lobby');
    } catch (err: any) {
      console.error('Error joining lobby:', err);
      setError(err.message);
    }
  };

  const handleStartGame = async () => {
    if (!lobbyId) return;

    try {
      await supabase
        .from('lobbies')
        .update({
          status: 'topic_reveal',
        })
        .eq('id', lobbyId);
    } catch (err: any) {
      console.error('Error starting game:', err);
      setError(err.message);
    }
  };

  const handleContinueToCamera = () => {
    setGameState('capturing');
  };

  const handlePhotoCapture = async (imageBlob: Blob) => {
    if (!lobbyId || !playerId) return;

    try {
      const compressedBlob = await compressImage(imageBlob, 500);

      const fileName = `${lobbyId}/${playerId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName);

      await supabase
        .from('players')
        .update({
          image_url: publicUrl,
          is_ready: true,
        })
        .eq('id', playerId);

      setGameState('waiting');
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      setError(err.message);
    }
  };

  const triggerJudging = async () => {
    if (!lobbyId || !currentTopic) return;

    try {
      console.log('Starting judging process...');

      const { data: players } = await supabase
        .from('players')
        .select('nickname, image_url')
        .eq('lobby_id', lobbyId)
        .not('image_url', 'is', null);

      console.log('Players with photos:', players);

      if (!players || players.length === 0) {
        console.error('No players with photos found');
        return;
      }

      const submissions = players.map((p) => ({
        nickname: p.nickname,
        imageUrl: p.image_url!,
      }));

      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('Gemini API Key available:', !!geminiApiKey);
      console.log('Calling edge function with submissions:', submissions);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/judge-photos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            topic: currentTopic,
            submissions,
            geminiApiKey,
          }),
        }
      );

      console.log('Edge function response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Edge function error:', errorData);
        throw new Error(`Failed to judge photos: ${errorData}`);
      }

      const responseData = await response.json();
      console.log('Edge function response data:', responseData);

      const { rankings: judgedRankings } = responseData;

      const rankingsWithImages = judgedRankings.map((r: any) => {
        const player = players.find((p) => p.nickname === r.nickname);
        return {
          ...r,
          imageUrl: player?.image_url || '',
        };
      });

      const { data: lobby } = await supabase
        .from('lobbies')
        .select('current_round')
        .eq('id', lobbyId)
        .single();

      await supabase.from('rounds').insert({
        lobby_id: lobbyId,
        round_number: lobby?.current_round || 1,
        topic: currentTopic,
        rankings_json: rankingsWithImages,
      });

      for (const ranking of judgedRankings) {
        const player = players.find((p) => p.nickname === ranking.nickname);
        if (player) {
          const { data: currentPlayer } = await supabase
            .from('players')
            .select('total_score')
            .eq('nickname', ranking.nickname)
            .eq('lobby_id', lobbyId)
            .single();

          if (currentPlayer) {
            await supabase
              .from('players')
              .update({
                total_score: currentPlayer.total_score + ranking.score,
              })
              .eq('nickname', ranking.nickname)
              .eq('lobby_id', lobbyId);
          }
        }
      }

      await supabase
        .from('lobbies')
        .update({ status: 'results' })
        .eq('id', lobbyId);
    } catch (err: any) {
      console.error('Error judging photos:', err);
      setError(err.message);
    }
  };

  const fetchResults = async () => {
    if (!lobbyId) return;

    try {
      const { data: lobby } = await supabase
        .from('lobbies')
        .select('current_round')
        .eq('id', lobbyId)
        .single();

      const { data: round } = await supabase
        .from('rounds')
        .select('rankings_json')
        .eq('lobby_id', lobbyId)
        .eq('round_number', lobby?.current_round || 1)
        .single();

      if (round && round.rankings_json) {
        setRankings(round.rankings_json as Ranking[]);
      }
    } catch (err: any) {
      console.error('Error fetching results:', err);
    }
  };

  const handleNextRound = async () => {
    if (!lobbyId) return;

    try {
      await supabase
        .from('players')
        .update({
          is_ready: false,
          image_url: null,
        })
        .eq('lobby_id', lobbyId);

      const { data: lobby } = await supabase
        .from('lobbies')
        .select('current_round')
        .eq('id', lobbyId)
        .single();

      const newTopic = getRandomTopic();
      await supabase
        .from('lobbies')
        .update({
          status: 'topic_reveal',
          current_topic: newTopic,
          current_round: (lobby?.current_round || 1) + 1,
        })
        .eq('id', lobbyId);
    } catch (err: any) {
      console.error('Error starting next round:', err);
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-6 max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setGameState('landing');
            }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'landing') {
    return <Landing onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} />;
  }

  if (gameState === 'lobby' && lobbyId && lobbyCode && playerId) {
    return (
      <Lobby
        lobbyId={lobbyId}
        lobbyCode={lobbyCode}
        playerId={playerId}
        isHost={isHost}
        onStartGame={handleStartGame}
      />
    );
  }

  if (gameState === 'topic_reveal' && currentTopic) {
    return <TopicReveal topic={currentTopic} onContinue={handleContinueToCamera} />;
  }

  if (gameState === 'capturing' && currentTopic) {
    return (
      <CameraCapture
        topic={currentTopic}
        onCapture={handlePhotoCapture}
        onCancel={() => setGameState('topic_reveal')}
      />
    );
  }

  if (gameState === 'waiting' && lobbyId) {
    return <Waiting lobbyId={lobbyId} />;
  }

  if (gameState === 'judging') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-white mb-2">AI Judge is Thinking...</h2>
          <p className="text-gray-400">Analyzing photos and preparing roasts</p>
        </div>
      </div>
    );
  }

  if (gameState === 'results' && currentTopic) {
    return (
      <Results
        rankings={rankings}
        topic={currentTopic}
        isHost={isHost}
        onNextRound={handleNextRound}
      />
    );
  }

  return null;
}

export default App;
