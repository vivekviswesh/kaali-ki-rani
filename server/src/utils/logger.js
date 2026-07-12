import fs from 'fs';
import path from 'path';

// Bot Name Generator
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

// Log Game Event to server filesystem
export function logGameEvent(gameId, message) {
  try {
    const logDir = './logs';
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(path.join(logDir, `${gameId}.log`), logLine);
    console.log(`[${gameId}] ${message}`);
  } catch (err) {
    console.error('Failed writing game logs to file:', err.message);
  }
}
