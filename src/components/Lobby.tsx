import { useEffect, useState } from 'react';
import { Users, Copy, Check, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  nickname: string;
  is_host: boolean;
}

interface LobbyProps {
  lobbyId: string;
  lobbyCode: string;
  playerId: string;
  isHost: boolean;
  onStartGame: () => void;
}

export const Lobby = ({ lobbyId, lobbyCode, playerId, isHost, onStartGame }: LobbyProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('players')
        .select('id, nickname, is_host')
        .eq('lobby_id', lobbyId)
        .order('joined_at', { ascending: true });

      if (data) {
        setPlayers(data);
      }
    };

    fetchPlayers();

    const channel = supabase
      .channel(`lobby:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `lobby_id=eq.${lobbyId}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [lobbyId]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    if (players.length < 2) {
      alert('You need at least 2 players to start the game!');
      return;
    }
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Waiting Room</h1>
          <p className="text-gray-400">Share the room code with friends</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700 mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6">
            <p className="text-sm text-blue-100 mb-2">Room Code</p>
            <div className="flex items-center justify-between">
              <span className="text-5xl font-bold text-white tracking-wider">{lobbyCode}</span>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <Copy className="w-6 h-6 text-white" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Players ({players.length})</h3>
              {isHost && players.length >= 2 && (
                <span className="text-xs text-green-400">Ready to start!</span>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === playerId
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      player.is_host ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-600'
                    }`}>
                      {player.is_host ? (
                        <Crown className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white">{player.nickname[0].toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{player.nickname}</p>
                      {player.is_host && (
                        <p className="text-xs text-yellow-400">Host</p>
                      )}
                      {player.id === playerId && (
                        <p className="text-xs text-blue-400">You</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={players.length < 2}
            className={`w-full py-4 font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
              players.length >= 2
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {players.length < 2 ? 'Waiting for players...' : 'Start Game'}
          </button>
        )}

        {!isHost && (
          <div className="text-center">
            <p className="text-gray-400 text-sm">Waiting for host to start the game...</p>
          </div>
        )}
      </div>
    </div>
  );
};
