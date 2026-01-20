import Replicate from "replicate";
const replicate = new Replicate();
import {unset} from "lodash-es";
import fs from "node:fs";
import { gunzipSync, gzipSync } from "node:zlib";

async function main () {
  console.error("Fetching all public models from Replicate...")
  const models = []
  for await (const batch of replicate.paginate(replicate.models.list)) {
    process.stderr.write('.')
    models.push(...batch);
  }

  // remove some noisy fields that are not needed
  for (let i = 0; i < models.length; i++) {
    unset(models[i], 'default_example.logs')
    unset(models[i], 'default_example.urls')
    unset(models[i], 'default_example.webhook_completed')
    unset(models[i], 'latest_version.openapi_schema.paths')
  }
  
  const lite = models.map(model => {
    return {
      url: model.url,
      owner: model.owner,
      name: model.name,
      description: model.description,
      run_count: model.run_count,
      cover_image_url: model.cover_image_url,
      github_url: model.github_url
    }
  });

  const modelsJson = JSON.stringify(models, null, 2);

  // save old data for comparison in stats script
  if (fs.existsSync('models.json')) {
    fs.copyFileSync('models.json', 'models.old.json');
  } else if (fs.existsSync('models.json.gz')) {
    const previousModels = gunzipSync(fs.readFileSync('models.json.gz'));
    fs.writeFileSync('models.old.json', previousModels);
  }

  fs.writeFileSync('models.json', modelsJson)
  fs.writeFileSync('models.json.gz', gzipSync(modelsJson))
  fs.writeFileSync('models-lite.json', JSON.stringify(lite, null, 2))
}

main()
