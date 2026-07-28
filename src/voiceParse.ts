import type { Category, Person } from './types';
import { guessCategoryId } from './receiptScan';

export interface VoiceParseResult {
  description: string | null;
  amount: number | null;
  categoryId: string | null;
  splitBetweenIds: string[] | null;
  splitWarning: boolean;
}

const ORDINAL_SPLIT_WORDS: Record<string, number> = {
  zweit: 2,
  dritt: 3,
  viert: 4,
  fünft: 5,
  fuenft: 5,
  sechst: 6,
  siebt: 7,
  acht: 8,
  neunt: 9,
  zehnt: 10,
};

const CARDINAL_WORDS: Record<string, number> = {
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  fuenf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
};

function extractSplitCount(lower: string): number | null {
  let m = lower.match(/\bzu (\p{L}+)\b/u);
  if (m && ORDINAL_SPLIT_WORDS[m[1]]) return ORDINAL_SPLIT_WORDS[m[1]];

  m = lower.match(/\bdurch (\d+)\b/);
  if (m) return parseInt(m[1], 10);
  m = lower.match(/\bdurch (\p{L}+)\b/u);
  if (m && CARDINAL_WORDS[m[1]]) return CARDINAL_WORDS[m[1]];

  m = lower.match(/\bauf (\d+) personen\b/);
  if (m) return parseInt(m[1], 10);
  m = lower.match(/\bauf (\p{L}+) personen\b/u);
  if (m && CARDINAL_WORDS[m[1]]) return CARDINAL_WORDS[m[1]];

  return null;
}

export function parseVoiceCommand(
  transcript: string,
  people: Person[],
  categories: Category[],
): VoiceParseResult {
  const lower = transcript.toLowerCase();

  let amount: number | null = null;
  let amountMatchText = '';
  const amountMatch = lower.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|euro)/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
    amountMatchText = amountMatch[0];
  }

  const matchedPeople = people.filter((p) => p.name.length >= 2 && lower.includes(p.name.toLowerCase()));
  let splitBetweenIds: string[] | null = null;
  let splitWarning = false;

  if (matchedPeople.length > 0) {
    splitBetweenIds = matchedPeople.map((p) => p.id);
  } else if (/\balle\b/.test(lower)) {
    splitBetweenIds = people.map((p) => p.id);
  } else {
    const count = extractSplitCount(lower);
    if (count) {
      if (count >= people.length) {
        splitBetweenIds = people.map((p) => p.id);
      } else {
        splitBetweenIds = people.slice(0, count).map((p) => p.id);
        splitWarning = true;
      }
    }
  }

  let working = lower;
  if (amountMatchText) working = working.replace(amountMatchText, ' ');
  matchedPeople.forEach((p) => {
    working = working.replace(new RegExp(p.name, 'gi'), ' ');
  });
  working = working
    .replace(/\bzu \p{L}+\b/giu, ' ')
    .replace(/\bdurch (\d+|\p{L}+)\b/giu, ' ')
    .replace(/\bauf (\d+|\p{L}+) personen\b/giu, ' ')
    .replace(/\b(aufteilen|aufgeteilt|geteilt|teilen|alle|bezahlt)\b/gi, ' ')
    .replace(/[,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const description = working ? working.charAt(0).toUpperCase() + working.slice(1) : null;
  const categoryId = guessCategoryId(transcript, categories);

  return { description, amount, categoryId, splitBetweenIds, splitWarning };
}
