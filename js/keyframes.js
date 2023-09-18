// @ts-check

import {f32Append} from './floats.js'

/** @type {import('./transforms.js').Axis[]} */
export const AXES = ['x', 'y', 'z', 'w']

/**
 * Lengthen the keyframe tracks, so that it loops properly.
 * We are only using one animation clip, so we need to lengthen the tracks.
 *
 * @param {THREE.KeyframeTrack[]} tracks
 */
export function lengthenKeyframeTracks(tracks) {
  tracks.forEach((track) => {
    const finalTime = track.times[track.times.length - 1]
    const next = [...track.times].map((t) => t + finalTime)

    track.times = f32Append(track.times, next)
    track.values = f32Append(track.values, [...track.values])

    track.validate()
  })
}

/**
 * @param {THREE.KeyframeTrack} track
 * @param {{from: number, offset: number, windowSize: number, axes: import('./transforms.js').Axis[]}} options
 * @returns
 */
export function keyframesAt(track, options) {
  const {offset, windowSize, axes = AXES, from} = options ?? {}

  let start = track.times.findIndex((t) => t >= from)
  start = Math.max(0, start, start + offset)

  const end = Math.min(start + windowSize, track.times.length)
  const valueSize = track.getValueSize()

  /** @type {{x: number, y: number}[][]} */
  const series = Array.from({length: valueSize}).map(() => [])

  const visibility = AXES.map((a) => axes.includes(a))

  for (let frame = start; frame < end; frame++) {
    const time = track.times[frame]

    for (let axis = 0; axis < valueSize; axis++) {
      // Do not render the axis that are not visible.
      if (!visibility[axis]) continue

      series[axis].push({x: time, y: track.values[frame * valueSize + axis]})
    }
  }

  return {series, start: track.times[start], end: track.times[end]}
}

/** @param {{x: number, y: number}[]} data */
export function getAcceleration(data) {
  const start = data[0]
  const end = data[data.length - 1]

  return (end.y - start.y) / (end.x - start.x)
}

/** @param {{x: number, y: number}[][]} series */
export function getRateOfChange(series, {threshold = 0.01, skip = 1}) {
  const rates = [0]

  for (let axis = 0; axis < series.length; axis++) {
    const data = series[axis]

    let idx = 0

    for (let i = 1; i < data.length; i += skip) {
      if (!rates[idx]) rates[idx] = 0

      const delta = Math.abs(data[i]?.y - data[i - skip]?.y ?? 0)
      rates[idx] += delta < threshold ? 0 : Math.max(delta || 0, 0)

      idx++
    }
  }

  return rates
}
