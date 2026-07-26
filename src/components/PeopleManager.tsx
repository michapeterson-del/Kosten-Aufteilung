import { useState } from 'react';
import type { Person } from '../types';

interface Props {
  people: Person[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function PeopleManager({ people, onAdd, onRemove }: Props) {
  const [name, setName] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name);
    setName('');
  };

  return (
    <div className="card">
      <h2>Mitreisende</h2>
      <form className="inline-form" onSubmit={submit}>
        <input
          type="text"
          placeholder="Name hinzufügen"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!name.trim()}>
          Hinzufügen
        </button>
      </form>
      {people.length === 0 ? (
        <p className="empty-hint">Noch niemand hinzugefügt. Füge zuerst deine Mitreisenden hinzu.</p>
      ) : (
        <ul className="chip-list">
          {people.map((p) => (
            <li key={p.id} className="chip">
              <span>{p.name}</span>
              <button
                type="button"
                className="chip-remove"
                onClick={() => onRemove(p.id)}
                aria-label={`${p.name} entfernen`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
