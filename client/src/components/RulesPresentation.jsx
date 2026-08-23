import React, { useState, useEffect } from 'react';
import { BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';

export default function RulesPresentation({ onClose }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeScenario, setActiveScenario] = useState(1);
  const totalSlides = 8;

  // Reset scenario when entering Slide 6 (index 5)
  useEffect(() => {
    if (currentSlide === 5) {
      setActiveScenario(1);
    }
  }, [currentSlide]);

  // Handle keyboard arrow navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Loop back to start on finish
      setCurrentSlide(0);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0:
        return (
          <div className="rules-slide-info">
            <div className="rules-slide-header" style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
              <div className="rules-title-cards" style={{ justifyContent: 'center' }}>
                <div className="rules-card-element spade queen-spades">
                  <span>Q</span>
                  <div className="card-center">♠</div>
                  <span>Q</span>
                </div>
              </div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fbbf24', textShadow: '0 0 15px rgba(251,191,36,0.3)', margin: '0.5rem 0 0.25rem 0' }}>KALI KI RANI</h1>
              <h3 style={{ fontSize: '1.25rem', color: '#818cf8', fontWeight: 700, marginBottom: '1.5rem' }}>Queen of ♠</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>An Interactive Guide to the Bidding &amp; Trick-Taking Classic</p>
              <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#64748b' }}>
                Press <span style={{ background: '#1e293b', border: '1px solid #475569', padding: '2px 6px', borderRadius: '4px', margin: '0 4px', color: '#cbd5e1' }}>→</span> or click <strong>Next</strong> below to start
              </div>
            </div>
            <span className="rules-slide-number">Slide 1 / 8</span>
          </div>
        );
      case 1:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Setup &amp; Deal</span>
                <h2>Game Setup</h2>
              </div>
              <div className="rules-slide-body">
                <ul>
                  <li><strong>4 Players</strong>: Fixed seating order. You compete individually, but form temporary alliances.</li>
                  <li><strong>The Deal</strong>: All 52 cards are dealt out equally—every player holds exactly <strong>13 cards</strong>.</li>
                  <li><strong>Dealer Rotation</strong>: No fixed dealer! The player opening the bidding rotates clockwise every hand.</li>
                </ul>
              </div>
            </div>
            <span className="rules-slide-number">Slide 2 / 8</span>
          </div>
        );
      case 2:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Point Values</span>
                <h2>Point Cards</h2>
              </div>
              <div className="rules-slide-body">
                <p>Only certain cards carry points. The deck contains exactly <strong>150 points total</strong>:</p>
                <ul>
                  <li><strong>Queen of ♠ (Kaali)</strong>: <span className="rules-badge rules-badge-danger">30 points</span></li>
                  <li><strong>Aces</strong>: <span className="rules-badge rules-badge-primary">15 points each</span></li>
                  <li><strong>10s</strong>: <span className="rules-badge rules-badge-accent">10 points each</span></li>
                  <li><strong>5s</strong>: <span className="rules-badge rules-badge-success">5 points each</span></li>
                  <li><em>All other cards (2-4, 6-9, J, Q, K)</em>: <span className="rules-badge">0 points</span></li>
                </ul>
              </div>
            </div>
            <span className="rules-slide-number">Slide 3 / 8</span>
          </div>
        );
      case 3:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Bidding</span>
                <h2>Bidding Phase</h2>
              </div>
              <div className="rules-slide-body">
                <ul>
                  <li><strong>Opening</strong>: The first bidder must bid at least <strong>75 points</strong> (max 150, in steps of 5).</li>
                  <li><strong>Bidding Loop</strong>: Each player clockwise must bid higher than the previous bid or <strong>Pass</strong>.</li>
                  <li><strong>Lockout</strong>: Once you Pass, you are locked out of bidding for that round.</li>
                  <li><strong>Goal</strong>: Bidding ends when only 1 bidder remains—they are the <strong>Bid Winner</strong>.</li>
                </ul>
              </div>
            </div>
            <span className="rules-slide-number">Slide 4 / 8</span>
          </div>
        );
      case 4:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Declarations</span>
                <h2>Trump &amp; Partner</h2>
              </div>
              <div className="rules-slide-body">
                <p>The Bid Winner declares:</p>
                <ul>
                  <li><strong>Trump Suit</strong>: The powerful suit that beats all other suit cards.</li>
                  <li><strong>Partner's Card</strong>: Any card (e.g. <em>Ace of ♦</em>). The holder becomes their partner.</li>
                </ul>
                <div className="rules-callout" style={{ marginTop: '0.5rem' }}>
                  <strong>Secret Ally:</strong> No one knows who the partner is until the declared card is played! If the bidder held the card themselves, they play Solo (1 vs 3).
                </div>
              </div>
            </div>
            <span className="rules-slide-number">Slide 5 / 8</span>
          </div>
        );
      case 5:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Gameplay</span>
                <h2>Trick-Taking Phase</h2>
              </div>
              <div className="rules-slide-body">
                <ul>
                  <li><strong>First Trick</strong>: Led by the Bid Winner. Clockwise rotation follows.</li>
                  <li><strong>Follow Suit</strong>: You <strong>must</strong> play the led suit if you hold one.</li>
                  <li><strong>Void Discard</strong>: If void, you can play a <strong>Trump</strong> to win, or discard any card (e.g., feed points to your partner).</li>
                  <li><strong>Winner</strong>: Highest trump wins. If no trump is played, the highest card of the led suit wins.</li>
                </ul>
              </div>
            </div>
            <span className="rules-slide-number">Slide 6 / 8</span>
          </div>
        );
      case 6:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Scoring</span>
                <h2>Scoring &amp; Rewards</h2>
              </div>
              <div className="rules-slide-body">
                <p>Meeting the bid counts as success. Otherwise, it fails:</p>
                <ul>
                  <li><strong>Partnership Success</strong>: Bid winner gets 2&times; Bid, Partner gets 1&times; Bid. Defenders get 0.</li>
                  <li><strong>Partnership Failure</strong>: Bidders get 0; <strong>all opponents</strong> get full Bid value each.</li>
                  <li><strong>Solo Success (1v3)</strong>: Bidder gets 3&times; Bid. Defenders get 0.</li>
                  <li><strong>Solo Failure (1v3)</strong>: Bidder gets 0; <strong>all opponents</strong> get full Bid value each.</li>
                </ul>
              </div>
            </div>
            <span className="rules-slide-number">Slide 7 / 8</span>
          </div>
        );
      case 7:
        return (
          <div className="rules-slide-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="rules-slide-header">
                <span className="rules-slide-tag">Winner</span>
                <h2>Match Over</h2>
              </div>
              <div className="rules-slide-body">
                <ul>
                  <li><strong>Accumulation</strong>: Scores accumulate individually across consecutive hands.</li>
                  <li><strong>Winning Goal</strong>: The match continues until any player reaches or exceeds <strong>1000 points</strong>.</li>
                  <li><strong>Resolution</strong>: The match stops immediately, and the player with the highest total score wins the crown!</li>
                </ul>
              </div>
            </div>
            <span className="rules-slide-number">Slide 8 / 8</span>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSlideVisuals = () => {
    const isActive = true;
    
    switch (currentSlide) {
      case 0:
        return null;
      case 1:
        return (
          <div className={`rules-slide-visuals ${isActive ? 'active' : ''}`}>
            <div className="rules-visuals-table">
              <div className="seat north">N</div>
              <div className="seat east">E</div>
              <div className="seat south">S</div>
              <div className="seat west">W</div>
              <div className="rules-deal-card" id="deal-c1"></div>
              <div className="rules-deal-card" id="deal-c2"></div>
              <div className="rules-deal-card" id="deal-c3"></div>
              <div className="rules-deal-card" id="deal-c4"></div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={`rules-slide-visuals rules-point-card-row ${isActive ? 'active' : ''}`} style={{ flexDirection: 'column', justifyContent: 'center', gap: '0.4rem', padding: '0.5rem 0.75rem', alignItems: 'stretch' }}>
            {/* Row 1: Queen of Spades (30 pts) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f43f5e', textShadow: '0 0 5px rgba(244,63,94,0.2)' }}>Queen of ♠ (30 pts):</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <div className="rules-card-element spade queen-spades small-card" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', boxShadow: '0 0 8px rgba(251, 191, 36, 0.4)', position: 'relative' }}>
                  <span>Q</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♠</div>
                </div>
              </div>
            </div>

            {/* Row 2: Aces (15 pts each) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fbbf24', textShadow: '0 0 5px rgba(251,191,36,0.2)' }}>Aces (15 pts each):</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <div className="rules-card-element spade" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem' }}>
                  <span>A</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♠</div>
                </div>
                <div className="rules-card-element heart" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', color: '#f43f5e' }}>
                  <span>A</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♥</div>
                </div>
                <div className="rules-card-element club" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem' }}>
                  <span>A</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♣</div>
                </div>
                <div className="rules-card-element diamond" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', color: '#f43f5e' }}>
                  <span>A</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♦</div>
                </div>
              </div>
            </div>

            {/* Row 3: 10s (10 pts each) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#818cf8', textShadow: '0 0 5px rgba(129,140,248,0.2)' }}>10s (10 pts each):</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <div className="rules-card-element spade" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem' }}>
                  <span>10</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♠</div>
                </div>
                <div className="rules-card-element heart" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', color: '#f43f5e' }}>
                  <span>10</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♥</div>
                </div>
                <div className="rules-card-element club" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem' }}>
                  <span>10</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♣</div>
                </div>
                <div className="rules-card-element diamond" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', color: '#f43f5e' }}>
                  <span>10</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♦</div>
                </div>
              </div>
            </div>

            {/* Row 4: 5s (5 pts each) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.25rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textShadow: '0 0 5px rgba(52,211,153,0.2)' }}>5s (5 pts each):</span>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <div className="rules-card-element spade" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem' }}>
                  <span>5</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♠</div>
                </div>
                <div className="rules-card-element heart" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', color: '#f43f5e' }}>
                  <span>5</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♥</div>
                </div>
                <div className="rules-card-element club" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem' }}>
                  <span>5</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♣</div>
                </div>
                <div className="rules-card-element diamond" style={{ width: '40px', height: '60px', padding: '3px', fontSize: '0.65rem', color: '#f43f5e' }}>
                  <span>5</span>
                  <div style={{ fontSize: '1.1rem', textAlign: 'center', alignSelf: 'center', lineHeight: 1 }}>♦</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={`rules-slide-visuals ${isActive ? 'active' : ''}`}>
            <div className="rules-visuals-table">
              <div className="seat north">N</div>
              <div className="seat east">E</div>
              <div className="seat south">S</div>
              <div className="seat west">W</div>
              
              <div className="rules-bid-bubble" id="bid-b1" style={{ top: '20px', left: 'calc(50% - 25px)' }}>Bid 75</div>
              <div className="rules-bid-bubble" id="bid-b2" style={{ right: '20px', top: 'calc(50% - 15px)' }}>Pass</div>
              <div className="rules-bid-bubble" id="bid-b3" style={{ bottom: '20px', left: 'calc(50% - 25px)' }}>Pass</div>
              <div className="rules-bid-bubble" id="bid-b4" style={{ left: '20px', top: 'calc(50% - 15px)' }}>Bid 80 👑</div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className={`rules-slide-visuals ${isActive ? 'active' : ''}`}>
            <div className="rules-flip-card-container">
              <div className="rules-flip-card-inner">
                <div className="rules-flip-card-front">
                  ❓
                </div>
                <div className="rules-flip-card-back" style={{ color: '#f43f5e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px', border: '3px solid #f43f5e', boxShadow: '0 8px 25px rgba(244, 63, 94, 0.4)' }}>
                  <span style={{ alignSelf: 'flex-start', fontSize: '1.5rem', fontWeight: 800 }}>A</span>
                  <div style={{ fontSize: '4rem', textAlign: 'center', width: '100%', alignSelf: 'center', lineHeight: 1 }}>♦</div>
                  <span style={{ alignSelf: 'flex-end', fontSize: '1.5rem', fontWeight: 800, transform: 'rotate(180deg)' }}>A</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={`rules-slide-visuals ${isActive ? 'active' : ''}`} style={{ flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem', zIndex: 10 }}>
              <button className={`scen-btn ${activeScenario === 1 ? 'active' : ''}`} onClick={() => setActiveScenario(1)}>Scenario 1</button>
              <button className={`scen-btn ${activeScenario === 2 ? 'active' : ''}`} onClick={() => setActiveScenario(2)}>Scenario 2</button>
              <button className={`scen-btn ${activeScenario === 3 ? 'active' : ''}`} onClick={() => setActiveScenario(3)}>Scenario 3</button>
            </div>

            <div id="trick-scenario-banner" style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.75rem',
              textAlign: 'center',
              width: '85%',
              border: activeScenario === 2 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid rgba(52, 211, 153, 0.3)',
              background: activeScenario === 2 ? 'rgba(251, 191, 36, 0.05)' : 'rgba(52, 211, 153, 0.05)',
              color: activeScenario === 2 ? '#fbbf24' : '#34d399',
              transition: 'all 0.3s ease'
            }}>
              {activeScenario === 1 && "Scenario 1: All Follow Suit (Winner: A♣)"}
              {activeScenario === 2 && "Scenario 2: Trump Card Played (Winner: 5♦)"}
              {activeScenario === 3 && "Scenario 3: Discard Played (Winner: A♣)"}
            </div>

            <div className={`rules-visuals-table active-scen-${activeScenario}`} style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}>
              <div className="seat north">N</div>
              <div className="seat east">E</div>
              <div className="seat south">S</div>
              <div className="seat west">W</div>

              <div className="trick-card club" id="trick-c1" style={{ top: '15px', left: 'calc(50% - 25px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px', color: '#0f172a', position: 'absolute' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', lineHeight: 1 }}>K</span>
                <div style={{ fontSize: '1.4rem', textAlign: 'center', lineHeight: 1, alignSelf: 'center' }}>♣</div>
                <span style={{ alignSelf: 'flex-end', fontSize: '0.65rem', lineHeight: 1, transform: 'rotate(180deg)' }}>K</span>
              </div>
              
              <div className="trick-card club" id="trick-c2" style={{ right: '15px', top: 'calc(50% - 37px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px', color: '#0f172a', position: 'absolute' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', lineHeight: 1 }}>10</span>
                <div style={{ fontSize: '1.4rem', textAlign: 'center', lineHeight: 1, alignSelf: 'center' }}>♣</div>
                <span style={{ alignSelf: 'flex-end', fontSize: '0.65rem', lineHeight: 1, transform: 'rotate(180deg)' }}>10</span>
              </div>
              
              <div className="trick-card club" id="trick-c4" style={{ left: '15px', top: 'calc(50% - 37px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px', color: '#0f172a', position: 'absolute' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', lineHeight: 1 }}>A</span>
                <div style={{ fontSize: '1.4rem', textAlign: 'center', lineHeight: 1, alignSelf: 'center' }}>♣</div>
                <span style={{ alignSelf: 'flex-end', fontSize: '0.65rem', lineHeight: 1, transform: 'rotate(180deg)' }}>A</span>
              </div>

              <div className="trick-card club south-card-s1" style={{ bottom: '15px', left: 'calc(50% - 25px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px', color: '#0f172a', position: 'absolute' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', lineHeight: 1 }}>Q</span>
                <div style={{ fontSize: '1.4rem', textAlign: 'center', lineHeight: 1, alignSelf: 'center' }}>♣</div>
                <span style={{ alignSelf: 'flex-end', fontSize: '0.65rem', lineHeight: 1, transform: 'rotate(180deg)' }}>Q</span>
              </div>

              <div className="trick-card diamond south-card-s2" style={{ bottom: '15px', left: 'calc(50% - 25px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px', color: '#f43f5e', position: 'absolute' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', lineHeight: 1 }}>5</span>
                <div style={{ fontSize: '1.4rem', textAlign: 'center', lineHeight: 1, alignSelf: 'center' }}>♦</div>
                <span style={{ alignSelf: 'flex-end', fontSize: '0.65rem', lineHeight: 1, transform: 'rotate(180deg)' }}>5</span>
              </div>

              <div className="trick-card heart south-card-s3" style={{ bottom: '15px', left: 'calc(50% - 25px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px', color: '#f43f5e', position: 'absolute' }}>
                <span style={{ alignSelf: 'flex-start', fontSize: '0.65rem', lineHeight: 1 }}>7</span>
                <div style={{ fontSize: '1.4rem', textAlign: 'center', lineHeight: 1, alignSelf: 'center' }}>♥</div>
                <span style={{ alignSelf: 'flex-end', fontSize: '0.65rem', lineHeight: 1, transform: 'rotate(180deg)' }}>7</span>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className={`rules-slide-visuals ${isActive ? 'active' : ''}`} style={{ flexDirection: 'column', gap: '0.75rem' }}>
            <div id="scenario-banner" style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textAlign: 'center', width: '85%', border: '1px solid rgba(52, 211, 153, 0.08)' }}>
              <span className="scenario-text"></span>
            </div>
            
            <div className="rules-visuals-table" style={{ transform: 'scale(0.8)', transformOrigin: 'center' }}>
              <div className="seat north" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: 1.1, width: '54px', height: '54px', left: 'calc(50% - 27px)', top: '-27px' }}>
                <span>Def</span>
                <span style={{ fontWeight: 400, fontSize: '0.5rem', color: '#94a3b8' }}>Opponent</span>
              </div>
              <div className="seat east" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: 1.1, width: '54px', height: '54px', right: '-27px', top: 'calc(50% - 27px)' }}>
                <span>Prt</span>
                <span style={{ fontWeight: 400, fontSize: '0.5rem', color: '#94a3b8' }}>Partner</span>
              </div>
              <div className="seat south" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: 1.1, width: '54px', height: '54px', left: 'calc(50% - 27px)', bottom: '-27px' }}>
                <span>Bid</span>
                <span style={{ fontWeight: 400, fontSize: '0.5rem', color: '#94a3b8' }}>Bidder</span>
              </div>
              <div className="seat west" style={{ display: 'flex', flexDirection: 'column', fontSize: '0.7rem', lineHeight: 1.1, width: '54px', height: '54px', left: '-27px', top: 'calc(50% - 27px)' }}>
                <span>Def</span>
                <span style={{ fontWeight: 400, fontSize: '0.5rem', color: '#94a3b8' }}>Opponent</span>
              </div>

              {/* Popups */}
              <div className="score-popup north-score" style={{ top: '-58px', left: '50%', transform: 'translateX(-50%)', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e' }}>+80 pts</div>
              <div className="score-popup east-score" style={{ right: '-88px', top: '50%', transform: 'translateY(-50%)', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399' }}>+80 pts</div>
              <div className="score-popup south-score" style={{ bottom: '-58px', left: '50%', transform: 'translateX(-50%)', color: '#34d399', background: 'rgba(52, 211, 153, 0.15)', border: '1px solid #34d399' }}>+160 pts</div>
              <div className="score-popup west-score" style={{ left: '-88px', top: '50%', transform: 'translateY(-50%)', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e' }}>+80 pts</div>

              {/* Coins */}
              <div className="coin-to-south" style={{ top: 'calc(50% - 10px)', left: 'calc(50% - 10px)' }}></div>
              <div className="coin-to-east" style={{ top: 'calc(50% - 10px)', left: 'calc(50% - 10px)' }}></div>
              <div className="coin-to-north" style={{ top: 'calc(50% - 10px)', left: 'calc(50% - 10px)' }}></div>
              <div className="coin-to-west" style={{ top: 'calc(50% - 10px)', left: 'calc(50% - 10px)' }}></div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className={`rules-slide-visuals ${isActive ? 'active' : ''}`}>
            {/* Fireworks show */}
            <div className="rules-fw-show">
              <div className="rules-fw fw-1" style={{ top: '25%', left: '25%' }}>
                <div className="particle" style={{ '--tx': '0px', '--ty': '-60px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '42px', '--ty': '-42px', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                <div className="particle" style={{ '--tx': '60px', '--ty': '0px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '42px', '--ty': '42px', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></div>
                <div className="particle" style={{ '--tx': '0px', '--ty': '60px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '-42px', '--ty': '42px', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                <div className="particle" style={{ '--tx': '-60px', '--ty': '0px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '-42px', '--ty': '-42px', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></div>
              </div>
              
              <div className="rules-fw fw-2" style={{ top: '20%', left: '75%' }}>
                <div className="particle" style={{ '--tx': '0px', '--ty': '-60px', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }}></div>
                <div className="particle" style={{ '--tx': '42px', '--ty': '-42px', background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }}></div>
                <div className="particle" style={{ '--tx': '60px', '--ty': '0px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '42px', '--ty': '42px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '0px', '--ty': '60px', background: '#a78bfa', boxShadow: '0 0 8px #a78bfa' }}></div>
                <div className="particle" style={{ '--tx': '-42px', '--ty': '42px', background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }}></div>
                <div className="particle" style={{ '--tx': '-60px', '--ty': '0px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '-42px', '--ty': '-42px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
              </div>

              <div className="rules-fw fw-3" style={{ top: '65%', left: '20%' }}>
                <div className="particle" style={{ '--tx': '0px', '--ty': '-50px', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                <div className="particle" style={{ '--tx': '35px', '--ty': '-35px', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></div>
                <div className="particle" style={{ '--tx': '50px', '--ty': '0px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '35px', '--ty': '35px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '0px', '--ty': '50px', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                <div className="particle" style={{ '--tx': '-35px', '--ty': '35px', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></div>
                <div className="particle" style={{ '--tx': '-50px', '--ty': '0px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '-35px', '--ty': '-35px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
              </div>

              <div className="rules-fw fw-4" style={{ top: '60%', left: '80%' }}>
                <div className="particle" style={{ '--tx': '0px', '--ty': '-50px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '35px', '--ty': '-35px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '50px', '--ty': '0px', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                <div className="particle" style={{ '--tx': '35px', '--ty': '35px', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></div>
                <div className="particle" style={{ '--tx': '0px', '--ty': '50px', background: '#34d399', boxShadow: '0 0 8px #34d399' }}></div>
                <div className="particle" style={{ '--tx': '-35px', '--ty': '35px', background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
                <div className="particle" style={{ '--tx': '-50px', '--ty': '0px', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }}></div>
                <div className="particle" style={{ '--tx': '-35px', '--ty': '-35px', background: '#818cf8', boxShadow: '0 0 8px #818cf8' }}></div>
              </div>
            </div>
            <div className="rules-trophy-visual">🏆</div>
          </div>
        );
      default:
        return null;
    }
  };

  const progressPercent = (currentSlide / (totalSlides - 1)) * 100;

  return (
    <div className="rules-page-container">
      {/* Header */}
      <div className="rules-modal-header">
        <h2>
          <BookOpen size={18} style={{ color: '#fbbf24' }} />
          How to Play - Game Guide
        </h2>
        <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          Return to Lobby
        </button>
      </div>

      {/* Main Card Wrapper */}
      <div className="rules-page-body">
        <div className="rules-page-card">
          <div className="rules-modal-body">
            {renderSlideContent()}
            {renderSlideVisuals()}
          </div>

          {/* Navigation Footer */}
          <div className="rules-modal-footer">
            <button 
              onClick={handlePrev} 
              className="btn btn-secondary" 
              disabled={currentSlide === 0}
              style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {/* Progress Indicator */}
            <div style={{ flex: 1, height: '4px', background: 'rgba(255, 255, 255, 0.06)', margin: '0 1.5rem', borderRadius: '2px', position: 'relative', overflow: 'hidden' }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                background: 'linear-gradient(90deg, #818cf8, #fbbf24)',
                width: `${progressPercent}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>

            <button 
              onClick={handleNext} 
              className="btn btn-indigo"
              style={{ padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              {currentSlide === totalSlides - 1 ? 'Start Over' : 'Next'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
