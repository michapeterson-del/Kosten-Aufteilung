import { useState } from 'react';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  onAdd: (name: string, icon: string) => void;
  onRemove: (id: string) => void;
}

export function CategoryManager({ categories, onAdd, onRemove }: Props) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💶');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(name, icon);
    setName('');
    setIcon('💶');
  };

  return (
    <div className="card">
      <h2>Kategorien</h2>
      <form className="inline-form" onSubmit={submit}>
        <input
          type="text"
          className="icon-input"
          placeholder="🙂"
          value={icon}
          maxLength={2}
          onChange={(e) => setIcon(e.target.value)}
        />
        <input
          type="text"
          placeholder="Neue Kategorie"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!name.trim()}>
          Hinzufügen
        </button>
      </form>
      <ul className="chip-list">
        {categories.map((c) => (
          <li key={c.id} className="chip">
            <span>
              {c.icon} {c.name}
            </span>
            {categories.length > 1 && (
              <button
                type="button"
                className="chip-remove"
                onClick={() => onRemove(c.id)}
                aria-label={`${c.name} entfernen`}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
