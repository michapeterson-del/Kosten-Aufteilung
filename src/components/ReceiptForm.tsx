import { useRef, useState } from 'react';
import type { Category, Person, Receipt } from '../types';
import { fileToCompressedDataUrl, scanReceiptImage } from '../receiptScan';

interface Props {
  people: Person[];
  categories: Category[];
  onAdd: (receipt: Omit<Receipt, 'id'>) => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReceiptForm({ people, categories, onAdd }: Props) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [paidById, setPaidById] = useState(people[0]?.id ?? '');
  const [splitBetweenIds, setSplitBetweenIds] = useState<string[]>(people.map((p) => p.id));
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (people.length === 0) {
    return (
      <div className="card">
        <h2>Kassenzettel erfassen</h2>
        <p className="empty-hint">Füge zuerst Mitreisende hinzu, bevor du Kassenzettel erfassen kannst.</p>
      </div>
    );
  }

  const effectiveCategoryId = categoryId || categories[0]?.id || '';
  const effectivePaidById = paidById || people[0]?.id || '';

  const toggleSplit = (id: string) => {
    setSplitBetweenIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setScanning(true);
    setScanHint('Foto wird gelesen …');
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhoto(dataUrl);
      setScanHint('Betrag wird erkannt …');
      const result = await scanReceiptImage(dataUrl);
      if (result.amount) {
        setAmount(result.amount.toFixed(2).replace('.', ','));
        setScanHint(`Betrag erkannt: ${result.amount.toFixed(2).replace('.', ',')} € — bitte prüfen`);
      } else {
        setScanHint('Betrag konnte nicht automatisch erkannt werden, bitte manuell eintragen.');
      }
    } catch {
      setScanHint('Scan fehlgeschlagen. Bitte Betrag manuell eintragen.');
    } finally {
      setScanning(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || !parsedAmount || parsedAmount <= 0 || splitBetweenIds.length === 0) {
      return;
    }
    onAdd({
      description: description.trim(),
      date,
      amount: Math.round(parsedAmount * 100) / 100,
      categoryId: effectiveCategoryId,
      paidById: effectivePaidById,
      splitBetweenIds,
      photo,
    });
    setDescription('');
    setAmount('');
    setPhoto(undefined);
    setScanHint(null);
  };

  const allSelected = splitBetweenIds.length === people.length;

  return (
    <div className="card">
      <h2>Kassenzettel erfassen</h2>
      <form className="receipt-form" onSubmit={submit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handlePhotoSelected}
        />

        <div className="scan-area">
          {photo ? (
            <div className="scan-preview">
              <img src={photo} alt="Foto des Kassenzettels" />
              <button
                type="button"
                className="chip-remove scan-remove"
                onClick={() => {
                  setPhoto(undefined);
                  setScanHint(null);
                }}
                aria-label="Foto entfernen"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="scan-button"
              disabled={scanning}
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Kassenzettel scannen
            </button>
          )}
          {(scanning || scanHint) && (
            <p className={`scan-hint ${scanning ? 'scanning' : ''}`}>{scanHint}</p>
          )}
        </div>

        <label>
          Beschreibung
          <input
            type="text"
            placeholder="z. B. Abendessen Taverna"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="form-row">
          <label>
            Betrag (€)
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Datum
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        <div className="form-row">
          <label>
            Kategorie
            <select value={effectiveCategoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bezahlt von
            <select value={effectivePaidById} onChange={(e) => setPaidById(e.target.value)}>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="split-select">
          <legend>
            Aufteilen auf{' '}
            <button
              type="button"
              className="link-button"
              onClick={() =>
                setSplitBetweenIds(allSelected ? [] : people.map((p) => p.id))
              }
            >
              {allSelected ? 'keine auswählen' : 'alle auswählen'}
            </button>
          </legend>
          <div className="checkbox-list">
            {people.map((p) => (
              <label key={p.id} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={splitBetweenIds.includes(p.id)}
                  onChange={() => toggleSplit(p.id)}
                />
                {p.name}
              </label>
            ))}
          </div>
        </fieldset>

        <button type="submit" className="primary">
          Kassenzettel speichern
        </button>
      </form>
    </div>
  );
}
