import React, { useState } from 'react';
import { Play, Users, UserPlus, Info, BookOpen } from 'lucide-react';

export default function Lobby({ onCreateRoom, onJoinRoom, onStartSinglePlayer }) {
  const [playerName, setPlayerName] = useState(localStorage.getItem('kkr_player_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [timeoutSec, setTimeoutSec] = useState('20');
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState('single'); // 'single', 'create', 'join'

  const saveName = (name) => {
    setPlayerName(name);
    localStorage.setItem('kkr_player_name', name);
  };

  const handleSinglePlayer = (e) => {
    e.preventDefault();
    const name = playerName.trim() || 'Player';
    saveName(name);
    onStartSinglePlayer(name);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const name = playerName.trim();
    if (!name) return alert('Please enter your name.');
    saveName(name);
    onCreateRoom(name, { timeoutDuration: parseInt(timeoutSec, 10) });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();
    if (!name) return alert('Please enter your name.');
    if (!code || code.length !== 4) return alert('Please enter a valid 4-character room code.');
    saveName(name);
    onJoinRoom(name, code);
  };

  return (
    <div className="min-h-screen felt-table flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 animate-pop-in relative z-10 border border-emerald-500/20">
        
        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-3xl text-yellow-400">👑</span>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              KAALI KI RANI
            </h1>
          </div>
          <p className="text-slate-300 text-sm font-medium">Queen of Spades Bidding & Trick-Taking Game</p>
        </div>

        {/* Player Name Input */}
        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-semibold mb-2">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            maxLength={12}
          />
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-700/60 mb-6">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 border-b-2 transition ${
              activeTab === 'single'
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play size={16} />
            Single Player
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 border-b-2 transition ${
              activeTab === 'create'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={16} />
            Create Online
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 text-sm font-semibold flex justify-center items-center gap-2 border-b-2 transition ${
              activeTab === 'join'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus size={16} />
            Join Room
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'single' && (
          <form onSubmit={handleSinglePlayer} className="space-y-4 animate-slide-up">
            <p className="text-slate-300 text-sm leading-relaxed">
              Play offline instantly against three heuristic AI computer bots. Perfect for practicing and quick games!
            </p>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <Play size={18} fill="currentColor" />
              Play vs Bots
            </button>
          </form>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4 animate-slide-up">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase mb-2">Turn Timeout</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '10', label: '10s' },
                  { value: '20', label: '20s' },
                  { value: '30', label: '30s' },
                  { value: '0', label: 'None' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTimeoutSec(opt.value)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition ${
                      timeoutSec === opt.value
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold'
                        : 'border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <Users size={18} />
              Create Multiplayer Room
            </button>
          </form>
        )}

        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-4 animate-slide-up">
            <div>
              <label className="block text-slate-300 text-xs font-bold uppercase mb-2">Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="ABCD"
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest text-indigo-400 uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                maxLength={4}
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <UserPlus size={18} />
              Join Room
            </button>
          </form>
        )}

        {/* Footer / Quick Info & Rules */}
        <div className="mt-8 border-t border-slate-700/40 pt-4 flex justify-between items-center text-xs text-slate-400">
          <button 
            onClick={() => setShowRules(true)}
            className="flex items-center gap-1 hover:text-yellow-400 transition font-semibold"
          >
            <BookOpen size={14} />
            How to Play
          </button>
          <span>v1.0.0</span>
        </div>

        {/* Rules Modal Overlay */}
        {showRules && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Info size={18} />
                Game Rules Summary
              </h2>
              
              <div className="space-y-4 text-slate-300 text-xs sm:text-sm leading-relaxed">
                <div>
                  <h3 className="font-bold text-slate-100 mb-1">Point Card Values</h3>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800">
                    <div>♠Q (Kaali Ki Rani): <b className="text-yellow-400">30 pts</b></div>
                    <div>Aces (Any Suit): <b className="text-slate-100">15 pts</b></div>
                    <div>10s (Any Suit): <b className="text-slate-100">10 pts</b></div>
                    <div>5s (Any Suit): <b className="text-slate-100">5 pts</b></div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Total points in deck = 150 points.</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 mb-1">Bidding Phase</h3>
                  <p>Players bid from 75 to 150. The bid starter must bid at least 75. Passed players are locked out. Bidding ends when all other players pass. The bid winner chooses a partner card and the trump suit.</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 mb-1">Partnership & Trump</h3>
                  <p>The partner holding the named card plays secretly. No one knows who the partner is until that card is played! If the bid winner names a card they hold themselves, they play solo (1 vs 3).</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 mb-1">Gameplay</h3>
                  <p>Follow suit is mandatory. If you have no cards of the led suit, you can play trump or discard. High card of led suit wins unless trumped. Winner of trick leads next.</p>
                </div>

                <div>
                  <h3 className="font-bold text-slate-100 mb-1">Scoring</h3>
                  <p>Partnership wins: Bid Winner gets 2× bid, Partner gets 1× bid. If they fail: Opponents get full bid value each. Match ends when a player reaches 1000 points.</p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="mt-6 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
