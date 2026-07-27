import type { Category } from './types';
import type { ScanResult } from './receiptScan';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_VERSION = '2023-06-01';

function buildPrompt(categories: Category[]): string {
  const categoryList = categories.map((c) => `- ${c.id}: ${c.name}`).join('\n');
  return `Du bekommst das Foto eines Kassenzettels aus dem Urlaub. Lies ihn sorgfältig und antworte AUSSCHLIESSLICH mit einem einzigen JSON-Objekt, ohne Markdown, ohne Erklärung, ohne Code-Block.

Format:
{
  "description": string,      // kurzer Name des Geschäfts/Restaurants/Anbieters, z. B. "REWE" oder "Taverna Poseidon"
  "amount": number | null,    // Gesamt-/Endbetrag in Euro als Zahl mit Punkt als Dezimaltrennzeichen, z. B. 12.34, ohne Währungssymbol
  "date": string | null,      // Datum des Kaufs im Format YYYY-MM-DD, falls auf dem Beleg lesbar
  "categoryId": string | null // die id der am besten passenden Kategorie aus der folgenden Liste, oder null wenn keine gut passt
}

Verfügbare Kategorien (nutze exakt eine dieser ids oder null):
${categoryList}

Wenn ein Betrag mit Mehrwertsteuer/Trinkgeld/Endsumme angegeben ist, nimm den finalen Gesamtbetrag, nicht Einzelposten.`;
}

interface ClaudeContentBlock {
  type: string;
  text?: string;
}

interface ClaudeResponse {
  content?: ClaudeContentBlock[];
  error?: { message?: string; type?: string };
}

function parseDataUrl(dataUrl: string): { mediaType: string; base64: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error('Ungültiges Bildformat');
  return { mediaType: match[1], base64: match[2] };
}

function parseAiJson(raw: string): Partial<ScanResult> {
  const jsonText = raw.trim().startsWith('{') ? raw.trim() : `{${raw.trim()}`;
  const end = jsonText.lastIndexOf('}');
  const parsed = JSON.parse(end >= 0 ? jsonText.slice(0, end + 1) : jsonText);

  const amount = typeof parsed.amount === 'number' && parsed.amount > 0 ? Math.round(parsed.amount * 100) / 100 : null;
  const date = typeof parsed.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : null;
  const description = typeof parsed.description === 'string' && parsed.description.trim() ? parsed.description.trim().slice(0, 60) : null;
  const categoryId = typeof parsed.categoryId === 'string' && parsed.categoryId.trim() ? parsed.categoryId.trim() : null;

  return { amount, date, description, categoryId };
}

export async function scanReceiptWithAI(
  dataUrl: string,
  categories: Category[],
  apiKey: string,
): Promise<ScanResult> {
  const { mediaType, base64 } = parseDataUrl(dataUrl);

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: buildPrompt(categories) },
          ],
        },
        { role: 'assistant', content: '{' },
      ],
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ClaudeResponse | null;
    if (response.status === 401) throw new Error('API-Key ungültig oder abgelehnt.');
    if (response.status === 429) throw new Error('Rate-Limit erreicht, bitte kurz warten.');
    throw new Error(body?.error?.message ?? `Anfrage fehlgeschlagen (${response.status})`);
  }

  const data = (await response.json()) as ClaudeResponse;
  const text = data.content?.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error('Keine Antwort von der KI erhalten.');

  const result = parseAiJson(text);
  const validCategoryId = result.categoryId && categories.some((c) => c.id === result.categoryId)
    ? result.categoryId
    : null;

  return {
    amount: result.amount ?? null,
    date: result.date ?? null,
    description: result.description ?? null,
    categoryId: validCategoryId,
  };
}
