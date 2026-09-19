#!/usr/bin/env bash
# Extracts the basemap tiles into public/tiles/ (gitignored). Needs the pmtiles CLI:
#   go install github.com/protomaps/go-pmtiles@latest   (binary: go-pmtiles)
# Usage: scripts/extract-tiles.sh [YYYYMMDD]   (default: yesterday's Protomaps build)
set -euo pipefail
cd "$(dirname "$0")/.."

PMTILES=$(command -v pmtiles || command -v go-pmtiles)
BUILD="https://build.protomaps.com/${1:-$(date -u -d yesterday +%Y%m%d)}.pmtiles"
mkdir -p public/tiles

"$PMTILES" extract "$BUILD" public/tiles/nepal.pmtiles --bbox=80.0,26.3,88.3,30.5 --maxzoom=9
"$PMTILES" extract "$BUILD" public/tiles/khumbu.pmtiles --bbox=86.55,27.60,86.95,28.10 --maxzoom=14      # EBC, Gokyo
"$PMTILES" extract "$BUILD" public/tiles/annapurna.pmtiles --bbox=83.55,28.10,84.95,28.90 --maxzoom=13   # Annapurna, Poon Hill, Manaslu
"$PMTILES" extract "$BUILD" public/tiles/langtang.pmtiles --bbox=85.25,28.05,85.75,28.30 --maxzoom=14
ls -l public/tiles
