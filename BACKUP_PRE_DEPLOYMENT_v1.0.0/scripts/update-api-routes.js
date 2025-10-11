const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files in src/app/api/backend
const pattern = 'src/app/api/backend/**/route.ts';
const files = glob.sync(pattern);

console.log(`Found ${files.length} API route files to update...`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already using buildBackendUrl
  if (content.includes('buildBackendUrl')) {
    console.log(`✓ ${file} - already updated`);
    return;
  }
  
  // Add import after NextRequest import
  if (!content.includes("import { buildBackendUrl }")) {
    content = content.replace(
      "import { NextRequest, NextResponse } from 'next/server'",
      "import { NextRequest, NextResponse } from 'next/server'\nimport { buildBackendUrl } from '@/lib/api-config'"
    );
  }
  
  // Replace all hardcoded URLs
  content = content.replace(
    /fetch\(`http:\/\/127\.0\.0\.1:8000\/([^`]+)`/g,
    'fetch(buildBackendUrl(`$1`)'
  );
  
  fs.writeFileSync(file, content, 'utf8');
  console.log(`✓ ${file} - updated!`);
});

console.log('\nAll API routes updated for production!');

