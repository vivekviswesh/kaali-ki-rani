import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import confetti from 'canvas-confetti';

import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';
import BiddingPanel from './components/BiddingPanel';
import DeclarationOverlay from './components/DeclarationOverlay';
import Scoreboard from './components/Scoreboard';

import { Game } from './engine/game.js';
import { GAME_STATES } from './engine/constants.js';
import { makeBotBid, makeBotDeclaration, makeBotPlay } from './engine/bot.js';

// Resolve Server URL with local dev fallback
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  // Game Setup States
  const [inGame, setInGame] = useState(false);
  const [isSinglePlayer, setIsSinglePlayer] = useState(false);
  const [playerName, setPlayerName] = useState('Player');
  
  // Game State Sync
  const [roomCode, setRoomCode] = useState('');
  const [mySeat, setMySeat] = useState(0);
  const [gameState, setGameState] = useState(null);
  const [timerState, setTimerState] = useState(null);
  
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
      // Check if bidding team succeeded
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
          } else if (state === GAME_STATES.DECLARATION) {
            const dec = makeBotDeclaration(hand);
            game.declare(activeSeat, dec.partnerCard, dec.trumpSuit);
            logMessage = `${activePlayer.name} declared Trump: ${dec.trumpSuit}, Partner Card: ${dec.partnerCard.rank}-${dec.partnerCard.suit}`;
          } else if (state === GAME_STATES.TRICK_PLAY) {
            const currentTrick = game.trickPlayState.currentTrick;
            const trumpSuit = game.declarationState.trumpSuit;
            const partnerCard = game.declarationState.partnerCard;
            const partnerSeat = game.partnership.partnerSeat;
            const bidWinnerSeat = game.partnership.bidWinnerSeat;

            const cardToPlay = makeBotPlay(hand, currentTrick, trumpSuit, partnerCard, partnerSeat, bidWinnerSeat, activeSeat);
            
            const partnerCardStr = `${partnerCard.rank}-${partnerCard.suit}`;
            const playedCardStr = `${cardToPlay.rank}-${cardToPlay.suit}`;
            const isPartnerCard = partnerCardStr === playedCardStr;

            game.playCard(activeSeat, cardToPlay);
            logMessage = `${activePlayer.name} played ${playedCardStr}`;

            if (isPartnerCard) {
              setActionLog(prev => [...prev, `Partner Revealed! ${activePlayer.name} holds the Partner Card.`]);
            }
          }

          setActionLog(prev => [...prev, logMessage]);
          setGameState(game.getStateForPlayer(0)); // sync player 0 view
        } catch (err) {
          console.error('Local bot action error:', err);
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

    const localPlayers = [
      { id: 'human-0', name: name, isBot: false },
      { id: 'bot-1', name: 'Rani Bot', isBot: true },
      { id: 'bot-2', name: 'Kaali Bot', isBot: true },
      { id: 'bot-3', name: 'Spade Bot', isBot: true }
    ];

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
        setActionLog(prev => [...prev, `You ${data.bid === 'pass' ? 'passed' : 'bid ' + data.bid}`]);
      } else if (type === 'declare') {
        game.declare(0, data.partnerCard, data.trumpSuit);
        setActionLog(prev => [...prev, `You declared Trump: ${data.trumpSuit}, Partner Card: ${data.partnerCard.rank}-${data.partnerCard.suit}`]);
      } else if (type === 'play_card') {
        const card = data.card;
        const partnerCard = game.declarationState.partnerCard;
        const isPartnerCard = partnerCard && (card.rank === partnerCard.rank && card.suit === partnerCard.suit);

        game.playCard(0, card);
        setActionLog(prev => [...prev, `You played ${card.rank}-${card.suit}`]);

        if (isPartnerCard) {
          setActionLog(prev => [...prev, `Partner Revealed! You hold the Partner Card.`]);
        }
      } else if (type === 'next_hand') {
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
  };

  const handleAction = (type, data) => {
    if (isSinglePlayer) {
      handleLocalAction(type, data);
    } else {
      handleOnlineAction(type, data);
    }
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
        <div className="flex-col animate-pop-in" style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '1rem', gap: '1rem' }}>
          
          {/* Header Bar */}
          <header className="app-header-bar glass-panel">
            <div className="flex-row items-center" style={{ gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem' }}>👑</span>
              <span style={{ 
                fontWeight: 900, 
                letterSpacing: '0.05em', 
                background: 'linear-gradient(135deg, #fbbf24 0%, #34d399 100%)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                fontSize: '1rem'
              }}>
                KAALI KI RANI
              </span>
            </div>
            
            {roomCode ? (
              <div className="flex-row items-center" style={{ gap: '0.5rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Room:</span>
                <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '0.25rem 0.75rem', borderRadius: '0.75rem', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.1em' }}>
                  {roomCode}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 800, textTransform: 'uppercase', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.2)', padding: '0.25rem 0.75rem', borderRadius: '0.75rem' }}>
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
                />
              </div>

              {/* Sidebar Panel containing Scoreboard, Bidding or Declarations */}
              <div className="flex-col" style={{ gap: '1rem' }}>
                {/* 1. Scoreboard (Always visible in-game) */}
                <Scoreboard
                  gameState={gameState}
                  mySeat={mySeat}
                  onAction={handleAction}
                  onBackToLobby={leaveGame}
                />

                {/* 2. Bidding Controls Overlay (Visible in sidebar when bidding) */}
                {gameState.gameState === GAME_STATES.BIDDING && (
                  <BiddingPanel
                    gameState={gameState}
                    mySeat={mySeat}
                    onBid={(bid) => handleAction('bid', { bid })}
                  />
                )}

                {/* 3. Declaration overlay (For bid winner selection) */}
                {gameState.gameState === GAME_STATES.DECLARATION && (
                  <DeclarationOverlay
                    gameState={gameState}
                    mySeat={mySeat}
                    onDeclare={(dec) => handleAction('declare', dec)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer copyright */}
      <footer style={{ py: '1rem', padding: '1rem 0', textAlign: 'center', fontSize: '10px', color: '#475569' }}>
        Kaali Ki Rani PWA © 2026. Made with ❤️ for card game lovers.
      </footer>
    </div>
  );
}
