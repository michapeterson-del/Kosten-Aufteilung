import { createWorker, OEM } from 'tesseract.js';
import type { Category } from './types';

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bild konnte nicht gelesen werden'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas wird nicht unterstützt'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const AMOUNT_PATTERN = /(\d{1,4}[.,]\d{2})/g;
const TOTAL_KEYWORDS = [
  'gesamt',
  'summe',
  'total',
  'endbetrag',
  'zu zahlen',
  'zahlen',
  'betrag',
];

function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/\./g, '').replace(',', '.'));
}

export function extractAmount(text: string): number | null {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const lower = lines[i].toLowerCase();
    if (TOTAL_KEYWORDS.some((k) => lower.includes(k))) {
      const matches = lines[i].match(AMOUNT_PATTERN);
      if (matches?.length) {
        const value = parseAmount(matches[matches.length - 1]);
        if (!Number.isNaN(value) && value > 0) return Math.round(value * 100) / 100;
      }
    }
  }

  const allMatches = text.match(AMOUNT_PATTERN);
  if (!allMatches?.length) return null;
  const values = allMatches
    .map(parseAmount)
    .filter((v) => !Number.isNaN(v) && v > 0 && v < 100000);
  if (values.length === 0) return null;
  return Math.round(Math.max(...values) * 100) / 100;
}

const DATE_PATTERN = /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})\b/g;

function toIsoDate(day: number, month: number, year: number): string | null {
  if (year < 100) year += 2000;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  if (year < 2000 || year > 2100) return null;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

export function extractDate(text: string): string | null {
  const matches = [...text.matchAll(DATE_PATTERN)];
  for (const m of matches) {
    const iso = toIsoDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) return iso;
  }
  return null;
}

const NON_DESCRIPTION_PATTERN = /^[\d\s.,:€$%\-/]*$/;

export function extractDescription(text: string): string | null {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 6)) {
    if (line.length < 3) continue;
    if (NON_DESCRIPTION_PATTERN.test(line)) continue;
    const cleaned = line.replace(/\s{2,}/g, ' ').slice(0, 60);
    return cleaned;
  }
  return null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  essen: [
    'supermarkt', 'markt', 'rewe', 'edeka', 'aldi', 'lidl', 'netto', 'kaufland',
    'restaurant', 'café', 'cafe', 'bäckerei', 'backerei', 'imbiss', 'pizzeria',
    'taverna', 'bar', 'bistro', 'lebensmittel', 'getränke', 'getraenke', 'metro',
    'spar', 'billa', 'hofer', 'denner', 'migros', 'coop', 'gastst',
  ],
  unterkunft: [
    'hotel', 'hostel', 'pension', 'airbnb', 'ferienwohnung', 'unterkunft',
    'camping', 'resort', 'apartment', 'zimmer',
  ],
  transport: [
    'tankstelle', 'shell', 'aral', 'esso', 'taxi', 'uber', 'bahn', 'db fahrkarte',
    'ticket', 'flug', 'airline', 'mietwagen', 'parkhaus', 'parken', 'fähre',
    'faehre', 'bus', 'ryanair',
  ],
  aktivitaeten: [
    'museum', 'eintritt', 'tour', 'ausflug', 'schwimmbad', 'freizeitpark',
    'kino', 'zoo', 'therme',
  ],
  einkaufen: [
    'boutique', 'souvenir', 'geschenke', 'kaufhaus', 'media markt', 'saturn',
    'deichmann', 'shop',
  ],
};

export function guessCategoryId(text: string, categories: Category[]): string | null {
  const lower = text.toLowerCase();

  for (const [id, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (categories.some((c) => c.id === id) && keywords.some((k) => lower.includes(k))) {
      return id;
    }
  }

  for (const category of categories) {
    const name = category.name.toLowerCase();
    if (name.length >= 4 && lower.includes(name)) return category.id;
  }

  return null;
}

export interface ScanResult {
  amount: number | null;
  date: string | null;
  description: string | null;
  categoryId: string | null;
  text?: string;
}

export async function scanReceiptImage(dataUrl: string, categories: Category[]): Promise<ScanResult> {
  const worker = await createWorker('deu', OEM.LSTM_ONLY, {
    workerPath: `${import.meta.env.BASE_URL}tesseract/worker.min.js`,
    corePath: `${import.meta.env.BASE_URL}tesseract/tesseract-core-lstm.wasm.js`,
    langPath: `${import.meta.env.BASE_URL}tessdata`,
  });
  try {
    const { data } = await worker.recognize(dataUrl);
    return {
      amount: extractAmount(data.text),
      date: extractDate(data.text),
      description: extractDescription(data.text),
      categoryId: guessCategoryId(data.text, categories),
      text: data.text,
    };
  } finally {
    await worker.terminate();
  }
}
