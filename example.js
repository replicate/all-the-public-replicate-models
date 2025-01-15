import models from './index.mjs'
import {chain} from 'lodash-es'

const mostRunModels = chain(models)
  .orderBy('run_count', 'desc')
  .take(10)
  .value()

console.log("Most run models:")
for (const model of mostRunModels) {
  console.log(model.url)
}

import stats from './stats.mjs'

console.log("Stats for Flux Schnell:")
console.log(stats["black-forest-labs/flux-schnell"].slice(-5))