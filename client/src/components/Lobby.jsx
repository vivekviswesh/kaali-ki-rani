import React, { useState, useEffect } from 'react';
import { Play, Users, UserPlus, Info, BookOpen, Key, LogOut } from 'lucide-react';
import versionHistory from '../version_history.json';
import { supabase } from '../supabaseClient';

export default function Lobby({ onCreateRoom, onJoinRoom, onStartSinglePlayer, onShowVersionHistory, onShowRules, user, onSignOut, error, onError, onBackToLanding, pendingAction, clearPendingAction }) {
  const [playerName, setPlayerName] = useState(localStorage.getItem('kkr_player_name') || '');
  const [roomCode, setRoomCode] = useState('');
  const [timeoutSec, setTimeoutSec] = useState('20');
  const [activeTab, setActiveTab] = useState('single'); // 'single', 'create', 'join'

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [showNameSelector, setShowNameSelector] = useState(false);
  const [newGamerName, setNewGamerName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setIsLoadingProfile(false);
        return;
      }

      setIsLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('gamer_name')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile(data);
          setPlayerName(data.gamer_name);
          localStorage.setItem('kkr_player_name', data.gamer_name);
          setShowNameSelector(false);
          if (pendingAction === 'single') {
            onStartSinglePlayer(data.gamer_name);
            if (clearPendingAction) clearPendingAction();
          } else if (pendingAction === 'multi') {
            if (clearPendingAction) clearPendingAction();
          }
        } else {
          // No profile found, onboarding required
          setShowNameSelector(true);
        }
      } catch (err) {
        console.error('Error fetching profile:', err.message);
        if (err.message?.includes('relation "public.profiles" does not exist')) {
          alert('Database Setup Required:\nPlease run the SQL script in your Supabase SQL Editor to create the "profiles" table (see walkthrough.md).');
        } else {
          alert('Error loading profile: ' + err.message);
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [user, pendingAction, clearPendingAction]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) alert('Google Sign In failed: ' + error.message);
  };

  const handleMagicLinkSignIn = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      alert('Please enter your email.');
      return;
    }

    setIsSendingMagicLink(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (error) throw error;
      alert('Magic login link sent! Please check your email inbox.');
    } catch (err) {
      alert('Error sending magic link: ' + err.message);
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handlePasskeySignIn = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      alert('Please enter your email to log in with a Passkey.');
      return;
    }

    if (!supabase || !supabase.auth || !supabase.auth.signInWithPasskey) {
      alert('Passkey support is not available or enabled in your Supabase client settings.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPasskey({
        email: cleanEmail
      });
      if (error) {
        alert('Passkey authentication failed: ' + error.message);
      }
    } catch (err) {
      alert('Unexpected Passkey Sign In Exception:\n' + err.message);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!supabase || !supabase.auth || !supabase.auth.registerPasskey) {
      alert('Passkey support is not available or enabled in your Supabase configuration.');
      return;
    }
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) {
        alert('Error registering passkey: ' + error.message + '\n\nMake sure Passkey Authentication is enabled in your Supabase Auth dashboard.');
      } else {
        alert('Passkey successfully registered on this device!');
      }
    } catch (err) {
      alert('Unexpected Exception during passkey registration:\n' + err.message + '\n\nMake sure your Supabase Project settings have Passkey authentication enabled under Authentication -> Passkeys.');
    }
  };

  const handleSaveGamerName = async (e) => {
    e.preventDefault();
    setNameError('');
    const cleanName = newGamerName.trim();
    
    if (cleanName.length < 3) {
      setNameError('Name must be at least 3 characters.');
      return;
    }
    if (cleanName.length > 15) {
      setNameError('Name cannot exceed 15 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanName)) {
      setNameError('Alphanumeric characters and underscores only.');
      return;
    }

    setIsSavingName(true);
    try {
      // Check uniqueness
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('gamer_name', cleanName)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing && existing.id !== user.id) {
        setNameError('This name is already taken by another player.');
        return;
      }

      // Upsert profile
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ id: user.id, gamer_name: cleanName, updated_at: new Date() });

      if (upsertError) throw upsertError;

      setProfile({ gamer_name: cleanName });
      setPlayerName(cleanName);
      localStorage.setItem('kkr_player_name', cleanName);
      setShowNameSelector(false);
      setNameError('');
      if (pendingAction === 'single') {
        onStartSinglePlayer(cleanName);
        if (clearPendingAction) clearPendingAction();
      } else if (pendingAction === 'multi') {
        if (clearPendingAction) clearPendingAction();
      }
    } catch (err) {
      setNameError(err.message || 'Error saving name.');
    } finally {
      setIsSavingName(false);
    }
  };

  const saveName = (name) => {
    setPlayerName(name);
    localStorage.setItem('kkr_player_name', name);
  };
  const GoogleLogo = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" style={{ marginRight: '0.5rem' }}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  if (isLoadingProfile) {
    return (
      <div className="felt-table flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
        <div className="flex-col items-center" style={{ gap: '1rem', color: '#cbd5e1' }}>
          <div className="animate-spin" style={{ width: '2rem', height: '2rem', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#34d399', borderRadius: '50%' }}></div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (supabase && user && showNameSelector) {
    return (
      <div className="felt-table flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
        <div className="glass-panel animate-pop-in flex-col items-center" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', gap: '1.5rem' }}>
          
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>🎮</span>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              Choose Gamer Name
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.5rem' }}>
              Every player needs a unique display name to play.
            </p>
          </div>

          <form onSubmit={handleSaveGamerName} className="flex-col" style={{ width: '100%', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1' }}>Unique Username (3-15 characters)</label>
              <input
                type="text"
                value={newGamerName}
                onChange={(e) => {
                  setNewGamerName(e.target.value);
                  setNameError('');
                }}
                placeholder="Enter gamer name..."
                className="form-input"
                maxLength={15}
                disabled={isSavingName}
                required
              />
              {nameError && (
                <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>
                  ⚠️ {nameError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-indigo flex-row flex-center"
              style={{ width: '100%', padding: '0.875rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '0.75rem', cursor: isSavingName ? 'not-allowed' : 'pointer' }}
              disabled={isSavingName}
            >
              {isSavingName ? 'Saving...' : 'Save and Enter Lobby'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  if (supabase && !user) {
    return (
      <div className="felt-table flex-center" style={{ minHeight: '100vh', padding: '1rem' }}>
        <div className="glass-panel animate-pop-in flex-col items-center" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', gap: '1.25rem' }}>
          
          {/* Title Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div 
              className="flex-col items-center" 
              style={{ cursor: 'pointer', transition: 'transform 0.2s ease, opacity 0.2s ease' }}
              onClick={() => {
                if (onBackToLanding) onBackToLanding();
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
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>👑</span>
              <h1 style={{ 
                fontSize: '2.25rem', 
                fontWeight: 900, 
                background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 50%, #34d399 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                margin: 0
              }}>
                KAALI KI RANI
              </h1>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.5rem' }}>
              Sign in to play the trick-taking classic
            </p>
          </div>

          {/* Email Registration/Login Section */}
          <form onSubmit={handleMagicLinkSignIn} className="flex-col" style={{ width: '100%', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: '0.15rem' }}>
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Enter your email..."
                className="form-input"
                required
              />
            </div>
            <div className="grid-2" style={{ gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary flex-row flex-center"
                style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', fontWeight: 700, cursor: isSendingMagicLink ? 'not-allowed' : 'pointer' }}
                disabled={isSendingMagicLink}
              >
                {isSendingMagicLink ? 'Sending...' : '✉️ Magic Link'}
              </button>
              <button
                type="button"
                onClick={handlePasskeySignIn}
                className="btn btn-secondary flex-row flex-center"
                style={{ padding: '0.75rem 0.5rem', fontSize: '0.8rem', fontWeight: 700, background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}
              >
                <Key size={14} style={{ marginRight: '0.25rem', color: '#fbbf24' }} fill="currentColor" />
                Passkey Sign In
              </button>
            </div>
          </form>

          {/* Explanatory Notice */}
          <p style={{ color: '#94a3b8', fontSize: '0.7rem', fontStyle: 'italic', textAlign: 'center', lineHeight: '1.4', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.04)', margin: 0 }}>
            ⚠️ <strong>Notice:</strong> To use Passkey Sign In, you must first register your email via Google or Magic Link, then create a passkey in your profile settings.
          </p>

          {/* Divider */}
          <div className="flex-row items-center justify-center" style={{ width: '100%', gap: '0.5rem', color: '#475569', fontSize: '0.75rem', fontWeight: 600 }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            <span>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          </div>

          {/* Google SSO Button */}
          <button
            onClick={handleGoogleSignIn}
            className="btn btn-secondary flex-row flex-center"
            style={{ width: '100%', padding: '0.875rem', fontSize: '0.9rem', fontWeight: 700, borderRadius: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', color: '#ffffff', cursor: 'pointer' }}
          >
            <GoogleLogo />
            Sign In with Google
          </button>

          {/* Footer Info */}
          <div className="flex-row justify-between items-center" style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem', fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
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

  const handleSinglePlayer = (e) => {
    e.preventDefault();
    const name = playerName.trim() || 'Player';
    saveName(name);
    onStartSinglePlayer(name);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const name = playerName.trim();
    if (!name) return onError('Please enter your name.');
    saveName(name);
    onCreateRoom(name, { timeoutDuration: parseInt(timeoutSec, 10) });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const name = playerName.trim();
    const code = roomCode.trim().toUpperCase();
    if (!name) return onError('Please enter your name.');
    if (!code) return onError('Please enter a valid room code.');
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
              if (onBackToLanding) {
                onBackToLanding();
              } else {
                setActiveTab('single');
                setShowRules(false);
              }
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

        {/* User Account Info (Logged In) */}
        {supabase && user && (
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#cbd5e1' }}>
              <span className="flex-row items-center" style={{ gap: '0.25rem' }}>
                👤 Gamer: <strong style={{ color: '#34d399' }}>{playerName}</strong>
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button 
                  onClick={() => {
                    setNewGamerName(playerName);
                    setShowNameSelector(true);
                  }}
                  style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  Edit Name
                </button>
                <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                <button 
                  onClick={onSignOut} 
                  className="flex-row items-center" 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, gap: '0.25rem' }}
                >
                  <LogOut size={12} />
                  Sign Out
                </button>
              </div>
            </div>
            <button
              onClick={handleRegisterPasskey}
              style={{ width: '100%', background: 'rgba(129, 140, 248, 0.08)', border: '1px solid rgba(129, 140, 248, 0.2)', borderRadius: '0.5rem', padding: '0.35rem', color: '#a5b4fc', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
            >
              <Key size={11} />
              Register this device for Biometric Passkey
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '0.75rem',
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'start',
            gap: '0.5rem',
            lineHeight: '1.25'
          }}>
            <span style={{ fontSize: '1.1rem', lineHeight: '1' }}>⚠️</span>
            <div style={{ flex: 1 }}>{error}</div>
            <button 
              onClick={() => onError(null)} 
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '0.9rem', padding: '0 0.25rem', fontWeight: 'bold' }}
            >
              ×
            </button>
          </div>
        )}

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
