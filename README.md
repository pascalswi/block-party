# Block Party ✦

Ein farbiges Falling-Block-Spiel für **Computer und Tastatur**. Mit Arcade und Chill, einem kleinen Hype-Block namens Blobby, Konfetti und eigenen elektronischen Sounds.

## Spielen

Online: **https://pascalswi.github.io/block-party/**

Oder lokal: `index.html` im Browser öffnen. Keine Installation, keine Abhängigkeiten, kein Build nötig. Alternativ im Projektordner `python3 -m http.server 8080 --bind 127.0.0.1` ausführen und `http://127.0.0.1:8080` öffnen.

| Taste | Funktion |
| --- | --- |
| ← / → | Verschieben |
| ↑ / X | Nach rechts drehen |
| Z | Nach links drehen |
| ↓ | Schneller fallen |
| Leertaste | Sofort absetzen |
| C | Block parken / tauschen, einmal pro Zug |
| P / Escape | Pausieren / fortsetzen |
| Enter | Erste / nächste Runde starten |
| R | Neue Runde aus Pause oder nach Spielende |

Volle waagerechte Reihen verschwinden. Vier auf einmal sind ein **Party Clear**. Der Umriss zeigt die Landeposition. Es gibt sieben Blockformen, die pro Zufallsbeutel je einmal vorkommen. Rotation hat Wand- und Bodenkorrekturen; das Spiel verwendet ein eigenes vereinfachtes Regelwerk.

- **Arcade:** Alle 10 Reihen steigt das Level und das Spiel wird schneller.
- **Chill:** Das Tempo bleibt gleich. Eigener Rekord.
- **Punkte:** 1/2/3/4 Reihen geben 100/300/500/800 × Level. Aufeinanderfolgende Abräumzüge geben zusätzliche Combo-Punkte. Schnelles Fallen gibt 1 Punkt, direktes Absetzen 2 Punkte pro Feld.
- **Sound / Musik:** Oben separat schaltbar. Die Sounds und die kurze Musikschleife werden im Browser synthetisiert und erst durch eine Interaktion gestartet.
- **Pause:** Automatisch beim Wechsel zu einem anderen Tab oder Fenster.
- **Rekorde:** Bleiben nur im jeweiligen Browser gespeichert. Kein Login, kein Tracking, keine Werbung. Bei blockiertem Browserspeicher funktioniert das Spiel weiterhin, ohne dauerhaften Rekord.

## Änderungen

- `index.html`: Texte und Seitenstruktur
- `style.css`: Farben, Layout und Darstellung
- `engine.js`: Regeln, Punkte und Geschwindigkeit
- `game.js`: Zeichnen, Tastatur, Effekte, Audio und Speicherung
- `favicon.svg`: Browser-Icon

Alle Dateien sind bewusst einfach gehalten. Das Spiel lädt keine externen Schriftarten, Audio-Dateien oder JavaScript-Bibliotheken. Kleine Bildschirmbreiten bekommen ein angepasstes Layout; eine Tastatur wird weiterhin benötigt.

## Tests

Mit Node.js: `node --test tests/engine.test.cjs` (oder `npm test`). Tests prüfen Zufallsbeutel, Kollisionen, vier gleichzeitige Reihen, Punkte/Level, Parken, Absetzen, Spielende, Rotation und Chill.

## Veröffentlichung

Eigenes öffentliches Repository: https://github.com/pascalswi/block-party

GitHub Pages veröffentlicht `main` aus `/` (Repository-Root). `.nojekyll` sorgt dafür, dass die statischen Dateien direkt bereitgestellt werden. Änderungen auf `main` werden nach dem Pages-Deployment unter derselben Spieladresse sichtbar. Keine kostenpflichtige Infrastruktur erforderlich.

Nach dem Speichern von Änderungen:

```sh
git add index.html style.css engine.js game.js favicon.svg README.md tests package.json LICENSE .gitignore .nojekyll
git commit -m "Update Block Party"
git push
```

MIT-Lizenz; siehe `LICENSE`. Eigenständiges Spiel, ohne Zugehörigkeit zu anderen Spielemarken.
