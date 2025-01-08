#!/usr/bin/env node

import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
const stats = {}


// Get all commit SHAs in chronological order (oldest first)
const commits = execSync('git log --reverse --format="%H"')
  .toString()
  .trim()
  .split('\n');

// Loop through each commit
for (let i = 0; i < commits.length; i++) {
  const commitSha = commits[i];
  
  // Get the commit message for this SHA
  const commitMessage = execSync(`git log --format=%B -n 1 ${commitSha}`)
    .toString()
    .trim();

  // Bail if it's not a build artifacts commit
  if (commitMessage !== 'Build artifacts') continue

  // Get the commit date in YYYY-MM-DD format
  const commitDate = execSync(`git log -n 1 --format=%ad --date=iso ${commitSha}`)
    .toString()
    .trim()
    .split(' ')[0];

  // Read models-lite.json for this commit
  let modelsJson;
  try {
    modelsJson = execSync(`git show ${commitSha}:models-lite.json`)
      .toString()
      .trim();
  } catch (error) {
    // Skip if models-lite.json doesn't exist in this commit
    continue;
  }

  console.log({commitSha, commitDate});
  
  const models = JSON.parse(modelsJson);

  // Loop through and print each model
  for (const model of models) {
    const nwo = `${model.owner}/${model.name}`

    if (!stats[nwo]) {
        stats[nwo] = []
    }

    const totalRuns = model.run_count
    const dailyRuns = stats[nwo].length > 0 ? totalRuns - stats[nwo][stats[nwo].length - 1].totalRuns : totalRuns;

    const dailyStats = {
      date: commitDate,
      totalRuns,
      dailyRuns,
    }
    // console.log(dailyStats)
    stats[nwo].push(dailyStats)
  }

// Write stats to disk
await fs.writeFile('stats.json', JSON.stringify(stats, null, 2));

}

