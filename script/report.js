#!/usr/bin/env node

import fs from 'node:fs/promises';

async function generateReport() {
  console.log('Generating model statistics report...');

  try {
    // Read data files
    const [statsData, modelsData] = await Promise.all([
      fs.readFile('stats.json', 'utf-8').then(JSON.parse).catch(() => ({})),
      fs.readFile('models-lite.json', 'utf-8').then(JSON.parse).catch(() => [])
    ]);

    // Calculate date thresholds
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get models with most runs this week
    const modelsWithWeeklyRuns = [];
    for (const [modelName, modelStats] of Object.entries(statsData)) {
      if (modelStats && modelStats.length > 0) {
        // Sum runs from the last 7 days
        const weeklyRuns = modelStats
          .filter(stat => new Date(stat.date) >= oneWeekAgo)
          .reduce((sum, stat) => sum + (stat.dailyRuns || 0), 0);
        
        if (weeklyRuns > 0) {
          modelsWithWeeklyRuns.push({
            name: modelName,
            weeklyRuns,
            totalRuns: modelStats[modelStats.length - 1]?.totalRuns || 0
          });
        }
      }
    }
    
    // Sort by weekly runs and get top 10
    const topWeeklyModels = modelsWithWeeklyRuns
      .sort((a, b) => b.weeklyRuns - a.weeklyRuns)
      .slice(0, 10);

    // Get models with most runs ever (from current model data)
    const topEverModels = modelsData
      .sort((a, b) => b.run_count - a.run_count)
      .slice(0, 10)
      .map(model => ({
        name: `${model.owner}/${model.name}`,
        url: model.url,
        totalRuns: model.run_count,
        description: model.description || 'No description available'
      }));

    // Get new models (created in last 7 days)
    // Note: We'll use models that appear in recent stats but not in older stats as a proxy
    const newModels = [];
    for (const model of modelsData) {
      const modelName = `${model.owner}/${model.name}`;
      const modelStats = statsData[modelName];
      
      // If model has very recent stats (within 7 days) and few total stats entries, consider it new
      if (modelStats && modelStats.length > 0) {
        const firstStatDate = new Date(modelStats[0].date);
        const daysSinceFirst = (now - firstStatDate) / (1000 * 60 * 60 * 24);
        
        if (daysSinceFirst <= 7 && modelStats.length <= 7) {
          newModels.push({
            name: modelName,
            url: model.url,
            firstSeen: modelStats[0].date,
            totalRuns: model.run_count,
            description: model.description || 'No description available'
          });
        }
      }
    }

    // Get recently updated models (active in last 7 days)
    const recentlyActiveModels = [];
    for (const [modelName, modelStats] of Object.entries(statsData)) {
      if (modelStats && modelStats.length > 0) {
        // Check if model had activity in the last 7 days
        const recentActivity = modelStats
          .filter(stat => new Date(stat.date) >= sevenDaysAgo)
          .reduce((sum, stat) => sum + (stat.dailyRuns || 0), 0);
        
        if (recentActivity > 0) {
          const modelData = modelsData.find(m => `${m.owner}/${m.name}` === modelName);
          recentlyActiveModels.push({
            name: modelName,
            url: modelData?.url || `https://replicate.com/${modelName}`,
            recentRuns: recentActivity,
            totalRuns: modelStats[modelStats.length - 1]?.totalRuns || 0,
            description: modelData?.description || 'No description available'
          });
        }
      }
    }
    
    // Sort recently active models by recent activity
    const topRecentlyActiveModels = recentlyActiveModels
      .sort((a, b) => b.recentRuns - a.recentRuns)
      .slice(0, 10);

    // Generate report content
    const reportContent = `# Replicate Models Report

*Generated on ${now.toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
})} UTC*

## 📈 Models with Most Runs This Week

${topWeeklyModels.length > 0 ? 
  topWeeklyModels.map((model, index) => 
    `${index + 1}. **[${model.name}](https://replicate.com/${model.name})** - ${model.weeklyRuns.toLocaleString()} runs this week (${model.totalRuns.toLocaleString()} total)`
  ).join('\n') : 
  'No activity data available for this week.'
}

## 🏆 Models with Most Runs Ever

${topEverModels.map((model, index) => 
  `${index + 1}. **[${model.name}](${model.url})** - ${model.totalRuns.toLocaleString()} total runs${model.description !== 'No description available' ? `\n   *${model.description}*` : ''}`
).join('\n\n')}

## 🆕 New Models (Last 7 Days)

${newModels.length > 0 ? 
  newModels.map(model => 
    `- **[${model.name}](${model.url})** - First seen ${model.firstSeen}, ${model.totalRuns.toLocaleString()} total runs${model.description !== 'No description available' ? `\n  *${model.description}*` : ''}`
  ).join('\n\n') : 
  'No new models detected in the last 7 days.'
}

## 🔄 Recently Updated Models (Active in Last 7 Days)

${topRecentlyActiveModels.length > 0 ? 
  topRecentlyActiveModels.map((model, index) => 
    `${index + 1}. **[${model.name}](${model.url})** - ${model.recentRuns.toLocaleString()} runs in last 7 days (${model.totalRuns.toLocaleString()} total)${model.description !== 'No description available' ? `\n   *${model.description}*` : ''}`
  ).join('\n\n') : 
  'No recent activity detected in the last 7 days.'
}

---

*This report is automatically generated during the build process. Data is based on Replicate's public model registry and historical usage statistics.*
`;

    // Write report to file
    await fs.writeFile('report.md', reportContent);
    
    console.log('✅ Report generated successfully!');
    console.log(`📊 Stats summary:`);
    console.log(`   - Top weekly models: ${topWeeklyModels.length}`);
    console.log(`   - Top ever models: ${topEverModels.length}`);
    console.log(`   - New models: ${newModels.length}`);
    console.log(`   - Recently active models: ${topRecentlyActiveModels.length}`);

  } catch (error) {
    console.error('❌ Error generating report:', error);
    process.exit(1);
  }
}

generateReport();