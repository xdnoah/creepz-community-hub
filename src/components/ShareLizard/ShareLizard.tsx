import { useRef, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Lizard } from '../../types';

interface ShareLizardProps {
  lizard: Lizard;
  onClose: () => void;
}

interface FightStats {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export function ShareLizard({ lizard, onClose }: ShareLizardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fightStats, setFightStats] = useState<FightStats>({ wins: 0, losses: 0, total: 0, winRate: 0 });
  const [loading, setLoading] = useState(true);

  // Fetch fight statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: fights, error } = await supabase
          .from('fight_history')
          .select('*')
          .or(`attacker_id.eq.${lizard.id},defender_id.eq.${lizard.id}`);

        if (!error && fights) {
          const wins = fights.filter((f) => f.winner_id === lizard.id).length;
          const losses = fights.filter((f) => f.winner_id !== lizard.id).length;
          const total = fights.length;
          const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

          setFightStats({ wins, losses, total, winRate });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching fight stats:', err);
        setLoading(false);
      }
    };

    fetchStats();
  }, [lizard.id]);

  // Generate the lizard card image
  useEffect(() => {
    if (loading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Color mapping
    const colorMap: Record<string, string> = {
      green: '#10b981',
      red: '#ef4444',
      blue: '#3b82f6',
      purple: '#a855f7',
      gold: '#eab308',
      pink: '#ec4899',
      cyan: '#06b6d4',
      orange: '#f97316',
      indigo: '#6366f1',
    };

    const lizardColor = colorMap[lizard.color] || '#10b981';

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Border
    ctx.strokeStyle = lizardColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 760, 560);

    // Title background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(40, 40, 720, 80);

    // Lizard name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(lizard.name, 400, 95);

    // Rank tier
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = lizardColor;
    ctx.fillText(`${lizard.rank_tier.toUpperCase()} • Lv.${lizard.level}`, 400, 130);

    // Large lizard emoji
    ctx.font = '150px Arial';
    ctx.fillText('🦎', 200, 300);

    // Stats section background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(340, 160, 420, 360);

    // Stats header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('⚔️ Battle Stats', 360, 200);

    // Win/Loss record
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Wins: ${fightStats.wins}`, 360, 250);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`Losses: ${fightStats.losses}`, 360, 290);

    ctx.fillStyle = '#eab308';
    ctx.fillText(`Win Rate: ${fightStats.winRate}%`, 360, 330);

    ctx.fillStyle = '#a855f7';
    ctx.fillText(`Rank Points: ${lizard.rank_points}`, 360, 370);

    // Combat stats header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('📊 Combat Stats', 360, 420);

    // Combat stats
    ctx.font = '22px Arial';
    const stats = [
      { label: 'HP', value: Math.floor(lizard.hp), color: '#ef4444' },
      { label: 'ATK', value: Math.floor(lizard.atk), color: '#f97316' },
      { label: 'DEF', value: Math.floor(lizard.def), color: '#3b82f6' },
      { label: 'Crit Rate', value: `${lizard.crit_rate.toFixed(1)}%`, color: '#eab308' },
    ];

    stats.forEach((stat, index) => {
      ctx.fillStyle = stat.color;
      ctx.fillText(`${stat.label}: ${stat.value}`, 360, 460 + index * 30);
    });

    // Footer
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(40, 540, 720, 40);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Creepz Community Hub • Lizard Card', 400, 567);

  }, [lizard, fightStats, loading]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `${lizard.name.replace(/\s+/g, '_')}_card.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Share Your Lizard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-600">Loading stats...</div>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <canvas
                ref={canvasRef}
                className="border-4 border-gray-300 rounded-lg shadow-lg max-w-full h-auto"
                style={{ maxHeight: '450px' }}
              />
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <span>💾</span> Download Card
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg shadow-md transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
