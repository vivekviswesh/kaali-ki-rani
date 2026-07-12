// Client-side Bot Name Generator
const PREFIXES = [
  'spade', 'heart', 'diamond', 'club', 'ace', 'king', 'queen', 'jack', 'joker',
  'trump', 'trick', 'bid', 'shuffle', 'deal', 'deck', 'flush', 'kaali', 'rani'
];

const NOUNS = [
  'shark', 'bandit', 'sandwich', 'monster', 'ninja', 'jester', 'wizard', 'pirate',
  'sheriff', 'gambler', 'breaker', 'miner', 'hoarder', 'bluffer', 'hunter', 'ranger'
];

export function generateBotName() {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${p}_${n}_bot`;
}

// Client-side Log Capturer (Saves logs under the gameId in localStorage)
export function logClientEvent(gameId, message) {
  try {
    const timestamp = new Date().toISOString().substring(11, 19); // HH:MM:SS format
    const logLine = `[${timestamp}] ${message}`;
    
    // Print to browser developer console
    console.log(`[${gameId}] ${message}`);

    // Retrieve previous logs for this game
    const key = `kkr_gamelog_${gameId}`;
    const existingLogs = JSON.parse(localStorage.getItem(key) || '[]');
    existingLogs.push(logLine);
    
    localStorage.setItem(key, JSON.stringify(existingLogs));
  } catch (err) {
    console.error('Failed writing client logs to localStorage:', err.message);
  }
}

// Helper to retrieve logs for export
export function getClientLogs(gameId) {
  try {
    const key = `kkr_gamelog_${gameId}`;
    const logs = JSON.parse(localStorage.getItem(key) || '[]');
    return logs.join('\n');
  } catch (err) {
    return 'Failed to retrieve logs.';
  }
}
