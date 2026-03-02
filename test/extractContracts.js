// test/extractContracts.js
// Extracts all Solidity source from contracts/ and writes to all contracts.txt in root

const fs = require('fs');
const path = require('path');

const contractsDir = path.join(__dirname, '..', 'contracts');
const outFile = path.join(__dirname, '..', 'all contracts.txt');

function getAllSolidityFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllSolidityFiles(filePath));
    } else if (file.endsWith('.sol')) {
      results.push(filePath);
    }
  });
  return results;
}

function main() {
  const files = getAllSolidityFiles(contractsDir);
  let out = '// This file is auto-generated. All Solidity contract source code from contracts/ folder below:\n\n';
  files.forEach(f => {
    out += `// --- ${path.basename(f)} ---\n// (file: contracts/${path.basename(f)})\n\n`;
    out += fs.readFileSync(f, 'utf8') + '\n\n';
  });
  fs.writeFileSync(outFile, out);
  console.log(`Extracted ${files.length} contracts to all contracts.txt`);
}

main();
