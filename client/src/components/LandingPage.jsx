import React, { useState, useEffect, useRef } from 'react';
import { Play, Users, BookOpen, Sparkles, ArrowRight, Shield, Shuffle, Trophy, Gamepad2, Heart, Award } from 'lucide-react';
import './LandingPage.css';

// Mini Card helper component for the gameplay demo
function MiniCard({ rank, suit, isKaali, isPartnerReveal }) {
  const suitSymbols = { S: '♠', H: '♥', D: '♦', C: '♣' };
  const suitColors = { S: '#818cf8', H: '#f43f5e', D: '#f59e0b', C: '#10b981' };
  
  return (
    <div className={`demo-played-card ${isPartnerReveal ? 'partner-reveal' : ''}`} style={{ borderColor: isKaali ? '#fbbf24' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <span style={{ color: isKaali ? '#fbbf24' : '#f8fafc', fontSize: '0.65rem' }}>{rank}</span>
        <span style={{ color: suitColors[suit], fontSize: '0.65rem' }}>{suitSymbols[suit]}</span>
      </div>
      <div style={{ 
        fontSize: '1.25rem', 
        color: suitColors[suit], 
        textAlign: 'center', 
        margin: 'auto 0',
        opacity: isKaali ? 0.8 : 0.15 
      }}>
        {suitSymbols[suit]}
      </div>
      {isKaali && (
        <div style={{ 
          position: 'absolute', 
          bottom: 2, 
          right: 2, 
          background: '#fbbf24', 
          color: '#020617', 
          fontSize: '0.45rem', 
          fontWeight: 900, 
          padding: '1px 2px', 
          borderRadius: 2 
        }}>
          +30
        </div>
      )}
    </div>
  );
}

export default function LandingPage({ onPlaySinglePlayer, onPlayMultiplayer, onShowRules }) {
  // Demo states
  const [demoState, setDemoState] = useState('idle'); // 'idle', 'dealing', 'bidding', 'declaring', 'playing', 'resolving'
  const [activeSeat, setActiveSeat] = useState(null); // null, 0 (South), 1 (West), 2 (North), 3 (East)
  const [demoBids, setDemoBids] = useState({});
  const [playedCards, setPlayedCards] = useState({});
  const [scores, setScores] = useState({ biddingTeam: 0, opponents: 0 });
  const [partnerRevealed, setPartnerRevealed] = useState(false);
  const [cardsCount, setCardsCount] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [statusText, setStatusText] = useState('Watch a live simulated hand below!');
  const [isPlayingDemo, setIsPlayingDemo] = useState(true);

  // References for Spotlight Hover Effect
  const cardRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Cursor gradient tracker for rules cards
  const handleMouseMove = (e, index) => {
    const card = cardRefs[index].current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  // Demo Timeline Effect
  useEffect(() => {
    if (!isPlayingDemo) return;

    let timer;
    let step = 0;

    const runDemo = async () => {
      // Step 0: Idle/Reset
      if (step === 0) {
        setDemoState('idle');
        setDemoBids({});
        setPlayedCards({});
        setPartnerRevealed(false);
        setCardsCount({ 0: 0, 1: 0, 2: 0, 3: 0 });
        setActiveSeat(null);
        setStatusText('Dealing cards clockwise...');
        
        timer = setTimeout(() => {
          step = 1;
          runDemo();
        }, 1500);
      }
      
      // Step 1: Dealing Cards
      else if (step === 1) {
        setDemoState('dealing');
        // Simulate cards counting up
        let count = 0;
        const dealInterval = setInterval(() => {
          count += 3;
          if (count > 13) count = 13;
          setCardsCount({ 0: count, 1: count, 2: count, 3: count });
          if (count === 13) {
            clearInterval(dealInterval);
            setStatusText('Bidding phase begins. Clockwise bids must rise by 5s.');
            step = 2;
            timer = setTimeout(runDemo, 1200);
          }
        }, 200);
      }

      // Step 2: Bidding Phase
      else if (step === 2) {
        setDemoState('bidding');
        
        // West bids 80
        setActiveSeat(1);
        setStatusText('Player 1 (West) opens bidding at 80');
        timer = setTimeout(() => {
          setDemoBids(prev => ({ ...prev, 1: 'Bid: 80' }));
          
          // North passes
          setActiveSeat(2);
          setStatusText('Player 2 (North) passes');
          timer = setTimeout(() => {
            setDemoBids(prev => ({ ...prev, 2: 'Pass' }));
            
            // East bids 90
            setActiveSeat(3);
            setStatusText('Player 3 (East) raises to 90');
            timer = setTimeout(() => {
              setDemoBids(prev => ({ ...prev, 3: 'Bid: 90' }));
              
              // South (You) bids 95 (Winner!)
              setActiveSeat(0);
              setStatusText('You (South) bid 95! Everyone else passes.');
              timer = setTimeout(() => {
                setDemoBids(prev => ({ ...prev, 0: 'Bid: 95' }));
                setActiveSeat(null);
                
                step = 3;
                timer = setTimeout(runDemo, 2000);
              }, 1200);
            }, 1000);
          }, 1000);
        }, 1000);
      }

      // Step 3: Declaration Phase
      else if (step === 3) {
        setDemoState('declaring');
        setStatusText('You won the bid! Declaring Partner Card and Trump suit...');
        
        timer = setTimeout(() => {
          step = 4;
          runDemo();
        }, 3500);
      }

      // Step 4: Trick Playing
      else if (step === 4) {
        setDemoState('playing');
        
        // South plays Club Jack
        setActiveSeat(0);
        setStatusText('You play Jack of Clubs ♣');
        timer = setTimeout(() => {
          setPlayedCards(prev => ({ ...prev, 0: { rank: 'J', suit: 'C' } }));
          setCardsCount(prev => ({ ...prev, 0: 12 }));
          
          // West plays 5 of Clubs (point card)
          setActiveSeat(1);
          setStatusText('West plays 5 of Clubs ♣ (+5 pts)');
          timer = setTimeout(() => {
            setPlayedCards(prev => ({ ...prev, 1: { rank: '5', suit: 'C' } }));
            setCardsCount(prev => ({ ...prev, 1: 12 }));
            
            // North plays Queen of Spades (Secret Partner revealed!)
            setActiveSeat(2);
            setStatusText('North plays Queen of Spades ♠! Secret Partner Revealed! 👑');
            timer = setTimeout(() => {
              setPlayedCards(prev => ({ ...prev, 2: { rank: 'Q', suit: 'S', isKaali: true } }));
              setCardsCount(prev => ({ ...prev, 2: 12 }));
              setPartnerRevealed(true);
              
              // East plays Ace of Clubs (point card)
              setActiveSeat(3);
              setStatusText('East plays Ace of Clubs ♣ (+15 pts)');
              timer = setTimeout(() => {
                setPlayedCards(prev => ({ ...prev, 3: { rank: 'A', suit: 'C' } }));
                setCardsCount(prev => ({ ...prev, 3: 12 }));
                setActiveSeat(null);
                
                step = 5;
                timer = setTimeout(runDemo, 2500);
              }, 1200);
            }, 2000);
          }, 1200);
        }, 1200);
      }

      // Step 5: Trick Resolution
      else if (step === 5) {
        setDemoState('resolving');
        setStatusText('Trick completed! Ace of Clubs wins (highest card of led suit, no trump played).');
        
        timer = setTimeout(() => {
          // East wins 30 (Kaali) + 15 (Ace) + 5 (5) = 50 pts
          setScores(prev => ({ ...prev, opponents: 50 }));
          setPlayedCards({});
          setStatusText('Opponents collect 50 points. Trick goes to Player 3 (East).');
          
          timer = setTimeout(() => {
            step = 0; // Restart loop
            runDemo();
          }, 3000);
        }, 2500);
      }
    };

    runDemo();

    return () => {
      clearTimeout(timer);
    };
  }, [isPlayingDemo]);

  return (
    <div className="landing-container">
      {/* Grid background & particles */}
      <div className="landing-grid-bg"></div>
      
      {/* Background decoration SVG paths inspired by render.com */}
      <svg className="flow-svg" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100,200 Q200,100 600,300 T1600,100" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="2" />
        <path className="flow-line" d="M-100,200 Q200,100 600,300 T1600,100" fill="none" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1.5" />
        
        <path d="M-100,500 Q400,600 900,450 T1900,550" fill="none" stroke="rgba(251, 191, 36, 0.06)" strokeWidth="2" />
        <path className="flow-line" style={{ animationDelay: '-3s', stroke: 'rgba(251, 191, 36, 0.2)' }} d="M-100,500 Q400,600 900,450 T1900,550" fill="none" strokeWidth="1.5" />
      </svg>

      <div className="orb orb-green"></div>
      <div className="orb orb-yellow"></div>
      <div className="orb orb-indigo"></div>
      
      <div className="laser-beam laser-h-1"></div>
      <div className="laser-beam laser-h-2"></div>
      <div className="laser-beam laser-v-1"></div>

      {/* Main Hero Section */}
      <div style={{ position: 'relative', zIndex: 1, padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(16, 185, 129, 0.08)', 
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '9999px',
          padding: '0.35rem 1rem',
          marginBottom: '2rem',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#34d399',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)'
        }}>
          <Sparkles size={14} className="animate-pulse" />
          <span>Real-time Multiplayer & Smart AI Bots</span>
        </div>

        <h1 className="hero-title">
          KAALI KI RANI
        </h1>
        
        <p className="hero-subtitle">
          A thrilling 4-player bidding & partnership card game. Declare your trump, choose a secret partner, and play your cards right to capture the Queen of Spades.
        </p>

        <div className="flex-row flex-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            className="hero-cta-btn"
            onClick={onPlaySinglePlayer}
          >
            <Play size={18} fill="currentColor" />
            Play Single Player
          </button>
          
          <button 
            className="hero-sec-btn"
            onClick={onPlayMultiplayer}
          >
            Multiplayer Room
          </button>
        </div>
      </div>

      {/* Simulated Live Gameplay Panel */}
      <div style={{ position: 'relative', zIndex: 1, padding: '2rem 1.5rem 4rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f3f4f6' }}>
            Experience the Gameplay
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            A simulated live hand showing bidding, declarations, and trick playing.
          </p>
        </div>

        <div className="demo-table-container">
          {/* Status Overlay */}
          <div className="demo-status-text">
            <span>⚡ Game Flow: {statusText}</span>
          </div>

          {/* Scores Panel */}
          <div className="demo-scoreboard">
            <div style={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.15rem', color: '#10b981' }}>Score Mat</div>
            <div style={{ color: '#f8fafc', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>Bidder Team:</span>
              <strong style={{ color: '#fbbf24' }}>{scores.biddingTeam} pts</strong>
            </div>
            <div style={{ color: '#f8fafc', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <span>Opponents:</span>
              <strong>{scores.opponents} pts</strong>
            </div>
          </div>

          {/* Active play controller */}
          <button 
            className="demo-play-btn" 
            title={isPlayingDemo ? "Pause Simulation" : "Play Simulation"}
            onClick={() => setIsPlayingDemo(!isPlayingDemo)}
          >
            {isPlayingDemo ? (
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>||</span>
            ) : (
              <Play size={20} fill="currentColor" style={{ marginLeft: '3px' }} />
            )}
          </button>

          {/* Center trick-play mat or deck */}
          <div className="demo-center-area">
            {Object.keys(playedCards).length === 0 && demoState === 'dealing' && (
              <div className="demo-deck-pile animate-pulse"></div>
            )}
            
            {/* Played Cards in the center */}
            {playedCards[0] && (
              <div className="demo-played-card south">
                <MiniCard rank={playedCards[0].rank} suit={playedCards[0].suit} />
              </div>
            )}
            {playedCards[1] && (
              <div className="demo-played-card west">
                <MiniCard rank={playedCards[1].rank} suit={playedCards[1].suit} />
              </div>
            )}
            {playedCards[2] && (
              <div className="demo-played-card north">
                <MiniCard 
                  rank={playedCards[2].rank} 
                  suit={playedCards[2].suit} 
                  isKaali={playedCards[2].isKaali}
                  isPartnerReveal={partnerRevealed} 
                />
              </div>
            )}
            {playedCards[3] && (
              <div className="demo-played-card east">
                <MiniCard rank={playedCards[3].rank} suit={playedCards[3].suit} />
              </div>
            )}
          </div>

          {/* Player Seats */}
          {/* South (You - Bidder) */}
          <div className={`demo-seat south ${activeSeat === 0 ? 'active' : ''}`}>
            {demoBids[0] && <div className="demo-bubble">{demoBids[0]}</div>}
            <div className="demo-avatar">U</div>
            <span className="demo-name">You (South)</span>
            <div style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 600 }}>
              {demoState === 'dealing' || demoState === 'playing' ? `${cardsCount[0]} Cards` : ''}
              {demoState === 'bidding' && activeSeat === 0 ? 'Bidding...' : ''}
            </div>
          </div>

          {/* West */}
          <div className={`demo-seat west ${activeSeat === 1 ? 'active' : ''}`}>
            {demoBids[1] && <div className="demo-bubble">{demoBids[1]}</div>}
            <div className="demo-avatar">P1</div>
            <span className="demo-name">Player 1</span>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              {demoState === 'dealing' || demoState === 'playing' ? `${cardsCount[1]} Cards` : ''}
            </div>
          </div>

          {/* North (Secret Partner) */}
          <div className={`demo-seat north ${activeSeat === 2 ? 'active' : ''} ${partnerRevealed ? 'partner' : ''}`}>
            {demoBids[2] && <div className="demo-bubble">{demoBids[2]}</div>}
            <div className="demo-avatar">
              {partnerRevealed ? '👑' : 'P2'}
            </div>
            <span className="demo-name">{partnerRevealed ? 'Partner (P2)' : 'Player 2'}</span>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              {demoState === 'dealing' || demoState === 'playing' ? `${cardsCount[2]} Cards` : ''}
            </div>
          </div>

          {/* East */}
          <div className={`demo-seat east ${activeSeat === 3 ? 'active' : ''}`}>
            {demoBids[3] && <div className="demo-bubble">{demoBids[3]}</div>}
            <div className="demo-avatar">P3</div>
            <span className="demo-name">Player 3</span>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
              {demoState === 'dealing' || demoState === 'playing' ? `${cardsCount[3]} Cards` : ''}
            </div>
          </div>

          {/* Declaration overlay popup */}
          {demoState === 'declaring' && (
            <div className="demo-overlay-banner">
              <span className="card-badge gold" style={{ fontSize: '0.65rem' }}>Winning Bid: 95</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', margin: '0.1rem 0' }}>Declarations</h3>
              <p style={{ fontSize: '0.75rem', color: '#cbd5e1', maxWidth: '300px' }}>
                You have declared the Trump suit and Partner card to establish the teams.
              </p>
              <div className="overlay-card-reveal">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Partner Card</span>
                  <div style={{ 
                    width: '38px', 
                    height: '52px', 
                    background: '#1e293b', 
                    border: '2px solid #fbbf24', 
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '2px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.55rem', color: '#fbbf24', fontWeight: 900 }}>
                      <span>Q</span>
                      <span>♠</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#818cf8', textAlign: 'center' }}>♠</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.55rem', color: '#fbbf24', fontWeight: 900, transform: 'rotate(180deg)' }}>
                      <span>Q</span>
                      <span>♠</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Trump Suit</span>
                  <div style={{ 
                    width: '38px', 
                    height: '52px', 
                    background: '#022c22', 
                    border: '1px dashed #10b981', 
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    color: '#818cf8'
                  }}>
                    ♠
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature & Rules Section (Interactive spotlights) */}
      <div style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem 5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Core Features & Rules</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.25rem' }}>Hover over the cards to see their glow trace your movement.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {/* Card 1: Point System */}
          <div 
            ref={cardRefs[0]}
            onMouseMove={(e) => handleMouseMove(e, 0)}
            className="feature-card"
          >
            <div className="feature-icon-container">
              <Trophy size={20} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>150 Point Cards</h3>
              <span className="card-badge gold">Value</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5' }}>
              The deck contains 150 points total. Queen of Spades is 30 points, Aces are 15, Tens are 10, and Fives are 5 points. All other cards carry zero value.
            </p>
          </div>

          {/* Card 2: Bidding */}
          <div 
            ref={cardRefs[1]}
            onMouseMove={(e) => handleMouseMove(e, 1)}
            className="feature-card"
          >
            <div className="feature-icon-container">
              <Award size={20} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Clockwise Bidding</h3>
              <span className="card-badge blue">Strategy</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Bidding starts at 75 and goes up clockwise to a max of 150. The bid winner sets the contract, choosing a partner card and declaring the trump suit.
            </p>
          </div>

          {/* Card 3: Secret Partnership */}
          <div 
            ref={cardRefs[2]}
            onMouseMove={(e) => handleMouseMove(e, 2)}
            className="feature-card"
          >
            <div className="feature-icon-container">
              <Shield size={20} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Hidden Partner</h3>
              <span className="card-badge gold">Mechanic</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5' }}>
              The bidder names a card. Whoever holds it becomes the partner. The identity remains secret from everyone (even the bidder!) until the card is played.
            </p>
          </div>

          {/* Card 4: Match Victory */}
          <div 
            ref={cardRefs[3]}
            onMouseMove={(e) => handleMouseMove(e, 3)}
            className="feature-card"
          >
            <div className="feature-icon-container">
              <Gamepad2 size={20} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>1000 Points Goal</h3>
              <span className="card-badge blue">Match</span>
            </div>
            <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Scores accumulate across hands. Partnerships shift hand-to-hand based on declarations. The first player to reach 1000 points wins the match!
            </p>
          </div>
        </div>

        {/* View Rules Button */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button 
            onClick={onShowRules}
            style={{
              background: 'none',
              border: 'none',
              color: '#34d399',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'gap 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.gap = '0.55rem'}
            onMouseLeave={(e) => e.currentTarget.style.gap = '0.35rem'}
          >
            <BookOpen size={16} />
            Read Full Illustrated Game Rules
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Landing Page Footer */}
      <footer style={{ 
        marginTop: 'auto', 
        borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
        padding: '2rem 1.5rem', 
        textAlign: 'center',
        background: 'rgba(3, 7, 18, 0.6)',
        position: 'relative',
        zIndex: 1
      }}>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          <span>Made with</span>
          <Heart size={10} fill="#f43f5e" stroke="none" />
          <span>for Kaali Ki Rani players.</span>
        </p>
      </footer>
    </div>
  );
}
