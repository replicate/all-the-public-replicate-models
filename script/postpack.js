#!/usr/bin/env node

import fs from 'node:fs';

const jsonPath = 'models.json';

if (fs.existsSync(jsonPath)) {
  fs.unlinkSync(jsonPath);
}
