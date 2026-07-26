import { createWorker, OEM } from 'tesseract.js';

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

export interface ScanResult {
  amount: number | null;
  text: string;
}

export async function scanReceiptImage(dataUrl: string): Promise<ScanResult> {
  const worker = await createWorker('deu', OEM.LSTM_ONLY, {
    workerPath: `${import.meta.env.BASE_URL}tesseract/worker.min.js`,
    corePath: `${import.meta.env.BASE_URL}tesseract/tesseract-core-lstm.wasm.js`,
    langPath: `${import.meta.env.BASE_URL}tessdata`,
  });
  try {
    const { data } = await worker.recognize(dataUrl);
    return { amount: extractAmount(data.text), text: data.text };
  } finally {
    await worker.terminate();
  }
}
