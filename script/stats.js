#!/usr/bin/env node

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';

const execAsync = promisify(exec);
const stats = {};

// Get the date 31 days ago in ISO format
const thirtyOneDaysAgo = new Date();
thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
const thirtyOneDaysAgoISO = thirtyOneDaysAgo.toISOString().split('T')[0];

// Get all commit SHAs using async exec
const { stdout: commitsOutput } = await execAsync(
  `git log --reverse --since="${thirtyOneDaysAgoISO}" --format="%H"`
);
const commits = commitsOutput.trim().split('\n');

// Skip if no commits found
if (!commits[0]) {
  console.log('No commits found in the last 31 days');
  process.exit(0);
}

// Loop through each commit, starting from the second commit (index 1)
for (const commitSha of commits) {
  try {
    // Get the commit message
    const { stdout: commitMessage } = await execAsync(
      `git log --format=%B -n 1 ${commitSha}`
    );
    
    // Bail if it's not a build artifacts commit
    if (commitMessage.trim() !== 'Build artifacts') continue;

    // Get the commit date
    const { stdout: commitDate } = await execAsync(
      `git log -n 1 --format=%ad --date=iso ${commitSha}`
    );
    const formattedDate = commitDate.trim().split(' ')[0];

    // Instead of using git show, we'll create a temporary file
    await execAsync(
      `git show ${commitSha}:models-lite.json > temp-models-${commitSha}.json`
    );
    
    // Read the temporary file
    const modelsJson = await fs.readFile(
      `temp-models-${commitSha}.json`, 
      'utf-8'
    );
    
    // Clean up temporary file
    await fs.unlink(`temp-models-${commitSha}.json`);

    // console.log({ commitSha, date: formattedDate });
    
    const models = JSON.parse(modelsJson);

    // Process models data
    for (const model of models) {
      const nwo = `${model.owner}/${model.name}`;

      if (!stats[nwo]) {
        stats[nwo] = [];
      }

      const totalRuns = model.run_count;
      const dailyRuns = stats[nwo].length > 0 
        ? totalRuns - stats[nwo][stats[nwo].length - 1].totalRuns 
        : totalRuns;

      const dailyStats = {
        date: formattedDate,
        totalRuns,
        dailyRuns,
      };

      
      // Only add stats for new dates to avoid duplicates from multiple commits on the same day
      if (stats[nwo].length === 0 || stats[nwo][stats[nwo].length - 1].date !== formattedDate) {
        stats[nwo].push(dailyStats);
      }
    }
    
  } catch (error) {
    console.error(`Error processing commit ${commitSha}:`, error.message);
  }
}

// Remove the first element from each model's stats array,
// because the dailyRuns is not accurate for the first day
for (const nwo in stats) {
  stats[nwo] = stats[nwo].slice(1);
}

// Write stats to disk
await fs.writeFile('stats.json', JSON.stringify(stats, null, 2));

