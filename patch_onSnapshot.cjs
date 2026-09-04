const fs = require('fs');
let code = fs.readFileSync('src/lib/firestoreService.ts', 'utf8');

// replace "});" at the end of onSnapshot blocks with "}, (err) => console.warn('Firestore onSnapshot error:', err));"
// A safer way is to replace:
//   return onSnapshot(X, (snapshot) => {
//     [body]
//   });
// with
//   return onSnapshot(X, (snapshot) => {
//     [body]
//   }, (err) => console.warn('Firestore subscription error:', err));

// Actually, I can just use a global regex:
// match `return onSnapshot(..., (snapshot) => { ... });`
code = code.replace(/return onSnapshot\(([^,]+),\s*\(\s*snapshot\s*\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g, 
  "return onSnapshot($1, (snapshot) => {$2}, (error) => {\n    console.warn('Firestore subscription error (likely quota exceeded):', error.message);\n  });"
);

fs.writeFileSync('src/lib/firestoreService.ts', code);
