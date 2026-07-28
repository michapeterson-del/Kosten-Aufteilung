interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionResultListLike {
  0: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isVoiceInputSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

export function listenOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      reject(new Error('Spracheingabe wird von diesem Browser nicht unterstützt.'));
      return;
    }

    const recognition = new Ctor();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let settled = false;

    recognition.onresult = (event) => {
      settled = true;
      resolve(event.results[0]?.[0]?.transcript ?? '');
    };
    recognition.onerror = (event) => {
      settled = true;
      reject(
        new Error(
          event.error === 'not-allowed' || event.error === 'permission-denied'
            ? 'Mikrofon-Zugriff wurde nicht erlaubt.'
            : 'Spracherkennung fehlgeschlagen.',
        ),
      );
    };
    recognition.onend = () => {
      if (!settled) {
        reject(new Error('Nichts verstanden, bitte erneut versuchen.'));
      }
    };

    recognition.start();
  });
}
