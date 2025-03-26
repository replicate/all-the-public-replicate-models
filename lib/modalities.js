import {get} from 'lodash-es'

export function getModalities(model) {
  const inputs = getInputModalities(model)
  const outputs = getOutputModalities(model)
  const modalities = []
  for (const input of inputs) {
    for (const output of outputs) {
      modalities.push(`${input} to ${output}`)
    }
  }
  return modalities  
}

export function getOutputModalities(model) {
  const example = get(model, 'default_example.output')
  const schema = get(model, 'latest_version.openapi_schema.components.schemas.Output')
  const modalities = []

  if (quacksLikeText({example, schema})) modalities.push('text')
  if (quacksLikeImage({example, schema})) modalities.push('image')
  if (quacksLikeVideo({example, schema})) modalities.push('video')
  if (quacksLikeAudio({example, schema})) modalities.push('audio')
  if (quacksLikeSpeech({example, schema})) modalities.push('speech')

  return modalities
}

export function getInputModalities(model) {
  const example = get(model, 'default_example.input')
  const schema = get(model, 'latest_version.openapi_schema.components.schemas.Input')
  const modalities = []

  if (quacksLikeText({example, schema})) modalities.push('text')
  if (quacksLikeImage({example, schema})) modalities.push('image')
  if (quacksLikeVideo({example, schema})) modalities.push('video')
  if (quacksLikeAudio({example, schema})) modalities.push('audio')
  if (quacksLikeSpeech({example, schema})) modalities.push('speech')

  return modalities
}

function quacksLikeText(obj) {
  if (obj.schema?.type === 'string' && obj.schema?.format !=="uri") return true

  const str = JSON.stringify(obj).toLowerCase()
  if (str.includes('prompt')) return true
  return false
}

function quacksLikeImage(obj) {
  const str = JSON.stringify(obj).toLowerCase()
  if (str.includes('image')) return true
  if (str.includes('img')) return true

  if (str.includes('.jpg')) return true
  if (str.includes('.jpeg')) return true
  if (str.includes('.png')) return true
  if (str.includes('.webp')) return true
  return false
}

function quacksLikeVideo(obj) {
  const str = JSON.stringify(obj).toLowerCase()
  if (str.includes('video')) return true

  if (str.includes('.avi')) return true
  if (str.includes('.m4v')) return true
  if (str.includes('.mkv')) return true
  if (str.includes('.mov')) return true
  if (str.includes('.mp4')) return true
  if (str.includes('.mpeg')) return true
  if (str.includes('.mpg')) return true
  if (str.includes('.webm')) return true
  if (str.includes('.wmv')) return true
  return false
}

function quacksLikeAudio(obj) {
  const str = JSON.stringify(obj).toLowerCase()
  if (str.includes('audio')) return true
  if (str.includes('music')) return true
  if (str.includes('song')) return true

  if (str.includes('.aiff')) return true
  if (str.includes('.flac')) return true
  if (str.includes('.m4a')) return true
  if (str.includes('.mp3')) return true
  if (str.includes('.ogg')) return true
  if (str.includes('.wav')) return true
  if (str.includes('.wma')) return true
  return false
}

function quacksLikeSpeech(obj) {
  const str = JSON.stringify(obj).toLowerCase()
  if (str.includes('speech')) return true
  if (str.includes('voice')) return true
  return false
}