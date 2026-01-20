import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
let models;

try {
  models = JSON.parse(await readFile(join(__dirname, 'models.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  const { gunzipSync } = await import('node:zlib');
  const compressed = await readFile(join(__dirname, 'models.json.gz'));
  models = JSON.parse(gunzipSync(compressed).toString('utf8'));
}

export default models;