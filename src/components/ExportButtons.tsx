import { useState } from 'react';
import type { TripState } from '../types';
import { exportToExcel, exportToPdf } from '../export';

interface Props {
  trip: TripState;
}

export function ExportButtons({ trip }: Props) {
  const [busy, setBusy] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (kind: 'excel' | 'pdf') => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === 'excel') {
        await exportToExcel(trip);
      } else {
        await exportToPdf(trip);
      }
    } catch {
      setError('Export fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card">
      <h2>Export</h2>
      <p className="section-hint">
        Alle Kassenzettel, die Übersicht und die Abrechnung als Datei exportieren.
      </p>
      <div className="inline-form">
        <button type="button" disabled={busy !== null} onClick={() => handleExport('excel')}>
          {busy === 'excel' ? 'Erstelle Excel …' : '📊 Als Excel'}
        </button>
        <button type="button" disabled={busy !== null} onClick={() => handleExport('pdf')}>
          {busy === 'pdf' ? 'Erstelle PDF …' : '📄 Als PDF'}
        </button>
      </div>
      {error && <p className="scan-hint">{error}</p>}
    </div>
  );
}
