import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';
import { Copy, Check } from 'lucide-react';

import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import BiddingPanel from './components/BiddingPanel';
import DeclarationOverlay from './components/DeclarationOverlay';
import Scoreboard from './components/Scoreboard';

import { Game } from './engine/game.js';
import { GAME_STATES } from './engine/constants.js';
import { makeBotBid, makeBotDeclaration, makeBotPlay } from './engine/bot.js';
import { generateBotName, logClientEvent, getClientLogs } from './engine/logger.js';

// Resolve Server URL with local dev fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  // Game Setup States
  const [inGame, setInGame] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  
  // Game State Sync
  const [roomCode, setRoomCode] = useState('');
  const [gameId, setGameId] = useState('');
  const [mySeat, setMySeat] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [timerState, setTimerState] = useState(null);
  
  // Clipboard feedback
  const [copied, setCopied] = useState(false);
  
  // HUD Feed Log
  const [actionLog, setActionLog] = useState([]);
  
  // Sockets & Engine refs
  const socketRef = useRef(null);
  const localGameRef = useRef(null);
  const botTimerRef = useRef(null);

  // Confetti celebrations
  const triggerConfettiSuccess = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const triggerConfettiMatchWin = () => {
    const duration = 4 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  // Check state transitions to play confetti
  useEffect(() => {
    if (!gameState) return;
    
    if (gameState.gameState === GAME_STATES.HAND_OVER) {
      const bidVal = gameState.biddingState.currentHighestBid;
      const bidWinner = gameState.partnership.bidWinnerSeat;
      const partner = gameState.partnership.partnerSeat;
      const isSolo = gameState.partnership.isSolo;
      
      const biddingPoints = gameState.handPoints[bidWinner] + (isSolo ? 0 : (partner !== null ? gameState.handPoints[partner] : 0));
      if (biddingPoints >= bidVal) {
        triggerConfettiSuccess();
      }
    } else if (gameState.gameState === GAME_STATES.MATCH_OVER) {
      triggerConfettiMatchWin();
    }
  }, [gameState?.gameState]);

  // SINGLE PLAYER BOT AUTO-PLAY ENGINE
  const runLocalBotTurn = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    const game = localGameRef.current;
    if (!game || game.gameState === GAME_STATES.MATCH_OVER || game.gameState === GAME_STATES.LOBBY) return;

    const activeSeat = game.activeSeat;
    const activePlayer = game.players[activeSeat];

    if (activePlayer && activePlayer.isBot) {
      botTimerRef.current = setTimeout(() => {
        const state = game.gameState;
        const hand = game.hands[activeSeat];
        let logMessage = '';

        try {
          if (state === GAME_STATES.BIDDING) {
            const bid = makeBotBid(hand, game.biddingState.currentHighestBid, activeSeat === game.bidStarterSeat);
            game.placeBid(activeSeat, bid);
            logMessage = `${activePlayer.name} ${bid === 'pass' ? 'passed' : 'bid ' + bid}`;
            logClientEvent(gameId, `Bid action: ${logMessage}`);
          } else if (state === GAME_STATES.DECLARATION) {
            const dec = makeBotDeclaration(hand);
            game.declare(activeSeat, dec.partnerCard, dec.trumpSuit);
            logMessage = `${activePlayer.name} declared Trump: ${dec.trumpSuit}, Partner Card: ${dec.partnerCard.rank}-${dec.partnerCard.suit}`;
            logClientEvent(gameId, `Declaration action: ${logMessage}`);
          } else if (state === GAME_STATES.TRICK_PLAY) {
            const currentTrick = game.trickPlayState.currentTrick;
            const trumpSuit = game.declarationState.trumpSuit;
            const partnerCard = game.declarationState.partnerCard;
            const partnerSeat = game.partnership.partnerSeat;
            const bidWinnerSeat = game.partnership.bidWinnerSeat;

            let cardToPlay = null;
            
            // Fail-safe bot card play evaluation
            try {
              cardToPlay = makeBotPlay(hand, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, activeSeat);
              if (!cardToPlay) {
                throw new Error('makeBotPlay returned null card.');
              }
            } catch (botErr) {
              // Backup fail-safe: Play the first legal card in their hand to avoid hangs!
              const leadCard = currentTrick.length > 0 ? currentTrick[0].card : null;
              const legalCards = hand.filter(c => !leadCard || c.suit === leadCard.suit);
              const choices = legalCards.length > 0 ? legalCards : hand;
              cardToPlay = choices[0];
              
              logClientEvent(gameId, `[FAIL-SAFE] Bot ${activePlayer.name} play calculation failed: "${botErr.message}". Playing first legal card: ${cardToPlay.rank}-${cardToPlay.suit}`);
            }

            const partnerCardStr = `${partnerCard.rank}-${partnerCard.suit}`;
            const playedCardStr = `${cardToPlay.rank}-${cardToPlay.suit}`;
            const isPartnerCard = partnerCardStr === playedCardStr;

            game.playCard(activeSeat, cardToPlay);
            logMessage = `${activePlayer.name} played ${playedCardStr}`;
            logClientEvent(gameId, `Play action: ${logMessage}`);

            if (isPartnerCard) {
              logClientEvent(gameId, `Partner Card Played by ${activePlayer.name}.`);
              setActionLog(prev => [...prev, `Partner Revealed! ${activePlayer.name} holds the Partner Card.`]);
            }
          }

          setActionLog(prev => [...prev, logMessage]);
          setGameState(game.getStateForPlayer(0)); // sync player 0 view
        } catch (err) {
          logClientEvent(gameId, `CRITICAL ERROR in local bot turn: ${err.message}`);
        }
      }, 1000);
    }
  };

  // Bot Turn trigger hook (Single Player only)
  useEffect(() => {
    if (isSinglePlayer && gameState) {
      const activeSeat = gameState.activeSeat;
      const activePlayer = gameState.players[activeSeat];
      if (activePlayer && activePlayer.isBot && gameState.gameState !== GAME_STATES.HAND_OVER) {
        runLocalBotTurn();
      }
    }
    return () => {
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
  }, [gameState?.activeSeat, gameState?.gameState, isSinglePlayer]);

  // SINGLE PLAYER ACTIONS
  const startSinglePlayer = (name) => {
    setPlayerName(name);
    setIsSinglePlayer(true);
    setInGame(true);
    setMySeat(0);
    setActionLog(['Match started against bots! Good luck.']);

    // Generate unique local Game ID
    const p1 = Math.random().toString(36).substr(2, 4).toUpperCase();
    const p2 = Math.random().toString(36).substr(2, 4).toUpperCase();
    const localId = `KKR-${p1}-${p2}`;
    setGameId(localId);

    // Generate funny card-suit themed bot names
    const bot1Name = generateBotName();
    let bot2Name = generateBotName();
    while (bot2Name === bot1Name) bot2Name = generateBotName();
    let bot3Name = generateBotName();
    while (bot3Name === bot1Name || bot3Name === bot2Name) bot3Name = generateBotName();

    const localPlayers = [
      { id: 'human-0', name: name, isBot: false },
      { id: 'bot-1', name: bot1Name, isBot: true },
      { id: 'bot-2', name: bot2Name, isBot: true },
      { id: 'bot-3', name: bot3Name, isBot: true }
    ];

    logClientEvent(localId, `Starting offline match. Bots: ${bot1Name}, ${bot2Name}, ${bot3Name}`);

    const game = new Game();
    localGameRef.current = game;
    game.startMatch(localPlayers);

    setGameState(game.getStateForPlayer(0));
  };

  const handleLocalAction = (type, data) => {
    const game = localGameRef.current;
    if (!game) return;

    try {
      if (type === 'bid') {
        game.placeBid(0, data.bid);
        logClientEvent(gameId, `You ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`);
        setActionLog(prev => [...prev, `You ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`]);
      } else if (type === 'declare') {
        game.declare(0, data.partnerCard, data.trumpSuit);
        logClientEvent(gameId, `You declared Trump: ${data.trumpSuit}, Partner Card: ${data.partnerCard.rank}-${data.partnerCard.suit}`);
        setActionLog(prev => [...prev, `You declared Trump: ${data.trumpSuit}, Partner Card: ${data.partnerCard.rank}-${data.partnerCard.suit}`]);
      } else if (type === 'play_card') {
        const card = data.card;
        const partnerCard = game.declarationState.partnerCard;
        const isPartnerCard = partnerCard && (card.rank === partnerCard.rank && card.suit === partnerCard.suit);

        game.playCard(0, card);
        logClientEvent(gameId, `You played ${card.rank}-${card.suit}`);
        setActionLog(prev => [...prev, `You played ${card.rank}-${card.suit}`]);

        if (isPartnerCard) {
          logClientEvent(gameId, `You played the Partner Card.`);
          setActionLog(prev => [...prev, `Partner Revealed! You hold the Partner Card.`]);
        }
      } else if (type === 'next_hand') {
        logClientEvent(gameId, `Starting Hand #${game.handCount + 1}`);
        game.startHand();
        setActionLog(prev => [...prev, 'Next hand started!']);
      }

      setGameState(game.getStateForPlayer(0));
    } catch (err) {
      alert(err.message);
    }
  };

  // MULTIPLAYER (ONLINE) SYSTEM
  const createOnlineRoom = (name, settings) => {
    setPlayerName(name);
    setIsSinglePlayer(false);
    
    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('create_room', { playerName: name, settings }, (res) => {
      if (res.status === 'success') {
        setRoomCode(res.roomCode);
        setMySeat(res.seat);
        setInGame(true);
        setActionLog([`Room created! Code: ${res.roomCode}. Share it to let players join.`]);
      } else {
        alert(res.message);
        socket.disconnect();
      }
    });

    setupSocketListeners(socket);
  };

  const joinOnlineRoom = (name, code) => {
    setPlayerName(name);
    setIsSinglePlayer(false);

    const socket = io(SERVER_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.emit('join_room', { roomCode: code, playerName: name }, (res) => {
      if (res.status === 'success') {
        setRoomCode(res.roomCode);
        setMySeat(res.seat);
        setInGame(true);
        setActionLog([`Joined Room ${res.roomCode}! Waiting for players...`]);
      } else {
        alert(res.message);
        socket.disconnect();
      }
    });

    setupSocketListeners(socket);
  };

  const setupSocketListeners = (socket) => {
    socket.on('state_update', (data) => {
      setGameState(data.gameState);
      setRoomCode(data.roomCode);
      setGameId(data.gameId);
    });

    socket.on('timer_update', (data) => {
      setTimerState(data);
    });

    socket.on('game_action', (data) => {
      setActionLog(prev => [...prev, data.message]);
    });

    socket.on('partner_revealed', (data) => {
      setActionLog(prev => [...prev, data.message]);
    });

    socket.on('disconnect', () => {
      setActionLog(prev => [...prev, 'Disconnected from server. Try refreshing.']);
    });
  };

  const handleOnlineAction = (type, data) => {
    if (socketRef.current) {
      socketRef.current.emit('game_action', { type, data });
    }
  };

  const startOnlineGame = () => {
    if (socketRef.current) {
      socketRef.current.emit('start_game');
    }
  };

  const leaveGame = () => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    localGameRef.current = null;
    setInGame(false);
    setIsSinglePlayer(false);
    setGameState(null);
    setTimerState(null);
    setActionLog([]);
    setGameId('');
  };

  const handleAction = (type, data) => {
    if (isSinglePlayer) {
      handleLocalAction(type, data);
    } else {
      handleOnlineAction(type, data);
    }
  };

  // Copy Logs helper
  const copyLogs = () => {
    const logs = getClientLogs(gameId);
    const textToCopy = `Game ID: ${gameId}\nPlayer Seat: ${mySeat}\nMode: ${isSinglePlayer ? 'Offline' : 'Online'}\n\nClient Logs:\n${logs}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex-col" style={{ minHeight: '100vh', justifyContent: 'space-between', background: '#020617' }}>
      
      {!inGame ? (
        <Lobby
          onCreateRoom={createOnlineRoom}
          onJoinRoom={joinOnlineRoom}
          onStartSinglePlayer={startSinglePlayer}
        />
      ) : (
        <div className="flex-col animate-pop-in" style={{ width: '100%', maxWidth: '100%', padding: '0.75rem', gap: '0.75rem' }}>
          
          {/* Header Bar */}
          <header className="app-header-bar glass-panel" style={{ borderRadius: '1rem' }}>
            <div className="flex-row items-center" style={{ gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>👑</span>
              <span style={{ 
                fontWeight: 900, 
                letterSpacing: '0.05em', 
                background: 'linear-gradient(135deg, #fbbf24 0%, #34d399 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontSize: '1.1rem'
              }}>
                KAALI KI RANI
              </span>
            </div>
            
            {/* Game ID & Copy Log Button */}
            {gameId && (
              <div className="flex-row items-center font-bold" style={{ gap: '0.375rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                <span>ID:</span>
                <span style={{ color: '#fbbf24', fontFamily: 'monospace', background: 'rgba(2, 6, 23, 0.4)', padding: '0.125rem 0.375rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {gameId}
                </span>
                <button 
                  onClick={copyLogs}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '4px',
                    padding: '0.125rem 0.375rem',
                    color: copied ? '#10b981' : '#f8fafc',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title="Copy Game Log"
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  <span>{copied ? 'Copied' : 'Logs'}</span>
                </button>
              </div>
            )}

            {roomCode ? (
              <div className="flex-row items-center" style={{ gap: '0.375rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Room:</span>
                <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                  {roomCode}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem' }}>
                Offline Play
              </span>
            )}
          </header>

          {/* Lobby Waiting Panel (Only online before start) */}
          {gameState && gameState.gameState === GAME_STATES.LOBBY && (
            <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '440px', margin: '3rem auto', padding: '2rem', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                background: 'rgba(2, 6, 23, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 1rem'
              }}>👥</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>Room Lobby</h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '1.5rem' }}>
                Waiting for players to join. You can fill remaining empty slots with bots and start playing!
              </p>

              <div className="flex-col" style={{ background: 'rgba(2, 6, 23, 0.6)', borderRadius: '1rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.04)', marginBottom: '1.5rem', textAlign: 'left', fontSize: '0.75rem', gap: '0.5rem' }}>
                <span style={{ color: '#64748b', fontStyle: 'normal', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', display: 'block' }}>Players Connected</span>
                {gameState.players.map((p, idx) => (
                  <div key={idx} className="justify-between" style={{ color: '#cbd5e1', fontWeight: 600 }}>
                    <span>{p.name}</span>
                    <span style={{ color: '#10b981' }}>Connected</span>
                  </div>
                ))}
                {Array.from({ length: 4 - gameState.players.length }).map((_, i) => (
                  <div key={i} style={{ color: '#475569', fontStyle: 'italic' }}>Empty Slot (will be filled with Bot)</div>
                ))}
              </div>

              {gameState.players[0]?.id === socketRef.current?.id || mySeat === 0 ? (
                <button
                  onClick={startOnlineGame}
                  className="btn btn-success"
                  style={{ width: '100%', padding: '0.875rem' }}
                >
                  Start Match (Fill Bots)
                </button>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>Only the host can start the match.</p>
              )}
            </div>
          )}

          {/* Core Game UI Grid */}
          {gameState && gameState.gameState !== GAME_STATES.LOBBY && (
            <div className="game-grid-system">
              {/* Central Game Board */}
              <div className="flex-col" style={{ gap: '1rem' }}>
                <GameBoard
                  gameState={gameState}
                  mySeat={mySeat}
                  onPlayCard={(card) => handleAction('play_card', { card })}
                  onLeave={leaveGame}
                  timerState={timerState}
                  actionLog={actionLog}
                  scoreboardWidget={
                    <Scoreboard
                      gameState={gameState}
                      mySeat={mySeat}
                      onAction={handleAction}
                      onBackToLobby={leaveGame}
                    />
                  }
                  biddingWidget={
                    gameState.gameState === GAME_STATES.BIDDING && (
                      <BiddingPanel
                        gameState={gameState}
                        mySeat={mySeat}
                        onBid={(bid) => handleAction('bid', { bid })}
                      />
                    )
                  }
                  declarationWidget={
                    gameState.gameState === GAME_STATES.DECLARATION && (
                      <DeclarationOverlay
                        gameState={gameState}
                        mySeat={mySeat}
                        onDeclare={(dec) => handleAction('declare', dec)}
                      />
                    )
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer copyright */}
      <footer style={{ padding: '0.5rem 0', textAlign: 'center', fontSize: '9px', color: '#475569' }}>
        Kaali Ki Rani PWA © 2026. Made with ❤️ for card game lovers.
      </footer>
    </div>
  );
}
