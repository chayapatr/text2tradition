// @ts-check

import {Character} from './character.js'
import {World} from './world.js'
import {profile} from './perf.js'
import * as THREE from 'three'

import {Chart} from 'chart.js'

const p = {
  u: profile('chart', 10),
}

const colors = {
  x: 'rgb(255, 99, 132)',
  y: 'rgb(54, 162, 235)',
  z: 'rgb(255, 205, 86)',
  w: 'rgb(75, 192, 192)',
}

const layout = {
  w: 100,
  h: 50,
  cols: 2,
  top: 50,
  px: 5,
  py: 5,
}

export class Plotter {
  /**
   * How many frames per second to plot?
   */
  fps = 1

  /**
   * Number of keyframes to show; indicates how wide the time window is.
   */
  windowSize = 200

  /**
   * Number of keyframes to skip; indicates how far back in time to start.
   */
  offset = -100

  /**
   * Track index of the animation to plot.
   * @type {Set<number>}
   */
  tracks = new Set([6, 9])

  /** @type {HTMLDivElement | null} */
  domElement = null

  /**
   * Map<CharacterName, Map<TrackId, *>>
   * @type {Map<string, Map<number, {chart: Chart, canvas: HTMLCanvasElement}>>}
   **/
  charts = new Map()

  /** @type {World | null} */
  world = null

  /// Internal timer
  timer = 0

  constructor(world) {
    this.world = world

    this.prepare()
    this.run()
  }

  prepare() {
    this.domElement = document.createElement('div')

    const s = this.domElement.style
    s.position = 'fixed'
    s.left = '0px'
    s.top = `${layout.top}px`
    // s.pointerEvents = 'none'

    s.display = 'grid'
    s.gridTemplateColumns = `repeat(${layout.cols}, ${layout.w}px)`
    s.gap = `${layout.py}px ${layout.px}px`
  }

  createAnimation() {
    const totalDuration = 10000
    const delayBetweenPoints = totalDuration / this.windowSize

    const previousY = (ctx) => {
      return ctx.index === 0
        ? ctx.chart.scales.y.getPixelForValue(100)
        : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1]?.y
    }

    return {
      x: {
        type: 'number',
        easing: 'linear',
        duration: delayBetweenPoints,
        from: NaN, // the point is initially skipped
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.xStarted) {
            return 0
          }
          ctx.xStarted = true
          return ctx.index * delayBetweenPoints
        },
      },
      y: {
        type: 'number',
        easing: 'linear',
        duration: delayBetweenPoints,
        from: previousY,
        delay(ctx) {
          if (ctx.type !== 'data' || ctx.yStarted) {
            return 0
          }
          ctx.yStarted = true
          return ctx.index * delayBetweenPoints
        },
      },
    }
  }

  createChart(chrId, trackId) {
    const track = this.world?.characterByName(chrId)?.trackByKey(trackId)

    // Log the track name for debugging.
    if (chrId === 'first') console.log(`+ ${track?.name}`)

    const canvas = document.createElement('canvas')
    canvas.style.width = `${layout.w}px`
    canvas.style.height = `${layout.h}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const axes = ['x', 'y', 'z', 'w']

    // Create chart
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: axes.map((a) => ({
          parsing: false,
          normalized: true,
          data: [],
          borderWidth: 2,
          borderColor: colors[a],
        })),
      },
      options: {
        animation: false,
        parsing: false,
        normalized: true,
        responsive: false,
        maintainAspectRatio: false,
        scales: {
          x: {display: false, type: 'linear'},
          y: {display: false, type: 'linear'},
        },
        plugins: {
          legend: {
            display: false,
          },
          decimation: {
            enabled: true,
            algorithm: 'lttb',
          },
        },
      },
    })

    // Appending canvas to the DOM
    if (this.domElement) this.domElement.appendChild(canvas)

    this.charts.get(chrId)?.set(trackId, {chart, canvas})
  }

  /**
   * @param {number[]} next
   */
  select(next) {
    next.forEach((id) => {
      if (!this.tracks.has(id)) {
        console.log(`+ ${id}`)

        this.tracks.add(id)
        this.charts.forEach((_, chrId) => {
          this.createChart(chrId, id)
        })
      }
    })

    this.tracks.forEach((id) => {
      if (!next.includes(id)) {
        console.log(`- ${id}`)
        this.tracks.delete(id)

        this.charts.forEach((_, chrId) => {
          const map = this.charts.get(chrId)
          const item = map?.get(id)
          item?.chart.destroy()
          item?.canvas?.remove()
          if (item?.canvas) this.domElement?.removeChild(item.canvas)
          map?.delete(id)
        })
      }
    })
  }

  /**
   * @param {Character} char
   */
  async update(char) {
    const {name} = char.options
    const charts = this.charts.get(name)

    // Initialize the chart if it doesn't exist.
    if (!this.charts.has(name)) {
      this.charts.set(name, new Map())
      this.tracks.forEach((id) => this.createChart(name, id))
    }

    this.tracks.forEach((id) => {
      const track = char.currentClip?.tracks[id]
      if (!track) return

      const {chart} = charts?.get(id) ?? {}
      if (!chart) return

      // Apply the dataset.
      this.view(track, char.mixer.time).forEach((points, axis) => {
        chart.data.datasets[axis].data = points
        chart.data.datasets[axis].clip = false
      })
    })

    p.u(() => {
      this.tracks.forEach((t) => {
        charts?.get(t)?.chart?.update()
      })
    })
  }

  /**
   * @param {THREE.KeyframeTrack} track
   * @param {number} now
   * @returns {{x: number, y: number}[][]}
   */
  view(track, now) {
    let start = track.times.findIndex((t) => t >= now)
    start = Math.max(0, start + this.offset)

    const end = Math.min(start + this.windowSize, track.times.length)
    const valueSize = track.getValueSize()

    /** @type {{x: number, y: number}[][]} */
    const series = Array.from({length: valueSize}).map(() => [])

    for (let frame = start; frame < end; frame++) {
      const time = track.times[frame]

      for (let axis = 0; axis < valueSize; axis++) {
        series[axis].push({x: time, y: track.values[frame * valueSize + axis]})
      }
    }

    return series
  }

  get interval() {
    return 1000 / this.fps
  }

  run() {
    clearInterval(this.timer)

    this.timer = setInterval(() => {
      this.world?.characters?.forEach(this.update.bind(this))
    }, this.interval)
  }
}
