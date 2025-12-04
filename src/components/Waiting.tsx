import { useEffect, useState } from 'react';
import { Clock, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Player {
  id: string;
  nickname: string;
  is_ready: boolean;
}

interface WaitingProps {
  lobbyId: string;
}

export const Waiting = ({ lobbyId }: WaitingProps) => {
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('players')
        .select('id, nickname, is_ready')
        .eq('lobby_id', lobbyId)
        .order('joined_at', { ascending: true });

      if (data) {
        setPlayers(data);
      }
    };

    fetchPlayers();

    const channel = supabase
      .channel(`waiting:${lobbyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
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

  const readyCount = players.filter((p) => p.is_ready).length;
  const totalCount = players.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 animate-pulse">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Photo Submitted!</h1>
          <p className="text-gray-400">Waiting for other players...</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="text-white font-semibold">
                {readyCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(readyCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.is_ready ? 'bg-green-600/20' : 'bg-gray-700'
                }`}
              >
                <span className="text-white font-medium">{player.nickname}</span>
                {player.is_ready ? (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm">Ready</span>
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Taking photo...</span>
                    <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            The AI judge will rank photos once everyone submits
          </p>
        </div>
      </div>
    </div>
  );
};
