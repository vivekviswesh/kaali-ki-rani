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
    <div className="felt-table flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-row flex-center" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '2rem' }}>👑</span>
            <h1 style={{ 
              fontSize: '2.25rem', 
              fontWeight: 900, 
              background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              KAALI KI RANI
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
            Queen of Spades Bidding & Trick-Taking Game
          </p>
        </div>

        {/* Player Name Input */}
        <div className="form-group">
          <label className="form-label">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name..."
            className="form-input"
            maxLength={12}
          />
        </div>

        {/* Tab Selection */}
        <div className="flex-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('single')}
            className={`btn-tab ${activeTab === 'single' ? 'active-single' : ''}`}
          >
            <Play size={14} style={{ marginRight: '0.25rem' }} />
            Single Player
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`btn-tab ${activeTab === 'create' ? 'active-create' : ''}`}
          >
            <Users size={14} style={{ marginRight: '0.25rem' }} />
            Create Online
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`btn-tab ${activeTab === 'join' ? 'active-join' : ''}`}
          >
            <UserPlus size={14} style={{ marginRight: '0.25rem' }} />
            Join Room
          </button>
        </div>

        {/* Tab Panels */}
        {activeTab === 'single' && (
          <form onSubmit={handleSinglePlayer} className="flex-col animate-slide-up" style={{ gap: '1rem' }}>
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Play offline instantly against three smart computer bots. Perfect for practicing and quick games!
            </p>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
              <Play size={16} fill="currentColor" style={{ marginRight: '0.375rem' }} />
              Play vs Bots
            </button>
          </form>
        )}

        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="flex-col animate-slide-up" style={{ gap: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Turn Timeout</label>
              <div className="grid-4">
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
                    className="btn"
                    style={{
                      padding: '0.5rem 0',
                      fontSize: '0.75rem',
                      background: timeoutSec === opt.value ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 6, 23, 0.4)',
                      border: `1px solid ${timeoutSec === opt.value ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                      color: timeoutSec === opt.value ? '#10b981' : '#94a3b8'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '0.875rem' }}>
              <Users size={16} style={{ marginRight: '0.375rem' }} />
              Create Multiplayer Room
            </button>
          </form>
        )}

        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="flex-col animate-slide-up" style={{ gap: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>Room Code</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="ABCD"
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  padding: '0.5rem 1rem'
                }}
                maxLength={4}
              />
            </div>
            
            <button type="submit" className="btn btn-indigo" style={{ width: '100%', padding: '0.875rem' }}>
              <UserPlus size={16} style={{ marginRight: '0.375rem' }} />
              Join Room
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="flex-row justify-between items-center" style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', fontSize: '0.75rem', color: '#64748b' }}>
          <button 
            onClick={() => setShowRules(true)}
            className="flex-row items-center"
            style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontWeight: 600, gap: '0.25rem' }}
          >
            <BookOpen size={12} />
            How to Play
          </button>
          <span>v1.0.0</span>
        </div>

        {/* Rules Modal Overlay */}
        {showRules && (
          <div className="modal-overlay-blur">
            <div className="modal-window-card" style={{ maxWidth: '440px', textAlign: 'left' }}>
              <h2 className="flex-row items-center" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                <Info size={16} />
                Game Rules Summary
              </h2>
              
              <div className="flex-col" style={{ gap: '1rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4, maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
                <div>
                  <h3 style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Point Card Values</h3>
                  <div className="grid-2" style={{ background: 'rgba(2, 6, 23, 0.4)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>♠Q (Kaali Ki Rani): <b style={{ color: '#fbbf24' }}>30 pts</b></div>
                    <div>Aces (Any Suit): <b>15 pts</b></div>
                    <div>10s (Any Suit): <b>10 pts</b></div>
                    <div>5s (Any Suit): <b>5 pts</b></div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>Total points in deck = 150 points.</p>
                </div>

                <div>
                  <h3 style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Bidding Phase</h3>
                  <p>Players bid from 75 to 150. The bid starter must open bidding at 75+. Passed players are locked out. Bidding ends when all other players pass. The bid winner chooses a partner card and the trump suit.</p>
                </div>

                <div>
                  <h3 style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Partnership & Trump</h3>
                  <p>The partner holding the named card plays secretly. No one knows who the partner is until that card is played! If the bid winner names a card they hold themselves, they play solo (1 vs 3).</p>
                </div>

                <div>
                  <h3 style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Gameplay</h3>
                  <p>Follow suit is mandatory. If you have no cards of the led suit, you can play trump or discard. High card of led suit wins unless trumped. Winner of trick leads next.</p>
                </div>

                <div>
                  <h3 style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>Scoring</h3>
                  <p>Partnership wins: Bid Winner gets 2× bid, Partner gets 1× bid. If they fail: Opponents get full bid value each. Match ends when a player reaches 1000 points.</p>
                </div>
              </div>

              <button
                onClick={() => setShowRules(false)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.625rem' }}
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
