// @ts-check

import {Character} from './character.js'
import {World} from './world.js'
import {profile} from './perf.js'
import * as THREE from 'three'

import {Chart} from 'chart.js'

const p = {
  p: profile('plot', 30),
  cu: profile('chart:update', 1),
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
  windowSize = 300

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
   * @type {Map<string, Map<number, {chart: Chart, canvas: HTMLCanvasElement, box: HTMLDivElement}>>}
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

  add(chrId) {
    if (this.charts.has(chrId)) return

    this.tracks.forEach((id) => this.createChart(chrId, id))
  }

  createChart(chrId, trackId) {
    const box = document.createElement('div')

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
        labels: [],
        datasets: axes.map((a) => ({
          data: [],
          label: `${trackId}#${a}`,
          fill: false,
          borderWidth: 6,
          lineTension: 0.5,
          pointRadius: 0,
          borderColor: colors[a],
        })),
      },
      options: {
        parsing: false,
        normalized: true,
        // animation,
        interaction: {
          intersect: false,
        },
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
          // decimation: {
          //   enabled: true,
          //   algorithm: 'lttb',
          // },
        },
      },
    })

    // Initialize the charts mapping
    if (!this.charts.has(chrId)) this.charts.set(chrId, new Map())
    this.charts.get(chrId)?.set(trackId, {chart, canvas, box})

    // Append canvas to DOM
    box.appendChild(canvas)
    this.domElement?.appendChild(box)
  }

  /**
   * @param {number[]} next
   */
  updateTracks(next) {
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
          item?.box?.remove()
          map?.delete(id)
        })
      }
    })
  }

  /**
   * @param {Character} char
   */
  update(char) {
    const name = char.options.name
    if (!this.charts.has(name)) this.add(name)

    this.tracks.forEach((id) => {
      const state = this.charts.get(name)?.get(id)
      if (!state) return

      const {chart} = state
      if (!chart) return

      const track = char.currentClip?.tracks[id]
      if (!track) return

      this.view(track, char.mixer.time).forEach((df, i) => {
        chart.data.datasets[i].data = df
      })

      p.cu(() => chart.update())
    })
  }

  /**
   * @param {THREE.KeyframeTrack} track
   * @param {number} now
   * @returns {{x: number, y: number}[][]}
   */
  view(track, now) {
    const {windowSize, offset} = this

    const valueSize = track.getValueSize()
    const axes = track instanceof THREE.QuaternionKeyframeTrack ? 4 : 3

    let start = track.times.findIndex((t) => t >= now)
    start = start + offset < 0 ? start : start + offset

    const end = start + windowSize

    /** @type {{x: number, y: number}[][]} */
    const s = [...Array(axes)].map(() => [])

    track.times.slice(start, end).forEach((time, timeIdx) => {
      const offset = timeIdx * valueSize

      for (let ai = 0; ai < axes; ai++) {
        s[ai].push({x: time, y: track.values[offset + ai]})
      }
    })

    return s
  }

  get interval() {
    return 1000 / this.fps
  }

  run() {
    clearInterval(this.timer)

    this.timer = setInterval(() => {
      p.p(() => this.world?.characters?.forEach(this.update.bind(this)))
    }, this.interval)
  }
}
