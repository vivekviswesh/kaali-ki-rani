import React, { useState, useEffect } from 'react';
import { Play, Users, UserPlus, Info, BookOpen } from 'lucide-react';
import versionHistory from '../version_history.json';
import { supabase } from '../supabaseClient';

export default function Lobby({ onCreateRoom, onJoinRoom, onStartSinglePlayer, onShowVersionHistory, onShowRules, user, onSignOut }) {
  const [playerName, setPlayerName] = useState(localStorage.getItem('kkr_player_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [timeoutSec, setTimeoutSec] = useState('20');
  const [activeTab, setActiveTab] = useState('single'); // 'single', 'create', 'join'

  useEffect(() => {
    if (user) {
      const authName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player';
      setPlayerName(authName);
      localStorage.setItem('kkr_player_name', authName);
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) alert('Google Sign In failed: ' + error.message);
  };

  const handlePasskeySignIn = async () => {
    const email = prompt("Enter email associated with your passkey account:");
    if (!email) return;
    const { error } = await supabase.auth.passkey.signInWithPasskey({
      email: email
    });
    if (error) alert('Passkey authentication failed: ' + error.message);
  };

  const handleRegisterPasskey = async () => {
    const { data, error } = await supabase.auth.passkey.register();
    if (error) {
      alert('Error registering passkey: ' + error.message);
    } else {
      alert('Passkey successfully registered on this device!');
    }
  };

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
    if (!code) return alert('Please enter a valid room code.');
    saveName(name);
    onJoinRoom(name, code);
  };

  return (
    <div className="felt-table flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '480px', padding: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        
        {/* Title Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            className="flex-row flex-center" 
            style={{ gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s ease, opacity 0.2s ease' }}
            onClick={() => {
              setActiveTab('single');
              setShowRules(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.opacity = '1';
            }}
            title="Go to Home"
          >
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

        {/* Supabase Authentication Section */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
          {user ? (
            <div className="flex-col" style={{ gap: '0.5rem' }}>
              <div className="flex-row justify-between items-center" style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                <span>Logged in as: <strong style={{ color: '#34d399' }}>{user.email}</strong></span>
                <button 
                  onClick={onSignOut} 
                  className="btn" 
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5' }}
                >
                  Logout
                </button>
              </div>
              <button
                onClick={handleRegisterPasskey}
                className="btn"
                style={{ padding: '0.4rem', fontSize: '0.75rem', background: 'rgba(129, 140, 248, 0.2)', border: '1px solid #818cf8', color: '#cbd5e1', width: '100%', marginTop: '0.25rem' }}
              >
                🔑 Add/Register Device Passkey
              </button>
            </div>
          ) : (
            <div className="flex-col" style={{ gap: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Optional: Log in to enable biometric passkeys & save account</span>
              <div className="grid-2" style={{ gap: '0.5rem' }}>
                <button
                  onClick={handleGoogleSignIn}
                  className="btn btn-secondary flex-row flex-center"
                  style={{ padding: '0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                >
                  <span>🌐</span> Google Login
                </button>
                <button
                  onClick={handlePasskeySignIn}
                  className="btn btn-secondary flex-row flex-center"
                  style={{ padding: '0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
                >
                  <span>🔑</span> Passkey Login
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Player Name Input */}
        <div className="form-group">
          <label className="form-label">Your Name <span style={{ color: '#ef4444', marginLeft: '0.125rem' }}>*</span></label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter player name..."
            className="form-input"
            maxLength={12}
            readOnly={!!user}
            style={user ? { background: 'rgba(255,255,255,0.02)', color: '#94a3b8', cursor: 'not-allowed' } : {}}
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
                placeholder="e.g. BANANA"
                className="form-input"
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#818cf8',
                  padding: '0.5rem 1rem'
                }}
                maxLength={20}
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
            onClick={onShowRules}
            className="flex-row items-center"
            style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontWeight: 600, gap: '0.25rem' }}
          >
            <BookOpen size={12} />
            How to Play
          </button>
          <span 
            onClick={onShowVersionHistory}
            style={{ 
              color: '#34d399', 
              cursor: 'pointer', 
              fontWeight: 800, 
              background: 'rgba(52, 211, 153, 0.1)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              textDecoration: 'underline'
            }}
            title="View Release History"
          >
            {versionHistory.currentVersion}
          </span>
        </div>

      </div>
    </div>
  );
}
