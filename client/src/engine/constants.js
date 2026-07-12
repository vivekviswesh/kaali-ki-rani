export const SUITS = {
  SPADES: 'S',
  HEARTS: 'H',
  DIAMONDS: 'D',
  CLUBS: 'C'
};

export const SUIT_NAMES = {
  [SUITS.SPADES]: 'Spades',
  [SUITS.HEARTS]: 'Hearts',
  [SUITS.DIAMONDS]: 'Diamonds',
  [SUITS.CLUBS]: 'Clubs'
};

export const RANKS = {
  TWO: '2',
  THREE: '3',
  FOUR: '4',
  FIVE: '5',
  SIX: '6',
  SEVEN: '7',
  EIGHT: '8',
  NINE: '9',
  TEN: '10',
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  ACE: 'A'
};

export const RANK_VALUES = {
  [RANKS.TWO]: 2,
  [RANKS.THREE]: 3,
  [RANKS.FOUR]: 4,
  [RANKS.FIVE]: 5,
  [RANKS.SIX]: 6,
  [RANKS.SEVEN]: 7,
  [RANKS.EIGHT]: 8,
  [RANKS.NINE]: 9,
  [RANKS.TEN]: 10,
  [RANKS.JACK]: 11,
  [RANKS.QUEEN]: 12,
  [RANKS.KING]: 13,
  [RANKS.ACE]: 14
};

export const GAME_STATES = {
  LOBBY: 'LOBBY',
  BIDDING: 'BIDDING',
  DECLARATION: 'DECLARATION',
  TRICK_PLAY: 'TRICK_PLAY',
  HAND_OVER: 'HAND_OVER',
  MATCH_OVER: 'MATCH_OVER'
};

export const MIN_BID = 75;
export const MAX_BID = 150;
export const TOTAL_POINTS = 150;
export const WINNING_SCORE = 1000;

export function getCardPoints(rank, suit) {
  if (suit === SUITS.SPADES && rank === RANKS.QUEEN) {
    return 30; // Kaali Ki Rani (Queen of Spades)
  }
  if (rank === RANKS.ACE) {
    return 15;
  }
  if (rank === RANKS.TEN) {
    return 10;
  }
  if (rank === RANKS.FIVE) {
    return 5;
  }
  return 0;
}
