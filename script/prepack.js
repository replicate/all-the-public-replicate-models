#!/usr/bin/env node

import fs from 'node:fs';
import { gunzipSync } from 'node:zlib';

const compressedPath = 'models.json.gz';
const jsonPath = 'models.json';

if (!fs.existsSync(compressedPath)) {
  throw new Error(`${compressedPath} is missing. Run npm run build first.`);
}

const compressed = fs.readFileSync(compressedPath);
fs.writeFileSync(jsonPath, gunzipSync(compressed));
