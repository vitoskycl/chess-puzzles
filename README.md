# Chess Puzzle

Un proyecto educativo para generar una base de datos de puzzles de ajedrez a partir de FENs, usando Stockfish y Python, y visualizarlos en una aplicación web.

## Estructura
- `scripts/`: scripts en Python para generar la base de datos
- `data/`: archivos CSV/JSON con los puzzles
- `web/`: aplicación web en HTML/JS con Bootstrap y chessboard.js

## Cómo usar
1. Genera la base de datos desde el CSV original con `scripts/creaCvsFens.py`
2. Convierte a JSON con `scripts/csv_to_json.py`
3. Abre `web/index.html` en un servidor local o súbelo a GitHub Pages

## Licencia
GNU GPL v3

Los scripts son reutilizables.

La web es estática → se puede publicar con GitHub Pages (web/ como raíz).

## Disclaimer

Este proyecto fue creado con la ayuda de ChatGPT (OpenAI) y tiene un **propósito exclusivamente educativo y experimental**.  
No está destinado a uso comercial ni profesional.

El dataset original proviene de Lichess (https://database.lichess.org/).  
Respeta siempre las licencias y términos de uso de los datos.

