import { Trophy, Medal, Award } from 'lucide-react';

interface Ranking {
  nickname: string;
  rank: number;
  score: number;
  funny_critique: string;
  imageUrl: string;
}

interface ResultsProps {
  rankings: Ranking[];
  topic: string;
  isHost: boolean;
  onNextRound: () => void;
}

export const Results = ({ rankings, topic, isHost, onNextRound }: ResultsProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500 to-orange-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-orange-400 to-orange-500';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20">
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-white mb-2">Results</h1>
          <p className="text-gray-400">Topic: {topic}</p>
        </div>

        <div className="space-y-4">
          {rankings.map((ranking) => (
            <div
              key={ranking.nickname}
              className={`bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 transition-all hover:border-gray-600 ${
                ranking.rank === 1 ? 'ring-2 ring-yellow-500/50' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-64 h-64 bg-gray-900 flex-shrink-0">
                  <img
                    src={ranking.imageUrl}
                    alt={ranking.nickname}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute top-4 left-4 bg-gradient-to-r ${getRankColor(
                      ranking.rank
                    )} rounded-full w-12 h-12 flex items-center justify-center font-bold text-white text-xl shadow-lg`}
                  >
                    {ranking.rank <= 3 ? (
                      <div className="flex items-center justify-center">
                        {getRankIcon(ranking.rank)}
                      </div>
                    ) : (
                      ranking.rank
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          {ranking.nickname}
                        </h3>
                        <p className="text-sm text-gray-400">Rank #{ranking.rank}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">{ranking.score}</div>
                        <div className="text-sm text-gray-400">points</div>
                      </div>
                    </div>

                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">AI Judge Says:</p>
                      <p className="text-white leading-relaxed">{ranking.funny_critique}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isHost && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              <button
                onClick={onNextRound}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Next Round
              </button>
            </div>
          </div>
        )}

        {!isHost && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-gray-400">Waiting for host to start next round...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
