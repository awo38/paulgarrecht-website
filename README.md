# paulgarrecht-website

Persönliche Portfolio-Website von Paul Garrecht — Projektingenieur & Einsatzleiter im kerntechnischen Rückbau bei MHC Anlagentechnik.

Die Seite ist gleichzeitig ein kleines Hobby-Projekt: ein reales Beispiel dafür, wie man mit KI-Tools (Claude, Claude Code) etwas baut, statt nur ein Spielzeug-Demo.

## Stack

- Statisches HTML/CSS/JS, keine Build-Tools
- [GSAP](https://gsap.com/) + ScrollTrigger für die scroll-gesteuerte Zeichnung im Hero
- Fonts: Space Grotesk, Inter, JetBrains Mono (Google Fonts)

## Lokal ansehen

Kein Build-Schritt nötig — einfach `index.html` im Browser öffnen, oder für sauberes lokales Serving:

```bash
python3 -m http.server 8000
```

dann `http://localhost:8000` öffnen.

## Deployment

Gedacht für [Vercel](https://vercel.com) (Static-Site-Import, kein Framework nötig) oder GitHub Pages. Bei Vercel: Repo importieren, kein Build-Command nötig, Output-Directory `.` (Root).

## Struktur

- `index.html` — die eigentliche Website
- `impressum.html` — Impressum & Datenschutzhinweise (**Platzhalter-Adresse — vor Live-Schaltung mit echten Daten befüllen**)

## Entstehungsprozess

Siehe Abschnitt „Wie diese Seite entstand" auf der Website selbst (`index.html`, Sektion 05).
