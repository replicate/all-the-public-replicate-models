# all-the-public-replicate-models

Metadata for all[^1] the public models on Replicate, bundled up into an npm package.

This package also includes [historical daily run counts](#stats) for each model, which are updated daily.

## Installation

```sh
npm install all-the-public-replicate-models
```

## Usage (as a library)

Full-bodied usage (all the metadata, ~17MB)

```js
import models from 'all-the-public-replicate-models'

console.log(models)
```

Lite usage (just the basic metadata, ~375K):

```js
import models from 'all-the-public-replicate-models/lite'

console.log(models)
```

Find the top 10 models by run count:

```js
import models from 'all-the-public-replicate-models'
import {chain} from 'lodash-es'

const mostRun = chain(models).orderBy('run_count', 'desc').take(10).value()
console.log({mostRun})
```

## Stats

This package also includes historical daily run counts for each model, which are updated daily.

```js
import stats from 'all-the-public-replicate-models/stats'

console.log(stats["black-forest-labs/flux-schnell"].slice(-5))

/*
[
  { date: '2025-01-03', totalRuns: 176951005, dailyRuns: 1071498 },
  { date: '2025-01-04', totalRuns: 178025758, dailyRuns: 1074753 },
  { date: '2025-01-05', totalRuns: 179119496, dailyRuns: 1093738 },
  { date: '2025-01-06', totalRuns: 180272877, dailyRuns: 1153381 },
  { date: '2025-01-07', totalRuns: 181445133, dailyRuns: 1172256 }
]
*/
```

See [example.js](example.js) for a code snippet that uses the stats.

## Usage (as a CLI)

The CLI dumps the model metadata to standard output as a big JSON object:

```command
$ npx all-the-public-replicate-models
```

The output will be:

```
[
  {...},
  {...},
  {...},
]
```

You can use [jq](https://stedolan.github.io/jq/) to filter the output. Here's an example that finds all the whisper models and sorts them by run count:

```command
npx all-the-public-replicate-models | jq -r 'map(select(.name | contains("whisper"))) | sort_by(.run_count) | reverse | .[] | "\(.url) \(.run_count)"'
```

- https://replicate.com/openai/whisper 3790120
- https://replicate.com/m1guelpf/whisper-subtitles 38020
- https://replicate.com/hnesk/whisper-wordtimestamps 28889
- https://replicate.com/alqasemy2020/whisper-jax 20296
- https://replicate.com/wglodell/cog-whisperx-withprompt 19326
- https://replicate.com/daanelson/whisperx 15528
...


Or you can dump all the model data to a file:

```command
npx all-the-public-replicate-models > models.json
```

Note: the repo stores `models.json.gz` to keep git sizes down. The published npm package still ships `models.json`.

[^1]: Technically it's not _all_ the models, but every model that is public, has at least one published version, and has at least one example prediction.