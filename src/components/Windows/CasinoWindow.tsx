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

  // Animation states
  const [diceRolling, setDiceRolling] = useState(false);
  const [currentDice, setCurrentDice] = useState(6);
  const [ballDropping, setBallDropping] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 0 });

  const handleDicePlay = async () => {
    if (loading || diceRolling) return;

    setDiceRolling(true);
    setLastResult('');

    // Animate dice rolling
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setCurrentDice(Math.floor(Math.random() * 6) + 1);
      rollCount++;
      if (rollCount >= 10) {
        clearInterval(rollInterval);
      }
    }, 100);

    const result = await playDice(betAmount, dicePrediction);

    setTimeout(() => {
      setDiceRolling(false);
      if (result.error) {
        setLastResult(`❌ ${result.error}`);
        setCurrentDice(dicePrediction);
      } else {
        setCurrentDice(result.result!);
        if (result.won) {
          setLastResult(`🎉 WINNER! Rolled ${result.result}! Won ${result.payout} gold!`);
        } else {
          setLastResult(`Rolled ${result.result}. Lost ${betAmount} gold. Try again!`);
        }
      }
    }, 1200);
  };

  const handlePlinkoPlay = async () => {
    if (loading || ballDropping) return;

    setBallDropping(true);
    setLastResult('');
    setBallPosition({ x: 50, y: 0 });

    // Animate ball dropping with random horizontal movement
    let y = 0;
    let x = 50;
    const dropInterval = setInterval(() => {
      y += 5;
      x += (Math.random() - 0.5) * 10;
      x = Math.max(0, Math.min(100, x)); // Keep within bounds
      setBallPosition({ x, y });

      if (y >= 100) {
        clearInterval(dropInterval);
      }
    }, 50);

    const result = await playPlinko(betAmount);

    setTimeout(() => {
      setBallDropping(false);
      if (result.error) {
        setLastResult(`❌ ${result.error}`);
      } else {
        const multiplierText = `${result.multiplier}x`;
        if (result.payout! >= betAmount * 5) {
          setLastResult(`🎰 JACKPOT! ${multiplierText} multiplier! Won ${result.payout} gold!!!`);
        } else if (result.payout! > betAmount) {
          setLastResult(`✨ ${multiplierText} - Won ${result.payout} gold!`);
        } else {
          setLastResult(`${multiplierText} - Lost ${betAmount - result.payout!} gold`);
        }
      }
    }, 1500);
  };

  const handleMysteryBox = async () => {
    if (loading) return;

    setLastResult('Opening...');
    const result = await openMysteryBox(betAmount);

    if (result.error) {
      setLastResult(`❌ ${result.error}`);
    } else if (result.multiplier! >= 100) {
      setLastResult(`🎰🎰🎰 MEGA JACKPOT! ${result.multiplier}x! Won ${result.payout} gold!!!!`);
    } else if (result.multiplier! >= 10) {
      setLastResult(`🎉 BIG WIN! ${result.multiplier}x! Won ${result.payout} gold!!!`);
    } else if (result.multiplier! >= 1) {
      setLastResult(`${result.multiplier}x - Won ${result.payout} gold!`);
    } else {
      setLastResult(`${result.multiplier}x - Lost ${betAmount - result.payout!} gold`);
    }
  };

  if (!lizard) return null;

  const getDiceEmoji = (num: number) => {
    const dice = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return dice[num - 1] || '⚅';
  };

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
              onClick={() => {
                setActiveTab(tab.id as any);
                setLastResult('');
              }}
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
              disabled={loading || diceRolling || ballDropping}
            />
          </div>

          {/* Game-specific content */}
          {activeTab === 'dice' && (
            <div className="space-y-4">
              {/* Animated Dice Display */}
              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-8 rounded-lg text-center">
                <div className="text-9xl mb-4 transition-transform duration-100" style={{
                  transform: diceRolling ? 'rotate(360deg)' : 'rotate(0deg)',
                  transition: diceRolling ? 'transform 0.1s linear' : 'transform 0.3s ease'
                }}>
                  {getDiceEmoji(currentDice)}
                </div>
                <div className="text-white text-sm">
                  {diceRolling ? 'Rolling...' : `Current: ${currentDice}`}
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg">
                <label className="text-white font-bold mb-2 block">Predict Number (1-6):</label>
                <div className="grid grid-cols-6 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      onClick={() => setDicePrediction(num)}
                      disabled={diceRolling}
                      className={`py-4 rounded font-bold text-2xl transition-all ${
                        dicePrediction === num
                          ? 'bg-yellow-500 text-gray-900 scale-110'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      } ${diceRolling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleDicePlay}
                disabled={loading || diceRolling}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold text-xl rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {diceRolling ? '🎲 Rolling...' : '🎲 Roll Dice (Win 5x!)'}
              </button>
            </div>
          )}

          {activeTab === 'plinko' && (
            <div className="space-y-4">
              {/* Plinko Board */}
              <div className="relative bg-gradient-to-b from-blue-900 to-purple-900 rounded-lg p-4 border-4 border-blue-500" style={{ height: '300px' }}>
                <div className="text-white text-sm font-bold mb-2 text-center">Drop Zone</div>

                {/* Pegs */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(5)].map((_, row) => (
                    <div key={row} className="flex justify-center gap-12" style={{ marginTop: `${row * 50 + 30}px` }}>
                      {[...Array(7 - row)].map((__, col) => (
                        <div key={col} className="w-3 h-3 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Ball */}
                {ballDropping && (
                  <div
                    className="absolute w-6 h-6 bg-red-500 rounded-full border-2 border-red-700 shadow-lg transition-all duration-75"
                    style={{
                      left: `${ballPosition.x}%`,
                      top: `${ballPosition.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                )}

                {/* Multiplier Slots at Bottom */}
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {['100x', '10x', '5x', '2x', '1x', '0.5x', '0.1x'].map((m) => (
                    <div key={m} className="text-xs px-2 py-1 bg-gray-700 text-white rounded font-bold">
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">Multipliers:</div>
                <div className="space-y-1">
                  <div>100x - 0.1% chance 🎰</div>
                  <div>10x - 1% chance</div>
                  <div>5x - 10% chance</div>
                  <div>2x - 30% chance</div>
                  <div>1x - 30% chance (break even)</div>
                  <div>0.5x - 20% chance</div>
                  <div>0.1x - 8.9% chance</div>
                </div>
              </div>
              <button
                onClick={handlePlinkoPlay}
                disabled={loading || ballDropping}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold text-xl rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {ballDropping ? '🎯 Dropping...' : '🎯 Drop Ball'}
              </button>
            </div>
          )}

          {activeTab === 'mystery' && (
            <div className="space-y-4">
              {/* Mystery Box Visual */}
              <div className="flex items-center justify-center py-12">
                <div className={`text-9xl ${loading ? 'animate-bounce' : ''}`}>
                  🎁
                </div>
              </div>

              <div className="bg-white bg-opacity-10 backdrop-blur-sm p-4 rounded-lg text-white text-sm">
                <div className="font-bold mb-2">Possible Multipliers:</div>
                <div className="space-y-1">
                  <div className="text-yellow-300 font-bold">1000x - 0.1% chance!!!! 💎</div>
                  <div className="text-yellow-400 font-bold">100x - 0.4% chance!!!</div>
                  <div>10x - 1.5% chance</div>
                  <div>5x - 3% chance</div>
                  <div>2x - 5% chance</div>
                  <div>1x - 15% chance (break even)</div>
                  <div>0.5x - 25% chance</div>
                  <div>0.1x - 50% chance</div>
                </div>
              </div>
              <button
                onClick={handleMysteryBox}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xl rounded-lg shadow-lg animate-pulse disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? '🎁 Opening...' : '🎁 Open Mystery Box'}
              </button>
            </div>
          )}

          {/* Result */}
          {lastResult && (
            <div className={`mt-6 border-4 rounded-lg p-4 text-center font-bold ${
              lastResult.includes('❌') || lastResult.includes('Lost')
                ? 'bg-red-400 border-red-600 text-gray-900'
                : lastResult.includes('JACKPOT') || lastResult.includes('MEGA') || lastResult.includes('WINNER')
                ? 'bg-yellow-300 border-yellow-600 text-gray-900 animate-pulse'
                : 'bg-blue-400 border-blue-600 text-gray-900'
            }`}>
              {lastResult}
            </div>
          )}
        </div>
      </div>
    </Window>
  );
}
