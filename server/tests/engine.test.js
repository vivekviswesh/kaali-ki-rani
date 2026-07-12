import test from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../src/engine/game.js';
import { createDeck, formatCard, getHandPoints } from '../src/engine/deck.js';
import { GAME_STATES, SUITS, RANKS } from '../src/engine/constants.js';

// Setup mock players
const mockPlayers = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
  { id: '3', name: 'Charlie' },
  { id: '4', name: 'Dave' }
];

test('Deck generation and point count', () => {
  const deck = createDeck();
  assert.equal(deck.length, 52, 'Deck must have 52 cards');
  
  const totalPoints = getHandPoints(deck);
  assert.equal(totalPoints, 150, 'Deck total points must be 150');
});

test('Game setup and deal', () => {
  const game = new Game();
  game.startMatch(mockPlayers);
  
  assert.equal(game.players.length, 4, 'Must have 4 players');
  assert.equal(game.gameState, GAME_STATES.BIDDING, 'Game must start in bidding state');
  
  // Verify 13 cards each
  for (let i = 0; i < 4; i++) {
    assert.equal(game.hands[i].length, 13, `Player ${i} should have 13 cards`);
  }
});

test('Bidding rules - starter cannot pass and min bid is 75', () => {
  const game = new Game();
  game.startMatch(mockPlayers);
  
  const starter = game.bidStarterSeat;
  
  // Starter tries to pass
  assert.throws(() => {
    game.placeBid(starter, 'pass');
  }, /must open the bidding/, 'Starter should not be allowed to pass first');

  // Starter tries to bid 70
  assert.throws(() => {
    game.placeBid(starter, 70);
  }, /between 75 and 150/, 'Min bid must be 75');

  // Starter bids 80
  game.placeBid(starter, 80);
  assert.equal(game.biddingState.currentHighestBid, 80);
  assert.equal(game.biddingState.currentHighestBidderSeat, starter);
});

test('Bidding rules - player passes and is locked out', () => {
  const game = new Game();
  // Override bidStarterSeat for predictability
  game.bidStarterSeat = 0;
  game.startMatch(mockPlayers);
  game.bidStarterSeat = 0;
  game.activeSeat = 0;
  
  game.placeBid(0, 80); // Seat 0 bids 80
  game.placeBid(1, 'pass'); // Seat 1 passes
  game.placeBid(2, 85); // Seat 2 bids 85
  game.placeBid(3, 'pass'); // Seat 3 passes
  
  // Bidding turns back to Seat 0
  assert.equal(game.activeSeat, 0, 'Turn should skip Seat 1 and go to Seat 0');
  
  // Locked out player tries to bid
  assert.throws(() => {
    game.placeBid(1, 90);
  }, /already passed/, 'Passed player should be locked out');
});

test('Declaration and Partner check', () => {
  const game = new Game();
  game.bidStarterSeat = 0;
  game.startMatch(mockPlayers);
  game.bidStarterSeat = 0;
  game.activeSeat = 0;
  
  game.placeBid(0, 80);
  game.placeBid(1, 'pass');
  game.placeBid(2, 'pass');
  game.placeBid(3, 'pass');
  
  assert.equal(game.gameState, GAME_STATES.DECLARATION);
  assert.equal(game.partnership.bidWinnerSeat, 0);

  // Let's find a card in Seat 1's hand to name
  const partnerCard = game.hands[1][0];
  
  // Seat 0 declares Seat 1's card
  game.declare(0, partnerCard, SUITS.SPADES);
  
  assert.equal(game.gameState, GAME_STATES.TRICK_PLAY);
  assert.equal(game.declarationState.trumpSuit, SUITS.SPADES);
  assert.equal(game.partnership.actualPartnerSeat, 1);
  assert.equal(game.partnership.isSolo, false);
});

test('Follow suit rule enforcement', () => {
  const game = new Game();
  game.bidStarterSeat = 0;
  game.startMatch(mockPlayers);
  game.bidStarterSeat = 0;
  game.activeSeat = 0;
  
  game.placeBid(0, 80);
  game.placeBid(1, 'pass');
  game.placeBid(2, 'pass');
  game.placeBid(3, 'pass');
  
  // Declare partner card and trump
  const cardInHand1 = game.hands[1][0];
  game.declare(0, cardInHand1, SUITS.HEARTS);
  
  // Seat 0 plays lead card
  const leadCard = game.hands[0][0];
  game.playCard(0, leadCard);
  
  // Seat 1 plays. Let's make sure Seat 1 plays an off-suit card ONLY if void in leadCard's suit
  const hasLeadSuit = game.hands[1].some(c => c.suit === leadCard.suit);
  const offSuitCard = game.hands[1].find(c => c.suit !== leadCard.suit);
  
  if (hasLeadSuit && offSuitCard) {
    assert.throws(() => {
      game.playCard(1, offSuitCard);
    }, /Must follow suit/, 'Should enforce follow suit');
  }
});

test('Scoring calculations - Partnership Success', () => {
  const game = new Game();
  game.players = mockPlayers.map((p, idx) => ({ ...p, seat: idx, score: 0 }));
  game.gameState = GAME_STATES.TRICK_PLAY;
  game.biddingState.currentHighestBid = 80;
  game.partnership.bidWinnerSeat = 0;
  game.partnership.actualPartnerSeat = 1;
  game.partnership.isSolo = false;
  
  // Mock handPoints
  game.handPoints = [50, 40, 30, 30]; // 50 + 40 = 90 (which is >= 80)
  
  game.resolveHand();
  
  assert.equal(game.players[0].score, 160, 'Bid winner should get 2x bid');
  assert.equal(game.players[1].score, 80, 'Partner should get 1x bid');
  assert.equal(game.players[2].score, 0, 'Opponents get 0');
  assert.equal(game.players[3].score, 0, 'Opponents get 0');
});

test('Scoring calculations - Solo Failure', () => {
  const game = new Game();
  game.players = mockPlayers.map((p, idx) => ({ ...p, seat: idx, score: 0 }));
  game.gameState = GAME_STATES.TRICK_PLAY;
  game.biddingState.currentHighestBid = 90;
  game.partnership.bidWinnerSeat = 0;
  game.partnership.actualPartnerSeat = 0;
  game.partnership.isSolo = true;
  
  game.handPoints = [85, 25, 20, 20]; // Solo player has 85, fails bid of 90
  
  game.resolveHand();
  
  assert.equal(game.players[0].score, 0, 'Solo bidder failed, scores 0');
  assert.equal(game.players[1].score, 90, 'Opponent scores full bid');
  assert.equal(game.players[2].score, 90, 'Opponent scores full bid');
  assert.equal(game.players[3].score, 90, 'Opponent scores full bid');
});
