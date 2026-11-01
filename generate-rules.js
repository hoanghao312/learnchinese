const fs = require('fs');
const blueprint = JSON.parse(fs.readFileSync('firebase-blueprint.json', 'utf8'));

let rules = 'rules_version = "2";\nservice cloud.firestore {\n  match /databases/{database}/documents {\n';

blueprint.collections.forEach(collection => {
  rules += `    match /${collection.name}/{document} {\n`;
  if (collection.security.read) rules += `      allow read: if ${collection.security.read};\n`;
  if (collection.security.create) rules += `      allow create: if ${collection.security.create};\n`;
  if (collection.security.update) rules += `      allow update: if ${collection.security.update};\n`;
  if (collection.security.delete) rules += `      allow delete: if ${collection.security.delete};\n`;
  rules += `    }\n`;
});

rules += '  }\n}\n';
fs.writeFileSync('firestore.rules', rules);
