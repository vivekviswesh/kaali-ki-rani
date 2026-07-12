import React, { useState } from 'react';
import { SUITS, RANKS } from '../engine/constants.js';
import { Sparkles } from 'lucide-react';

const SUIT_SYMBOLS = {
  S: '♠ Spades',
  H: '♥ Hearts',
  D: '♦ Diamonds',
  C: '♣ Clubs'
};

const SUIT_COLORS = {
  S: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-400',
  H: 'text-rose-500 border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-400',
  D: 'text-amber-500 border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500',
  C: 'text-emerald-500 border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-400'
};

const SUIT_ACTIVE_COLORS = {
  S: 'border-indigo-500 bg-indigo-500/20 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.3)]',
  H: 'border-rose-500 bg-rose-500/20 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]',
  D: 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  C: 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
};

export default function DeclarationOverlay({ gameState, mySeat, onDeclare }) {
  const { activeSeat, players } = gameState;
  const isActive = activeSeat === mySeat;
  
  const [partnerRank, setPartnerRank] = useState('A');
  const [partnerSuit, setPartnerSuit] = useState('S');
  const [trumpSuit, setTrumpSuit] = useState('S');

  const handleSubmit = (e) => {
    e.preventDefault();
    onDeclare({
      partnerCard: { rank: partnerRank, suit: partnerSuit },
      trumpSuit
    });
  };

  const activePlayerName = players[activeSeat]?.name || 'Player';

  if (!isActive) {
    return (
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="w-full max-w-md glass-panel rounded-2xl p-6 text-center border border-slate-800">
          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">📣</div>
          <h2 className="text-xl font-bold text-yellow-400 mb-2">Partner & Trump Declaration</h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Waiting for bid winner <span className="text-emerald-400 font-bold">{activePlayerName}</span> to declare the Partner Card and Trump Suit...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 border border-emerald-500/20 animate-pop-in shadow-2xl">
        
        <div className="text-center mb-6">
          <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-2 text-yellow-400">
            <Sparkles size={20} />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100">Make Your Declaration</h2>
          <p className="text-slate-400 text-xs mt-1">You won the bid! Choose your partnership and trumps.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Partner Card Section */}
          <div className="space-y-3">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">1. Partner Card</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Rank select */}
              <div>
                <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Rank</span>
                <select
                  value={partnerRank}
                  onChange={(e) => setPartnerRank(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {Object.values(RANKS).map((rank) => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              {/* Suit select */}
              <div>
                <span className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Suit</span>
                <select
                  value={partnerSuit}
                  onChange={(e) => setPartnerSuit(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2.5 text-slate-200 text-sm font-semibold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  {Object.entries(SUIT_SYMBOLS).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-500 bg-slate-950/30 p-2 rounded-lg leading-relaxed border border-slate-950">
              💡 <b>Note:</b> The player holding this card becomes your secret partner. If this card is in your own hand, you will play <b>Solo (1 vs 3)</b>.
            </p>
          </div>

          {/* Trump Suit Section */}
          <div className="space-y-2">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider">2. Trump Suit</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(SUITS).map((key) => {
                const code = SUITS[key];
                const active = trumpSuit === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setTrumpSuit(code)}
                    className={`py-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 font-bold text-sm ${
                      active ? SUIT_ACTIVE_COLORS[code] : SUIT_COLORS[code]
                    }`}
                  >
                    <span className="text-lg">{SUIT_SYMBOLS[code].split(' ')[0]}</span>
                    <span className="text-[9px] uppercase tracking-wide opacity-80">{key.slice(0, 5)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl shadow-lg active:scale-[0.98] transition text-sm flex items-center justify-center gap-2"
          >
            📢 Broadcast Declaration
          </button>
        </form>
      </div>
    </div>
  );
}
