import { useState } from 'react';
import { Window } from './Window';
import type { WindowState } from '../../types';

interface HowItWorksWindowProps {
  window: WindowState;
}

type Tab = 'overview' | 'lizards' | 'equipment' | 'pvp' | 'changelog';

export function HowItWorksWindow({ window }: HowItWorksWindowProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <Window window={window}>
      <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-purple-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 border-b-2 border-gray-400">
          <div className="text-center text-white">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
              <span>📖</span>
              <span>How It Works</span>
            </h1>
            <p className="text-sm opacity-90 mt-1">Your complete guide to Creepz Hub</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b-2 border-gray-300 flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-3 font-bold text-sm transition-colors border-r border-gray-200 ${
              activeTab === 'overview'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏠 Overview
          </button>
          <button
            onClick={() => setActiveTab('lizards')}
            className={`flex-1 px-4 py-3 font-bold text-sm transition-colors border-r border-gray-200 ${
              activeTab === 'lizards'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🦎 Lizards
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 px-4 py-3 font-bold text-sm transition-colors border-r border-gray-200 ${
              activeTab === 'equipment'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚔️ Equipment
          </button>
          <button
            onClick={() => setActiveTab('pvp')}
            className={`flex-1 px-4 py-3 font-bold text-sm transition-colors border-r border-gray-200 ${
              activeTab === 'pvp'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ⚔️ PvP
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex-1 px-4 py-3 font-bold text-sm transition-colors ${
              activeTab === 'changelog'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📋 Changelog
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'lizards' && <LizardsTab />}
          {activeTab === 'equipment' && <EquipmentTab />}
          {activeTab === 'pvp' && <PvPTab />}
          {activeTab === 'changelog' && <ChangelogTab />}
        </div>
      </div>
    </Window>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Section title="Welcome to Creepz Community Hub! 🎮">
        <p className="text-gray-700 leading-relaxed">
          Creepz Community Hub is an interactive platform where you can chat with other Creepz holders,
          manage your Lizard companions, collect powerful equipment, and battle other players in intense PvP combat!
        </p>
      </Section>

      <Section title="Getting Started 🚀">
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Create an Account:</strong> Sign up with your email to get started</li>
          <li><strong>Get Your Lizard:</strong> Visit the LizardGoshi window to hatch your first lizard companion</li>
          <li><strong>Earn Gold:</strong> Your lizard generates passive gold income based on its stats</li>
          <li><strong>Buy Equipment:</strong> Spend gold in the shop to purchase equipment and boost your stats</li>
          <li><strong>Battle Players:</strong> Click on usernames in chat to challenge them to PvP fights!</li>
        </ul>
      </Section>

      <Section title="Key Features 💫">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Feature icon="💬" title="Global Chat" description="Connect with other Creepz holders worldwide" />
          <Feature icon="🦎" title="Lizard System" description="Hatch and customize your unique lizard companion" />
          <Feature icon="⚔️" title="Equipment Shop" description="Purchase gear to enhance your lizard's abilities" />
          <Feature icon="⚡" title="PvP Combat" description="Battle other players in real-time lizard fights" />
          <Feature icon="💰" title="Gold Economy" description="Earn passive income and spend strategically" />
          <Feature icon="📊" title="Statistics" description="Track your wins, losses, and performance" />
        </div>
      </Section>
    </div>
  );
}

function LizardsTab() {
  return (
    <div className="space-y-6">
      <Section title="Lizard Stats Explained 📊">
        <div className="space-y-4">
          <StatExplanation
            icon="❤️"
            name="HP (Health Points)"
            baseValue="100"
            description="Your lizard's health in combat. When HP reaches 0, you lose the fight."
          />
          <StatExplanation
            icon="⚔️"
            name="ATK (Attack)"
            baseValue="10"
            description="Determines damage dealt to opponents. Higher ATK means stronger hits."
          />
          <StatExplanation
            icon="🛡️"
            name="DEF (Defense)"
            baseValue="5"
            description="Reduces incoming damage. Each point of DEF reduces damage by 0.5."
          />
          <StatExplanation
            icon="💥"
            name="Crit Rate"
            baseValue="10%"
            description="Chance to land a critical hit. Crits deal extra damage based on Crit Damage."
          />
          <StatExplanation
            icon="🔥"
            name="Crit Damage"
            baseValue="50%"
            description="Extra damage multiplier for critical hits. 50% = 1.5x damage on crits."
          />
          <StatExplanation
            icon="⚡"
            name="Attack Speed"
            baseValue="60/min"
            description="Attacks per minute. 60 = 1 attack per second. Higher is faster."
          />
          <StatExplanation
            icon="💚"
            name="Regeneration"
            baseValue="0 HP/min"
            description="Health restored per minute during combat. Can turn the tide of long fights."
          />
          <StatExplanation
            icon="💰"
            name="Gold Per Second"
            baseValue="1/s"
            description="Passive gold income. Automatically accumulates even when you're offline."
          />
        </div>
      </Section>

      <Section title="How Lizards Work 🦎">
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Each user can own <strong>one lizard</strong></li>
          <li>Lizards have a <strong>name</strong> and <strong>gender</strong> (male/female)</li>
          <li>Your lizard <strong>generates passive gold</strong> based on its stats + equipment</li>
          <li>You can <strong>level up</strong> your lizard to increase base stats</li>
          <li>Equipment boosts your lizard's stats for combat and income</li>
        </ul>
      </Section>
    </div>
  );
}

function EquipmentTab() {
  return (
    <div className="space-y-6">
      <Section title="Equipment System ⚔️">
        <p className="text-gray-700 leading-relaxed mb-4">
          Equipment is the key to making your lizard stronger! Purchase items from the shop,
          equip them to boost your stats, and dominate in PvP combat.
        </p>
      </Section>

      <Section title="Rarity Tiers 🌟">
        <div className="space-y-3">
          <RarityInfo rarity="Common" color="text-gray-600" stats="1 stat" chance="35%" />
          <RarityInfo rarity="Uncommon" color="text-green-600" stats="1 stat" chance="30%" />
          <RarityInfo rarity="Rare" color="text-blue-600" stats="2 stats" chance="20%" />
          <RarityInfo rarity="Epic" color="text-purple-600" stats="2 stats" chance="10%" />
          <RarityInfo rarity="Legendary" color="text-orange-600" stats="3 stats" chance="4%" />
          <RarityInfo rarity="Mythical" color="text-red-600" stats="4 stats" chance="1%" />
        </div>
      </Section>

      <Section title="Equipment Slots 👕">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Slot icon="🪖" name="Helmet" />
          <Slot icon="👕" name="Chest" />
          <Slot icon="🧤" name="Gloves" />
          <Slot icon="👞" name="Boots" />
          <Slot icon="⚔️" name="Weapon" />
          <Slot icon="🛡️" name="Shield" />
          <Slot icon="💍" name="Ring" />
          <Slot icon="📿" name="Necklace" />
          <Slot icon="👑" name="Belt" />
          <Slot icon="🧣" name="Cape" />
        </div>
      </Section>

      <Section title="Shop Mechanics 🏪">
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>The shop displays <strong>6 random items</strong> for purchase</li>
          <li>Each item is level-scaled to your lizard's level</li>
          <li>Shop refreshes automatically every <strong>5 minutes</strong></li>
          <li>You can also manually refresh (cooldown applies)</li>
          <li>Prices are based on <strong>rarity and level</strong></li>
          <li>Inventory holds up to <strong>30 items</strong> (plus 10 equipped)</li>
          <li>Sell unwanted items for <strong>25% of purchase price</strong></li>
        </ul>
      </Section>

      <Section title="Stat Values by Level 📈">
        <p className="text-gray-700 mb-2">Equipment stats scale with item level:</p>
        <div className="bg-white border-2 border-gray-300 rounded-lg p-4 font-mono text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><strong>HP:</strong> level × 10</div>
            <div><strong>ATK:</strong> level × 2</div>
            <div><strong>DEF:</strong> level × 1.5</div>
            <div><strong>Crit Rate:</strong> level × 0.5%</div>
            <div><strong>Crit Dmg:</strong> level × 1%</div>
            <div><strong>Gold/s:</strong> level × 0.5</div>
            <div><strong>Atk Speed:</strong> level × 1</div>
            <div><strong>Regen:</strong> level × 0.5</div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function PvPTab() {
  return (
    <div className="space-y-6">
      <Section title="PvP Combat System ⚔️">
        <p className="text-gray-700 leading-relaxed">
          Challenge other players to lizard battles! Click on any username in the global chat,
          and if they own a lizard, you'll see a "Challenge to Lizard Fight!" button on their profile.
        </p>
      </Section>

      <Section title="How Combat Works 🎮">
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>
            <strong>Countdown:</strong> 3-2-1-FIGHT! gives both players time to see stats
          </li>
          <li>
            <strong>Attack Speed:</strong> Determines how often you attack (base: 60/min = 1 per second)
          </li>
          <li>
            <strong>Damage Calculation:</strong>
            <div className="ml-6 mt-2 bg-gray-100 p-3 rounded font-mono text-sm">
              Base Damage = ATK - (DEF × 0.5)<br />
              Crit Check: Random() &lt; Crit Rate<br />
              Final Damage = Base × (1 + Crit Damage) if crit, else Base
            </div>
          </li>
          <li>
            <strong>Regeneration:</strong> Restores HP over time during combat
          </li>
          <li>
            <strong>Victory:</strong> First lizard to reduce opponent's HP to 0 wins!
          </li>
        </ol>
      </Section>

      <Section title="Combat Speed Multiplier ⚡">
        <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4">
          <p className="text-blue-900 font-semibold mb-2">
            All combat is sped up by 3x for exciting, fast-paced battles!
          </p>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>60 attack speed → 180 attacks/min → 3 attacks per second</li>
            <li>Regeneration is also 3x faster</li>
            <li>Fights typically last 10-30 seconds</li>
          </ul>
        </div>
      </Section>

      <Section title="Visual Effects 💫">
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Charging Glow:</strong> Yellow aura appears before each attack</li>
          <li><strong>Attack Animation:</strong> Lizard lunges forward when attacking</li>
          <li><strong>Damage Numbers:</strong> Red numbers for normal hits, large yellow for crits</li>
          <li><strong>Impact Effects:</strong> Radial explosion on every hit</li>
          <li><strong>Screen Shake:</strong> Camera shakes on critical hits</li>
          <li><strong>Combo Counter:</strong> Tracks consecutive crits with multiplier display</li>
          <li><strong>Hit Reaction:</strong> Lizard shakes when taking damage</li>
        </ul>
      </Section>

      <Section title="Fight Statistics 📊">
        <p className="text-gray-700 mb-2">
          Your fight history is tracked in the <strong>Stats tab</strong> of your LizardGoshi window:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Total wins and losses</li>
          <li>Win rate percentage</li>
          <li>Last 10 fights (whether you attacked or were attacked)</li>
          <li>Winner of each match</li>
          <li>Time ago for each fight</li>
        </ul>
      </Section>

      <Section title="Pro Tips 💡">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 space-y-2">
          <div className="flex gap-2">
            <span>💪</span>
            <span><strong>High ATK:</strong> Great for quick victories against low-DEF opponents</span>
          </div>
          <div className="flex gap-2">
            <span>🛡️</span>
            <span><strong>High DEF:</strong> Makes you tanky, good for outlasting opponents</span>
          </div>
          <div className="flex gap-2">
            <span>💥</span>
            <span><strong>Crit Build:</strong> Stack Crit Rate + Crit Damage for burst damage</span>
          </div>
          <div className="flex gap-2">
            <span>⚡</span>
            <span><strong>Attack Speed:</strong> More hits = more chances to crit!</span>
          </div>
          <div className="flex gap-2">
            <span>💚</span>
            <span><strong>Regeneration:</strong> Excellent for surviving extended fights</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

function ChangelogTab() {
  return (
    <div className="space-y-6">
      <Section title="Recent Updates 🚀">
        <p className="text-gray-600 text-sm mb-4">Latest changes and improvements to Creepz Hub</p>
      </Section>

      <ChangelogEntry
        version="v1.5.0"
        date="2025-01-01"
        title="How It Works Guide & Auth UX Improvements"
        changes={[
          'Added comprehensive "How It Works" guide with 5 tabs (Overview, Lizards, Equipment, PvP, Changelog)',
          'New desktop icon for easy access to game mechanics and documentation',
          'Detailed stat explanations with formulas and base values',
          'Equipment rarity breakdown with drop rates and stat counts',
          'Complete PvP combat guide with damage calculations and pro tips',
          'Redesigned login/signup window with clear visual distinction',
          'Added gradient header and prominent tab buttons (LOGIN blue, SIGN UP green)',
          'Clear contextual messages for new vs returning users',
          'Created migration safety guidelines to preserve player equipment data',
        ]}
      />

      <ChangelogEntry
        version="v1.4.0"
        date="2025-01-01"
        title="Combat Timing Fix & Enhancements"
        changes={[
          'CRITICAL FIX: Lizard fights now start immediately after countdown',
          'Fixed attack timing bug that caused 15-30 second delays',
          'Attacks now occur at correct interval (60 atk/min × 3 = every 333ms)',
          'Added visible scale animation (1.2x) when lizards attack',
          'Increased lunge distance to 30px for dramatic effect',
          'Added console logging for combat debugging',
        ]}
      />

      <ChangelogEntry
        version="v1.3.0"
        date="2025-01-01"
        title="Enhanced Combat Animations"
        changes={[
          'Added 3-2-1-FIGHT countdown with animations',
          'Implemented charging glow animation before attacks',
          'Added screen shake effect on critical hits',
          'Added impact explosion effects on all hits',
          'Added combo counter for consecutive crits',
          'Enhanced damage numbers (crits are larger with glow effects)',
          'Added hit shake/rotation when taking damage',
          'Optimized data loading with parallel fetches',
        ]}
      />

      <ChangelogEntry
        version="v1.2.0"
        date="2024-12-31"
        title="Stats Tab & UX Improvements"
        changes={[
          'Added Stats tab to LizardGoshi showing fight history',
          'Display last 10 fights with winner information',
          'Show total wins, losses, and win rate',
          'Sped up lizard fights by 3x for better pacing',
          'Redesigned equipment cards with dark theme (Diablo-inspired)',
          'Made equipment cards more compact and game-like',
          'Increased LizardGoshi window size to 700×650',
          'Updated all item grids to be more responsive (2-6 columns)',
        ]}
      />

      <ChangelogEntry
        version="v1.1.0"
        date="2024-12-30"
        title="PvP Combat System"
        changes={[
          'Implemented complete PvP lizard fight system',
          'Added attack_speed stat (base: 60 attacks/min)',
          'Added regeneration stat (base: 0 HP/min)',
          'Real-time combat with health bars and damage numbers',
          'Fight result saving to database',
          'Challenge button on user profiles',
          'Dynamic fight animations and effects',
        ]}
      />

      <ChangelogEntry
        version="v1.0.0"
        date="2024-12-29"
        title="Multi-Stat Equipment System"
        changes={[
          'Implemented multi-stat equipment based on rarity',
          'Common/Uncommon: 1 stat, Rare/Epic: 2 stats, Legendary: 3 stats, Mythical: 4 stats',
          'Equipment stats now properly apply to lizard',
          'Show base + equipment + total stats on game tab',
          'Removed sell confirmation popup (kept double-click)',
          'JSONB-based stat storage for flexibility',
        ]}
      />
    </div>
  );
}

// Helper Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-3 border-b-2 border-gray-300 pb-2">
        {title}
      </h2>
      <div>{children}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="font-bold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatExplanation({
  icon,
  name,
  baseValue,
  description,
}: {
  icon: string;
  name: string;
  baseValue: string;
  description: string;
}) {
  return (
    <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-1">
            <h3 className="font-bold text-gray-800">{name}</h3>
            <span className="text-sm text-gray-500">(Base: {baseValue})</span>
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function RarityInfo({
  rarity,
  color,
  stats,
  chance,
}: {
  rarity: string;
  color: string;
  stats: string;
  chance: string;
}) {
  return (
    <div className="flex items-center justify-between bg-white border-2 border-gray-300 rounded-lg p-3">
      <div className="flex items-center gap-3">
        <span className={`font-bold text-lg ${color}`}>{rarity}</span>
        <span className="text-sm text-gray-600">{stats}</span>
      </div>
      <div className="bg-gray-100 px-3 py-1 rounded font-semibold text-sm">
        {chance}
      </div>
    </div>
  );
}

function Slot({ icon, name }: { icon: string; name: string }) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded p-2 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs font-semibold text-gray-700">{name}</div>
    </div>
  );
}

function ChangelogEntry({
  version,
  date,
  title,
  changes,
}: {
  version: string;
  date: string;
  title: string;
  changes: string[];
}) {
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{version} - {title}</h3>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {changes.map((change, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-700">
            <span className="text-green-600 font-bold">•</span>
            <span>{change}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
