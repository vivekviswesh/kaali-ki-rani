import React, { useState, useEffect } from 'react';
import { ArrowUp, CornerDownRight } from 'lucide-react';

export default function BiddingPanel({ gameState, mySeat, onBid }) {
  const { biddingState, activeSeat, players, bidStarterSeat } = gameState;
  const { currentHighestBid, currentHighestBidderSeat, history } = biddingState;

  const isActive = activeSeat === mySeat;
  const isBidStarter = mySeat === bidStarterSeat;
  const hasNoBids = currentHighestBid === 0;
  
  // Calculate minimum legal bid
  const minLegalBid = hasNoBids ? 75 : currentHighestBid + 5;
  const [selectedBid, setSelectedBid] = useState(minLegalBid);

  // Sync selectedBid when minLegalBid changes
  useEffect(() => {
    setSelectedBid(minLegalBid);
  }, [minLegalBid]);

  const handleSubmitBid = (e) => {
    e.preventDefault();
    if (selectedBid > 150) return;
    onBid(selectedBid);
  };

  const handlePass = () => {
    onBid('pass');
  };

  const activePlayerName = players[activeSeat]?.name || 'Player';
  const highestBidderName = currentHighestBidderSeat !== null ? players[currentHighestBidderSeat]?.name : 'None';

  return (
    <div className="glass-panel animate-pop-in" style={{ width: '100%', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.06)' }}>
      
      {/* Current Bid Display */}
      <div className="flex-row justify-between items-center" style={{ background: 'rgba(2, 6, 23, 0.6)', borderRadius: '0.75rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1rem' }}>
        <div className="flex-col">
          <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Highest Bid</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24' }}>
            {hasNoBids ? 'No Bid' : `${currentHighestBid} pts`}
          </span>
        </div>
        {currentHighestBidderSeat !== null && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bidder</span>
            <span style={{ display: 'inline-block', color: '#f8fafc', fontWeight: 700, fontSize: '0.75rem', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', px: '0.5rem', padding: '0.125rem 0.5rem', borderRadius: '0.5rem', marginTop: '0.125rem' }}>
              {highestBidderName}
            </span>
          </div>
        )}
      </div>

      {/* Bidding History Log */}
      <div className="flex-col" style={{ background: 'rgba(2, 6, 23, 0.4)', borderRadius: '0.75rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.04)', height: '120px', overflowY: 'auto', marginBottom: '1rem' }}>
        <span style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Bidding History</span>
        
        {history.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '0.75rem', textAlign: 'center', margin: 'auto 0', padding: '1rem 0' }}>
            No bids placed yet. Bidding starts with {players[bidStarterSeat]?.name}.
          </div>
        ) : (
          <div className="flex-col" style={{ gap: '0.375rem' }}>
            {history.map((h, i) => {
              const bidder = players[h.seat];
              const isPass = h.bid === 'pass';
              return (
                <div key={i} className="flex-row justify-between items-center" style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                  <span className="flex-row items-center" style={{ gap: '0.25rem' }}>
                    <CornerDownRight size={10} style={{ color: '#475569' }} />
                    <span style={{ fontWeight: 500 }}>{bidder?.name}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: isPass ? '#64748b' : '#34d399' }}>
                    {isPass ? 'Pass' : `Bid ${h.bid}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div>
        {isActive ? (
          <div className="flex-col" style={{ gap: '0.75rem' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Turn to Bid</span>
            </div>

            <form onSubmit={handleSubmitBid} className="flex-col" style={{ gap: '1rem' }}>
              {/* Bid Selector (Slider) */}
              {selectedBid <= 150 ? (
                <div className="form-slider-container flex-col" style={{ gap: '0.5rem' }}>
                  <div className="flex-row justify-between items-center">
                    <span style={{ color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 600 }}>Your Bid:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981' }}>{selectedBid}</span>
                  </div>
                  <input
                    type="range"
                    min={minLegalBid}
                    max={150}
                    step={5}
                    value={selectedBid}
                    onChange={(e) => setSelectedBid(parseInt(e.target.value, 10))}
                    className="form-slider"
                  />
                  <div className="flex-row justify-between" style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 700 }}>
                    <span>MIN: {minLegalBid}</span>
                    <span>MAX: 150</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', padding: '0.75rem', background: 'rgba(2, 6, 23, 0.4)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  Bid limit of 150 reached. You must pass.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex-row" style={{ gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handlePass}
                  disabled={isBidStarter && hasNoBids}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.75rem' }}
                >
                  Pass
                </button>
                {selectedBid <= 150 && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    <ArrowUp size={14} style={{ marginRight: '0.25rem' }} />
                    Bid {selectedBid}
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '0.75rem 0', background: 'rgba(2, 6, 23, 0.3)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0.75rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            Waiting for <span style={{ color: '#818cf8' }}>{activePlayerName}</span> to act...
          </div>
        )}
      </div>

    </div>
  );
}
