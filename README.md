# Kosten-Aufteilung 🏖️

Eine kleine Web-App für Reisegruppen: Kassenzettel im Urlaub erfassen, auf Mitreisende
und Kategorien aufteilen, laufend die Ausgaben im Blick behalten und am Ende des
Urlaubs sehen, wer wem wie viel schuldet.

## Funktionen

- **Mitreisende & Kategorien** verwalten (Kategorien mit Icon, frei erweiterbar)
- **Kassenzettel per Kamera scannen**: Foto aufnehmen, der Betrag wird automatisch per
  On-Device-Texterkennung (OCR) vorausgefüllt und lässt sich vor dem Speichern
  korrigieren. Die OCR-Engine läuft komplett lokal im Browser (kein Cloud-Dienst,
  keine externe CDN-Abhängigkeit) — Foto und Erkennung funktionieren daher auch mit
  wackeligem Netz.
- **Kassenzettel erfassen**: Beschreibung, Betrag, Datum, Kategorie, wer bezahlt hat
  und auf wen der Betrag aufgeteilt wird
- **Übersicht**: Gesamtausgaben, Ausgaben pro Kategorie sowie bezahlter Betrag und
  eigener Anteil pro Person
- **Abrechnung**: Saldo pro Person und ein Vorschlag mit möglichst wenigen
  Überweisungen, um am Ende des Urlaubs alles fair auszugleichen
- Alle Daten werden nur lokal im Browser gespeichert (`localStorage`) — kein Backend
  nötig

## Entwicklung

```bash
npm install
npm run dev
```

Weitere Skripte:

```bash
npm run build   # Typecheck + Produktions-Build
npm run lint    # Oxlint
npm run preview # Produktions-Build lokal ansehen
```
