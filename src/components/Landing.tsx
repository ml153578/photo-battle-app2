import { useState } from 'react';
import { Camera } from 'lucide-react';

interface LandingProps {
  onCreateLobby: (nickname: string, topic: string) => void;
  onJoinLobby: (nickname: string, code: string) => void;
}

export const Landing = ({ onCreateLobby, onJoinLobby }: LandingProps) => {
  const [nickname, setNickname] = useState('');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [topic, setTopic] = useState('');
  const [error, setError] = useState('');

  const handleShowCreateTopic = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    setError('');
    setShowCreateTopic(true);
  };

  const handleCreateLobby = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }
    setError('');
    onCreateLobby(nickname.trim(), topic.trim());
  };

  const handleJoinLobby = () => {
    if (!nickname.trim()) {
      setError('Please enter a nickname');
      return;
    }
    if (!roomCode.trim() || roomCode.length !== 4) {
      setError('Please enter a 4-digit room code');
      return;
    }
    setError('');
    onJoinLobby(nickname.trim(), roomCode.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">PhotoBattle Royale</h1>
          <p className="text-gray-400">Snap. Submit. Get Roasted.</p>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
          <div className="mb-6">
            <label htmlFor="nickname" className="block text-sm font-medium text-gray-300 mb-2">
              Enter Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {showCreateTopic && (
            <div className="mb-6">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
                Photo Challenge Topic
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Something Blue, Weirdest Shadow"
                maxLength={50}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {showJoinCode && (
            <div className="mb-6">
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-2">
                Room Code
              </label>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {!showJoinCode && !showCreateTopic ? (
              <>
                <button
                  onClick={handleShowCreateTopic}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Lobby
                </button>
                <button
                  onClick={() => setShowJoinCode(true)}
                  className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join Lobby
                </button>
              </>
            ) : showCreateTopic ? (
              <>
                <button
                  onClick={handleCreateLobby}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Lobby & Continue
                </button>
                <button
                  onClick={() => {
                    setShowCreateTopic(false);
                    setTopic('');
                    setError('');
                  }}
                  className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleJoinLobby}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Join Game
                </button>
                <button
                  onClick={() => {
                    setShowJoinCode(false);
                    setRoomCode('');
                    setError('');
                  }}
                  className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Invite friends to join the same lobby and battle it out!
          </p>
        </div>
      </div>
    </div>
  );
};
