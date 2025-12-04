import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface TopicRevealProps {
  topic: string;
  onContinue: () => void;
}

export const TopicReveal = ({ topic, onContinue }: TopicRevealProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 300);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div
          className={`transform transition-all duration-700 ${
            show ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-semibold text-purple-300 mb-4">Your Challenge</h2>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <h1 className="text-5xl font-bold text-white mb-2">{topic}</h1>
          </div>

          <p className="text-xl text-gray-300 mb-8">
            Get creative! You have one shot to impress the AI judge.
          </p>

          <button
            onClick={onContinue}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            Open Camera
          </button>
        </div>
      </div>
    </div>
  );
};
