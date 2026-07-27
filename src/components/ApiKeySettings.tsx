import { useState } from 'react';
import { clearApiKey, getApiKey, setApiKey } from '../apiKey';

export function ApiKeySettings() {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(() => Boolean(getApiKey()));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setApiKey(key);
    setKey('');
    setSaved(true);
  };

  const remove = () => {
    clearApiKey();
    setSaved(false);
  };

  return (
    <div className="card">
      <h2>KI-Erkennung (Claude)</h2>
      <p className="section-hint">
        Mit einem Anthropic-API-Key liest die App Kassenzettel per KI aus (Beschreibung, Betrag,
        Datum, Kategorie) — deutlich zuverlässiger als die eingebaute Texterkennung. Den Key
        bekommst du auf{' '}
        <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer">
          console.anthropic.com
        </a>
        . Er wird nur lokal in diesem Browser gespeichert, nie im Quellcode. Jeder Scan verursacht
        geringe Kosten im Cent-Bereich bei Anthropic.
      </p>

      {saved ? (
        <div className="api-key-status">
          <span>✅ API-Key ist hinterlegt</span>
          <button type="button" className="danger" onClick={remove}>
            Key entfernen
          </button>
        </div>
      ) : (
        <form className="inline-form" onSubmit={save}>
          <input
            type="password"
            placeholder="sk-ant-…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={!key.trim()}>
            Speichern
          </button>
        </form>
      )}
    </div>
  );
}
