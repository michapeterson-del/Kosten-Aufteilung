# Kosten-Aufteilung 🏖️

Eine kleine Web-App für Reisegruppen: Kassenzettel im Urlaub erfassen, auf Mitreisende
und Kategorien aufteilen, laufend die Ausgaben im Blick behalten und am Ende des
Urlaubs sehen, wer wem wie viel schuldet.

## Funktionen

- **Mitreisende & Kategorien** verwalten (Kategorien mit Icon, frei erweiterbar)
- **Kassenzettel per Kamera scannen**: Foto aufnehmen, Beschreibung, Betrag, Datum und
  Kategorie werden automatisch erkannt und lassen sich vor dem Speichern korrigieren.
  Mit hinterlegtem Anthropic-API-Key läuft die Erkennung über Claude (KI, sehr
  zuverlässig, siehe unten); ohne Key nutzt die App eine eingebaute, komplett lokale
  Texterkennung (OCR) als Fallback — funktioniert auch offline, ist aber ungenauer.
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

## Hosting über GitHub Pages

Es gibt einen GitHub-Actions-Workflow (`.github/workflows/deploy.yml`), der die App bei
jedem Push automatisch baut und auf GitHub Pages veröffentlicht — danach reicht es, die
Pages-URL im Browser zu öffnen, ein manueller Build ist nicht nötig.

Einmalig einzurichten (Repo-Einstellungen, nicht per Code möglich):
**Settings → Pages → Build and deployment → Source** auf **„GitHub Actions“** stellen
(statt „Deploy from a branch“). Danach läuft jeder Push automatisch durch.

## KI-Erkennung einrichten (optional, aber empfohlen)

Für zuverlässige Erkennung von Beschreibung, Betrag, Datum und Kategorie beim
Foto-Scan:

1. Auf [console.anthropic.com](https://console.anthropic.com/settings/keys) einen
   Account anlegen (Zahlung per Kreditkarte hinterlegen, Abrechnung nach Nutzung)
   und einen API-Key erstellen (beginnt mit `sk-ant-…`).
2. In der App unter **Einstellungen → KI-Erkennung (Claude)** den Key einfügen und
   speichern.

Der Key wird ausschließlich lokal im Browser gespeichert (`localStorage`), nie im
Quellcode oder Repo, und nur direkt an die Anthropic-API gesendet. Jeder Scan kostet
wenige Cent. Ohne hinterlegten Key funktioniert der Scan weiterhin über die lokale
OCR-Erkennung, nur ungenauer.
