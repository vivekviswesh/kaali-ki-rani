import { SUITS, RANKS, RANK_VALUES, getCardPoints } from './constants.js';

export function createDeck() {
  const deck = [];
  for (const suit of Object.values(SUITS)) {
    for (const rank of Object.values(RANKS)) {
      deck.push({
        suit,
        rank,
        points: getCardPoints(rank, suit)
      });
    }
  }
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck) {
  const hands = [[], [], [], []];
  for (let i = 0; i < deck.length; i++) {
    hands[i % 4].push(deck[i]);
  }
  return hands;
}

export function sortHand(hand) {
  const suitOrder = [SUITS.SPADES, SUITS.HEARTS, SUITS.DIAMONDS, SUITS.CLUBS];
  return [...hand].sort((a, b) => {
    const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
    if (suitDiff !== 0) return suitDiff;
    return RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
  });
}

export function getHandPoints(cards) {
  return cards.reduce((sum, card) => sum + card.points, 0);
}

export function parseCard(cardString) {
  // Format like "A-S" (Ace of Spades) or "10-D"
  const parts = cardString.split('-');
  if (parts.length !== 2) return null;
  return { rank: parts[0], suit: parts[1] };
}

export function formatCard(card) {
  return `${card.rank}-${card.suit}`;
}
