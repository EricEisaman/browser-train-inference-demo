#!/usr/bin/env bash
# Convert TinyStories.inference.safetensors → static/models/{ort,transformers-js}
# Requires sibling piston checkout with export_inference + a Python venv that has torch.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PISTON="$(cd "$ROOT/../piston" && pwd)"
CHECKPOINT="$ROOT/TinyStories.inference.safetensors"
OUT="$ROOT/static/models"
TOKENIZER="$PISTON/examples/piston-train-toy/static/tokenizer/tinystories/8192/tokenizer.json"

if [[ ! -f "$CHECKPOINT" ]]; then
  echo "ERROR: missing $CHECKPOINT" >&2
  exit 1
fi
if [[ ! -f "$TOKENIZER" ]]; then
  echo "ERROR: missing tokenizer at $TOKENIZER (expected sibling piston repo)" >&2
  exit 1
fi

PY=""
for candidate in \
  "$PISTON/.venv-export/bin/python" \
  "$ROOT/.venv-export/bin/python" \
  "$PISTON/.venv/bin/python" \
  "$(command -v python3 || true)"
do
  if [[ -n "$candidate" && -x "$candidate" ]]; then
    if "$candidate" -c "import torch, safetensors" 2>/dev/null; then
      PY="$candidate"
      break
    fi
  fi
done

if [[ -z "$PY" ]]; then
  echo "ERROR: no Python with torch+safetensors. From piston:" >&2
  echo "  python3 -m venv .venv-export && .venv-export/bin/pip install -r scripts/export_inference/requirements.txt" >&2
  exit 1
fi

# Extract model card for humans / reconvert convenience
"$PY" - <<PY
import json, struct
from pathlib import Path
p = Path("$CHECKPOINT")
with p.open("rb") as f:
    n = struct.unpack("<Q", f.read(8))[0]
    header = json.loads(f.read(n))
extra = json.loads(header["__metadata__"]["piston_extra"])
card = extra["model"]
out = Path("$ROOT/TinyStories.model.json")
out.write_text(json.dumps(card, indent=2), encoding="utf-8")
print(f"==> wrote {out}")
PY

mkdir -p "$OUT"
echo "==> converting with $PY"
export PYTHONPATH="$PISTON/scripts"
"$PY" -m export_inference convert \
  "$CHECKPOINT" \
  -o "$OUT" \
  --model-json "$ROOT/TinyStories.model.json" \
  --tokenizer "$TOKENIZER" \
  --targets both

# Also install tokenizer_config beside ORT package when present
TOK_DIR="$(dirname "$TOKENIZER")"
if [[ -f "$TOK_DIR/tokenizer_config.json" ]]; then
  cp "$TOK_DIR/tokenizer_config.json" "$OUT/ort/" 2>/dev/null || true
  cp "$TOK_DIR/tokenizer_config.json" "$OUT/transformers-js/" 2>/dev/null || true
fi

echo "==> done → $OUT/ort and $OUT/transformers-js"
ls -la "$OUT/ort" "$OUT/transformers-js" | head -40
