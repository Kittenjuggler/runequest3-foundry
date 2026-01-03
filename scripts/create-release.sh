#!/bin/bash

# Script to create a manual release for RuneQuest 3 Foundry VTT System
# Usage: ./scripts/create-release.sh <version>
# Example: ./scripts/create-release.sh 1.0.7

set -e

if [ -z "$1" ]; then
    echo "Error: Version number required"
    echo "Usage: ./scripts/create-release.sh <version>"
    echo "Example: ./scripts/create-release.sh 1.0.7"
    exit 1
fi

VERSION=$1

echo "Creating release for version $VERSION..."

# Update version in system.json
echo "Updating system.json version..."
node -e "
const fs = require('fs');
const systemJson = JSON.parse(fs.readFileSync('system.json', 'utf8'));
systemJson.version = '$VERSION';
fs.writeFileSync('system.json', JSON.stringify(systemJson, null, 2));
"

# Create release directory
echo "Creating release package..."
rm -rf release
mkdir -p release/runequest3

# Copy files (excluding git, node_modules, and Foundry database files)
rsync -av \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='node_modules' \
  --exclude='.gitignore' \
  --exclude='packs/*/LOCK' \
  --exclude='packs/*/LOG*' \
  --exclude='packs/*/MANIFEST-*' \
  --exclude='packs/*/*.ldb' \
  --exclude='packs/*/*.log' \
  --exclude='packs/*/CURRENT' \
  --exclude='packs/*/lost' \
  --exclude='tatus' \
  --exclude='memory-bank' \
  . release/runequest3/

# Create zip file
echo "Creating zip file..."
cd release
zip -r ../runequest3-foundry.zip runequest3/
cd ..

# Copy system.json for manifest
cp system.json release/system.json

echo ""
echo "Release package created successfully!"
echo ""
echo "Files created:"
echo "  - runequest3-foundry.zip (system package)"
echo "  - release/system.json (manifest file)"
echo ""
echo "Next steps:"
echo "1. Create a new release on GitHub: https://github.com/Kittenjuggler/runequest3-foundry/releases/new"
echo "2. Tag: v$VERSION"
echo "3. Title: Release v$VERSION"
echo "4. Upload runequest3-foundry.zip and release/system.json"
echo "5. Use this manifest URL: https://github.com/Kittenjuggler/runequest3-foundry/releases/download/v$VERSION/system.json"
echo ""

