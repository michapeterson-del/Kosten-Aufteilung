import { useState } from 'react';
import './App.css';
import { useTripState } from './useTripState';
import { PeopleManager } from './components/PeopleManager';
import { CategoryManager } from './components/CategoryManager';
import { ReceiptForm } from './components/ReceiptForm';
import { ReceiptList } from './components/ReceiptList';
import { Dashboard } from './components/Dashboard';
import { Settlement } from './components/Settlement';
import { ApiKeySettings } from './components/ApiKeySettings';

type Tab = 'erfassen' | 'uebersicht' | 'abrechnung' | 'einstellungen';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'erfassen', label: 'Erfassen', icon: '🧾' },
  { id: 'uebersicht', label: 'Übersicht', icon: '📊' },
  { id: 'abrechnung', label: 'Abrechnung', icon: '🤝' },
];

function App() {
  const {
    trip,
    addPerson,
    removePerson,
    addCategory,
    removeCategory,
    addReceipt,
    removeReceipt,
    resetTrip,
  } = useTripState();
  const [tab, setTab] = useState<Tab>('erfassen');

  const handleReset = () => {
    if (confirm('Wirklich alle Daten dieses Urlaubs löschen? Das kann nicht rückgängig gemacht werden.')) {
      resetTrip();
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>🏖️ Kosten-Aufteilung</h1>
        <p>Kassenzettel erfassen, auf Mitreisende aufteilen und am Ende fair abrechnen.</p>
      </header>

      <nav className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-button ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'erfassen' && (
          <>
            <ReceiptForm people={trip.people} categories={trip.categories} onAdd={addReceipt} />
            <ReceiptList
              receipts={trip.receipts}
              people={trip.people}
              categories={trip.categories}
              onRemove={removeReceipt}
            />
          </>
        )}

        {tab === 'uebersicht' && <Dashboard trip={trip} />}

        {tab === 'abrechnung' && <Settlement trip={trip} />}

        {tab === 'einstellungen' && (
          <>
            <PeopleManager people={trip.people} onAdd={addPerson} onRemove={removePerson} />
            <CategoryManager
              categories={trip.categories}
              onAdd={addCategory}
              onRemove={removeCategory}
            />
            <ApiKeySettings />
            <div className="card">
              <h2>Daten</h2>
              <p className="section-hint">
                Alle Daten werden nur lokal in diesem Browser gespeichert.
              </p>
              <button type="button" className="danger" onClick={handleReset}>
                Urlaub zurücksetzen
              </button>
            </div>
          </>
        )}
      </main>

      <button
        type="button"
        className={`settings-fab ${tab === 'einstellungen' ? 'active' : ''}`}
        onClick={() => setTab('einstellungen')}
        aria-label="Einstellungen"
      >
        ⚙️
      </button>
    </div>
  );
}

export default App;
