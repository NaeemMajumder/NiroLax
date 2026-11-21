#!/usr/bin/env bash
# Builds a copy of out/ that the claude.ai artifact host accepts:
# no paths starting with "_" (so _next/ becomes nx/), no Next router metadata files.
set -euo pipefail
dest="${1:-preview}"
rm -rf "$dest" && cp -r out "$dest" && cd "$dest"
rm -rf _not-found* 404.html *.txt */*.txt _next/static/*/_buildManifest.js _next/static/*/_ssgManifest.js \
  _next/static/chunks/app/_global-error _next/static/chunks/app/_not-found
mv _next nx
find . -type f -name '*.txt' -delete
# Route-group folders like [slug] become plain names
for d in $(find nx -type d -name '\[*\]'); do mv "$d" "$(dirname "$d")/$(basename "$d" | tr -d '[]')"; done
grep -rl -e '\[slug\]' -e '%5Bslug%5D' --include=*.js --include=*.html . | xargs -r sed -i -e 's#\[slug\]#slug#g' -e 's#%5Bslug%5D#slug#g'
find . -type d -empty -delete
grep -rl "_next/" --include=*.js --include=*.css --include=*.html . | xargs sed -i 's#_next/#nx/#g'
echo "preview ready: $(find . -type f | wc -l) files"
