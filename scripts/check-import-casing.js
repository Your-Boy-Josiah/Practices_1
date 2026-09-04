const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const JS_FILES = [];

const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'coverage') continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.js')) {
      JS_FILES.push(fullPath);
    }
  }
};

const hasExactPathCase = (targetPath) => {
  const parts = path.relative(ROOT, targetPath).split(path.sep);
  let current = ROOT;

  for (const part of parts) {
    const entries = fs.readdirSync(current);
    if (!entries.includes(part)) return false;
    current = path.join(current, part);
  }

  return true;
};

const resolveCandidates = (basePath) => {
  const candidates = [basePath, `${basePath}.js`, path.join(basePath, 'index.js')];
  return candidates.filter((candidate) => fs.existsSync(candidate));
};

walk(ROOT);

const importRegex = /require\((['"])(\.\.?\/[^'"]+)\1\)/g;
const errors = [];

for (const file of JS_FILES) {
  const content = fs.readFileSync(file, 'utf8');
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const requestedPath = match[2];
    const absoluteBase = path.resolve(path.dirname(file), requestedPath);
    const candidates = resolveCandidates(absoluteBase);

    if (candidates.length === 0) continue;

    const hasExactMatch = candidates.some((candidate) => hasExactPathCase(candidate));

    if (!hasExactMatch) {
      errors.push(`${path.relative(ROOT, file)} imports \"${requestedPath}\" with incorrect casing.`);
    }
  }
}

if (errors.length > 0) {
  console.error('Import casing check failed:');
  errors.forEach((line) => console.error(`- ${line}`));
  process.exit(1);
}

console.log('Import casing check passed.');
