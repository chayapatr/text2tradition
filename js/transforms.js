// @ts-check

import * as THREE from 'three'

import {
  Quaternion,
  KeyframeTrack,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack,
} from 'three'

/** @type {Axis[]} */

/** @typedef {'x' | 'y' | 'z' | 'w'} Axis */
/** @typedef {{threshold?: number, axis?: Axis}} Options */
/** @typedef {(v: number[], o: Options) => number[]} Transform */

/** @param {number} n */
function factorial(n) {
  let result = 1

  for (let i = 2; i <= n; i++) {
    result *= i
  }

  return result
}

/**
 * @param {KeyframeTrack} track
 * @param {Transform} transform
 * @param {Options} options
 * @returns {Float32Array}
 **/
export function applyTrackTransform(track, transform, options = {}) {
  const axes = ['x', 'y', 'z']

  const isRotation = track instanceof QuaternionKeyframeTrack
  const isVector = track instanceof VectorKeyframeTrack

  // Temporarily disable transform for vector tracks
  if (isVector) return track.values

  // Add w axis if it's a quaternion
  // if (isRotation) axes.push('w')

  /** @type {Record<string, number[]>} */
  const series = {}

  // Setup each axis' series
  for (const a of axes) series[a] = []

  const size = track.getValueSize()

  track.times.forEach((time, timeIdx) => {
    const offset = timeIdx * size

    const q = new Quaternion().fromArray(track.values, offset)
    q.normalize()

    const e = new THREE.Euler().setFromQuaternion(q, 'XYZ')

    // Append each axis' value to their series
    for (const a of axes) series[a].push(e[a])
  })

  const {axis} = options ?? {}

  // Process each axis' data
  for (const a of axes) {
    // Exclude the axis that are not filtered
    if (axis && !axis?.includes(a)) continue

    series[a] = transform(series[a], options)
  }

  // Zip back the transformed value in each axis.
  const values = []

  for (let i = 0; i < series.x.length; i++) {
    // Convert euler back to quaternion
    const e = new THREE.Euler(series.x[i], series.y[i], series.z[i])
    const q = new Quaternion().setFromEuler(e)

    values.push(q.x, q.y, q.z, q.w)
  }

  return new Float32Array(values)
}

/** @type {Transform} */
export function lowpass(source, options) {
  const out = []

  const {threshold: windowSize = 2} = options ?? {}

  for (let i = 0; i < source.length; i++) {
    let sum = 0
    let count = 0

    for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += source[j]
      count++
    }

    out.push(sum / count)
  }

  return out
}

/** @type {Transform} */
export function highpass(source, options) {
  const out = []

  const {threshold: windowSize = 2} = options ?? {}

  for (let i = 0; i < source.length; i++) {
    let sum = 0
    let count = 0

    for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
      sum += source[j]
      count++
    }

    out.push(source[i] - sum / count)
  }

  return out
}

/** @type {Transform} */
export function gaussian(source, options) {
  const {threshold: windowSize = 2} = options ?? {}

  const sigma = windowSize / 2.0
  let sum = 0

  const gaussianKernel = []
  const out = []

  // Calculate Gaussian kernel
  for (
    let x = -Math.floor(windowSize / 2);
    x <= Math.floor(windowSize / 2);
    x++
  ) {
    let g =
      Math.exp(-(0.5 * (x / sigma) * (x / sigma))) /
      (sigma * Math.sqrt(2 * Math.PI))
    gaussianKernel.push(g)
    sum += g
  }

  // Normalize the kernel
  for (let i = 0; i < gaussianKernel.length; i++) {
    gaussianKernel[i] /= sum
  }

  for (let i = 0; i < source.length; i++) {
    let newValue = 0
    let kernelIndex = 0

    for (
      let j = Math.max(0, i - Math.floor(windowSize / 2));
      j <= Math.min(source.length - 1, i + Math.floor(windowSize / 2));
      j++
    ) {
      newValue += source[j] * gaussianKernel[Math.abs(i - j)]
      kernelIndex++
    }

    const deviation = source[i] - newValue

    // // ? Poom: avoid sudden change!
    // if (Math.abs(deviation) > 0.2) {
    //   newValue = source[i]
    // }

    // // ? Poom: avoid zero!
    // if (newValue < 0.1 || newValue > 0.9) {
    //   newValue = source[i]
    // }

    newValue = source[i]

    out.push(newValue)
  }

  return out
}

/** @type {Transform} */
function derivative(source, options) {
  const {threshold: order = 2} = options ?? {}

  const out = []

  // this represents the difference in points which is assumed to be 1
  let h = 1

  for (let i = 0; i < source.length; i++) {
    if (i - order < 0 || i + order >= source.length) {
      // boundary case where we can't compute the derivative
      out.push(0)
    } else {
      let sum = 0

      for (let j = -order; j <= order; j++) {
        if (j != 0) {
          let coeff =
            (Math.pow(-1, Math.abs(j) - 1 + order) *
              Math.pow(h, order - 1) *
              Math.pow(j, order - 1)) /
            (2 * Math.abs(j) * factorial(Math.abs(j)) * factorial(order - 1))

          sum += coeff * source[i + j]
        }
      }

      out.push(sum)
    }
  }

  return out
}

/** @type {Transform} */
function capMin(source, options) {
  const {threshold = 0.1} = options ?? {}

  let out = []

  let previous = source[0]

  for (let i = 0; i < source.length; i++) {
    if (source[i] >= threshold) {
      out.push(source[i])
      previous = source[i]
    } else {
      out.push(previous)
    }
  }

  return out
}

export const transformers = {
  lowpass,
  highpass,
  gaussian,
  derivative,
  capMin,
}
