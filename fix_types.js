const fs = require('fs');
let content = fs.readFileSync('src/lib/calendar-api.ts', 'utf8');

// Corriger tous les cas où on assigne null à des champs qui attendent string | undefined
content = content
  .replace(/htmlLink: ([^,]+),/g, 'htmlLink: $1 || undefined,')
  .replace(/description: ([^,]+),/g, 'description: $1 || undefined,') 
  .replace(/location: ([^,]+),/g, 'location: $1 || undefined,')
  .replace(/summary: ([^,]+),/g, 'summary: $1 || undefined,');

fs.writeFileSync('src/lib/calendar-api.ts', content);
console.log('✅ Corrections TypeScript appliquées');
