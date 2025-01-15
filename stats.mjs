import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const stats = JSON.parse(await readFile(join(__dirname, 'stats.json'), 'utf8'));

export default stats;
