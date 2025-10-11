#!/bin/bash
# Post-build script to copy public files for standalone deployment

echo "Copying public files for standalone deployment..."

# Copy public directory to standalone build
if [ -d ".next/standalone" ]; then
    cp -r public .next/standalone/
    echo "✓ Public files copied to standalone build"
else
    echo "⚠ Warning: .next/standalone directory not found"
fi

# Also copy to static if it exists
if [ -d ".next/static" ]; then
    mkdir -p .next/standalone/.next/static
    cp -r .next/static/* .next/standalone/.next/static/ 2>/dev/null || true
    echo "✓ Static files linked"
fi

echo "Post-build complete!"

