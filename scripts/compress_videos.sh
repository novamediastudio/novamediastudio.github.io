#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Batch compress MP4 videos for web
# Run from the root of novamediastudio.github.io
# ─────────────────────────────────────────────────────────────
# Requirements: brew install ffmpeg
#
# What it does:
#   - Re-encodes every .mp4 / .MP4 / .mov with H.264
#   - Strips audio (all gallery videos are muted anyway)
#   - Caps resolution at 1080p (keeps aspect ratio)
#   - Adds faststart flag so videos begin playing before fully downloaded
#   - Only replaces the original if the new file is actually smaller
#
# CRF controls quality vs size (lower = better quality, larger file):
#   22 = high quality    (~same as original quality, moderate savings)
#   26 = balanced        (recommended — good quality, big savings)
#   30 = aggressive      (noticeable quality loss, smallest files)
# ─────────────────────────────────────────────────────────────

set -e

IMAGES_DIR="images"
CRF=26
MAX_HEIGHT=1080

echo "Compressing videos (CRF=$CRF, max ${MAX_HEIGHT}p, audio stripped)..."
echo ""

find "$IMAGES_DIR" -type f \( -iname "*.mp4" -o -iname "*.mov" \) | sort | while read -r src; do
  tmp="${src%.*}_tmp_compressed.mp4"
  dest="${src%.*}.mp4"

  # Re-encode to temp file
  ffmpeg -y -i "$src" \
    -c:v libx264 \
    -crf $CRF \
    -preset slow \
    -vf "scale=-2:'min(ih,$MAX_HEIGHT)'" \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "$tmp" \
    -loglevel error -stats

  original_size=$(du -sk "$src" | cut -f1)
  new_size=$(du -sk "$tmp" | cut -f1)
  original_human=$(du -sh "$src" | cut -f1)
  new_human=$(du -sh "$tmp" | cut -f1)

  if [ "$new_size" -lt "$original_size" ]; then
    mv "$tmp" "$dest"
    saving=$(( (original_size - new_size) * 100 / original_size ))
    echo "  ✓ $src  ($original_human → $new_human, -${saving}%)"
  else
    rm "$tmp"
    echo "  – $src  already optimal ($original_human), kept original"
  fi
done

echo ""
echo "Done. Commit the updated files to your repo."
