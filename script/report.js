#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

async function generateReport() {
  try {
    // Read the data files
    const statsData = JSON.parse(await fs.readFile('stats.json', 'utf8'));
    const modelsData = JSON.parse(await fs.readFile('models-lite.json', 'utf8'));
    
    // Get current date and date 7 days ago
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    
    // Calculate models with most runs this week
    const weeklyRunsMap = new Map();
    
    for (const [modelName, modelStats] of Object.entries(statsData)) {
      const weeklyRuns = modelStats
        .filter(stat => stat.date >= sevenDaysAgoStr)
        .reduce((sum, stat) => sum + stat.dailyRuns, 0);
      
      if (weeklyRuns > 0) {
        weeklyRunsMap.set(modelName, weeklyRuns);
      }
    }
    
    // Sort by weekly runs (descending)
    const topWeeklyModels = Array.from(weeklyRunsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Calculate models with most runs ever
    const totalRunsMap = new Map();
    
    for (const model of modelsData) {
      const modelName = `${model.owner}/${model.name}`;
      totalRunsMap.set(modelName, model.run_count);
    }
    
    // Sort by total runs (descending)
    const topTotalModels = Array.from(totalRunsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // Detect new models (created in last 7 days)
    const newModels = modelsData
      .filter(model => {
        const createdDate = new Date(model.url.includes('created_at=') ? 
          decodeURIComponent(model.url.split('created_at=')[1]) : 
          new Date(0)); // fallback for models without creation date in URL
        return createdDate >= sevenDaysAgo;
      })
      .slice(0, 10);
    
    // For updated models, we'll check models that have had recent activity
    const recentlyActiveModels = [];
    
    for (const [modelName, modelStats] of Object.entries(statsData)) {
      if (modelStats.length > 0) {
        const lastStat = modelStats[modelStats.length - 1];
        const lastStatDate = new Date(lastStat.date);
        
        // Check if model had runs in the last 3 days
        if (lastStatDate >= new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000) && lastStat.dailyRuns > 0) {
          const model = modelsData.find(m => `${m.owner}/${m.name}` === modelName);
          if (model) {
            recentlyActiveModels.push({
              name: modelName,
              runs: lastStat.dailyRuns,
              totalRuns: lastStat.totalRuns,
              description: model.description || 'No description'
            });
          }
        }
      }
    }
    
    // Sort by recent activity and limit
    const updatedModels = recentlyActiveModels
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 10);
    
    // Generate the report
    const reportContent = `# Replicate Models Report

*Generated on ${today.toISOString().split('T')[0]}*

## 📈 Models with Most Runs This Week

${topWeeklyModels.map((model, index) => 
  `${index + 1}. **${model[0]}** - ${model[1].toLocaleString()} runs`
).join('\n')}

## 🏆 Models with Most Runs Ever

${topTotalModels.map((model, index) => 
  `${index + 1}. **${model[0]}** - ${model[1].toLocaleString()} total runs`
).join('\n')}

## 🆕 New Models (Last 7 Days)

${newModels.length > 0 ? 
  newModels.map(model => 
    `- **${model.owner}/${model.name}** - ${model.description || 'No description'}`
  ).join('\n') : 
  'No new models found in the last 7 days.'
}

## 🔄 Recently Updated Models (Active in Last 3 Days)

${updatedModels.length > 0 ? 
  updatedModels.map(model => 
    `- **${model.name}** - ${model.runs} runs recently (${model.totalRuns.toLocaleString()} total)`
  ).join('\n') : 
  'No recently active models found.'
}

---

*This report is automatically generated from Replicate model usage data.*
`;

    // Write the report
    await fs.writeFile('report.md', reportContent);
    console.log('Report generated successfully: report.md');
    
  } catch (error) {
    console.error('Error generating report:', error);
    process.exit(1);
  }
}

// Run the report generation
if (import.meta.url === `file://${process.argv[1]}`) {
  generateReport();
}

export { generateReport };