#!/bin/bash
# Mac / Linux: duplo clique (Mac) ou ./"Abrir City Rush.command"
PORT=8765
URL="http://localhost:$PORT"
echo "CITY RUSH - deixe esta janela aberta enquanto joga (Ctrl+C para sair)."
( sleep 2; (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null) ) &
DIR="$(cd "$(dirname "$0")" && pwd)"
if command -v python3 >/dev/null; then python3 "$DIR/servidor.py" $PORT "$DIR/dist"
else python "$DIR/servidor.py" $PORT "$DIR/dist"; fi
