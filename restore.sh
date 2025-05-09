#!/bin/bash

if [ -z "$1" ]; then
  echo "No slot specified. Finding the most recently modified backup..."
  SLOT=$(ls -td ./backups/slot* | head -1 | xargs basename)
  if [ -z "$SLOT" ]; then
    echo "❌ No backup folders found."
    exit 1
  fi
  echo "Using slot: $SLOT"
else
  SLOT="$1"
fi

docker-compose exec mongo mongorestore --drop --dir /backup/$SLOT
