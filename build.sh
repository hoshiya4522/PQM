#!/bin/bash

# Configuration
REPO_NAME="past-question-manager" # Set this to your repository name on GitHub Pages
STATIC_BASE="/" # Use "/" for root domain, "/repo-name/" for GitHub Pages subfolder

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --base) STATIC_BASE="$2"; shift ;;
        --repo) REPO_NAME="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "========================================"
echo "   Building Static Site for GH Pages    "
echo "========================================"
echo "Base Path: $STATIC_BASE"

# 1. Install Dependencies
echo "Installing dependencies..."
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Build React App
echo "Building Frontend..."
cd client
VITE_STATIC_MODE=true npm run build -- --base="$STATIC_BASE"
cd ..

# 3. Export Data from SQLite to JSON
echo "Exporting Database to JSON..."
cd server
node export.js
cd ..

# 4. Copy Assets
echo "Copying Uploads..."
cp -r server/uploads client/dist/

# 5. Create .nojekyll (Required for GH Pages to serve folders starting with _)
touch client/dist/.nojekyll

# 6. Create 404.html for SPA support on GH Pages
echo "Creating 404.html..."
cp client/dist/index.html client/dist/404.html

echo "========================================"
echo "   ✅ Build Complete!                  "
echo "========================================"
echo "Build location: client/dist"
echo ""
echo "To deploy to GitHub Pages:"
echo "1. Push the contents of 'client/dist' to the 'gh-pages' branch."
echo "2. Or use the 'gh-pages' npm package."
echo ""
echo "Example using npx gh-pages:"
echo "npx gh-pages -d client/dist"
