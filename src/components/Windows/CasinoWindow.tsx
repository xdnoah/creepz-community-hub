import { useState } from 'react';
import { Window } from './Window';
import { useCasino } from '../../hooks/useCasino';
import { useLizard } from '../../hooks/useLizard';
import { useAuth } from '../../contexts/AuthContext';
import type { WindowState } from '../../types';

export function CasinoWindow({ window }: { window: WindowState }) {
  const { user } = useAuth();
  const { lizard } = useLizard();
  const { loading, playDice, playPlinko, openMysteryBox } = useCasino(user?.id);

  const [activeTab, setActiveTab] = useState<'dice' | 'plinko' | 'mystery'>('dice');
  const [betAmount, setBetAmount] = useState(100);
  const [dicePrediction, setDicePrediction] = useState(6);
  const [lastResult, setLastResult] = useState<string>('');

  const handleDicePlay = async () => {
    const result = await playDice(betAmount, dicePrediction);
    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else if (result.won) {
      setLastResult(`🎉 WON! Rolled ${result.result}. +${result.payout} gold!`);
    } else {
      setLastResult(`Lost. Rolled ${result.result}. Better luck next time!`);
    }
  };

  const handlePlinkoPlay = async () => {
    const result = await playPlinko(betAmount);
    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else {
      setLastResult(`${result.multiplier}x multiplier! ${result.payout! > betAmount ? 'WON' : 'Lost'} ${result.payout} gold!`);
    }
  };

  const handleMysteryBox = async () => {
    const result = await openMysteryBox(betAmount);
    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else if (result.multiplier! >= 10) {
      setLastResult(`🎰🎰🎰 JACKPOT! ${result.multiplier}x! Won ${result.payout} gold!!!`);
    } else {
      setLastResult(`${result.multiplier}x - ${result.payout} gold`);
    }
  };

  if (!lizard) return null;

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
        {/* Tabs */}
        <div className="flex border-b-2 border-yellow-500">
          {[
            { id: 'dice', label: '🎲 Dice', color: 'from-red-500 to-orange-500' },
            { id: 'plinko', label: '🎯 Plinko', color: 'from-blue-500 to-cyan-500' },
            { id: 'mystery', label: '🎁 Mystery Box', color: 'from-purple-500 to-pink-500' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 font-bold transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} text-white`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Gold Display */}
          <div className="bg-yellow-400 border-4 border-yellow-600 rounded-lg p-4 mb-6 text-center">
            <div className="text-2xl font-black text-gray-900">
              💰 {Math.floor(lizard.gold).toLocaleString()} GOLD
            </div>
          </div>

          {/* Bet Amount */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg mb-6">
            <label className="text-white font-bold mb-2 block">Bet Amount:</label>
            <input
              type="number"
              value={betAmount}
              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 rounded bg-gray-800 text-white font-bold text-xl"
              min="1"
            />
          </div>

          {/* Game-specific content */}
          {activeTab === 'dice' && (
            <div className="space-y-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg">
                <label className="text-white font-bold mb-2 block">Predict Number (1-6):</label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setDicePrediction(num)}
                      className={`py-4 rounded font-bold text-2xl ${
                        dicePrediction === num
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleDicePlay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-xl rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rolling...' : '🎲 Roll Dice (5:1 Payout)'}
              </button>
            </div>
          )}

          {activeTab === 'plinko' && (
            <div className="space-y-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">Multipliers:</div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['100x', '10x', '5x', '2x', '1x', '0.5x', '0.1x'].map((m) => (
                    <div key={m} className="bg-gray-700 py-1 rounded">{m}</div>
                  ))}
                </div>
              </div>
              <button
                onClick={handlePlinkoPlay}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Dropping...' : '🎯 Drop Ball'}
              </button>
            </div>
          )}

          {activeTab === 'mystery' && (
            <div className="space-y-4">
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">Possible Multipliers:</div>
                <div className="space-y-1">
                  <div>0.1x - 50% chance</div>
                  <div>0.5x - 25% chance</div>
                  <div>1x - 15% chance</div>
                  <div>2x - 5% chance</div>
                  <div>5x - 3% chance</div>
                  <div>10x - 1.5% chance</div>
                  <div className="text-yellow-400 font-bold">100x - 0.4% chance!!!</div>
                  <div className="text-yellow-400 font-bold">1000x - 0.1% chance!!!!</div>
                </div>
              </div>
              <button
                onClick={handleMysteryBox}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl rounded-lg shadow-lg animate-pulse disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Opening...' : '🎁 Open Mystery Box'}
              </button>
            </div>
          )}

          {/* Result */}
          {lastResult && (
            <div className="mt-6 bg-yellow-400 border-4 border-yellow-600 rounded-lg p-4 text-center font-bold text-gray-900">
              {lastResult}
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}
