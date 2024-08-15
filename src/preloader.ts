import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import { Character } from './character'

export class ModelPreloader {
  ready = false
  maebotReady = false
  models: Map<string, GLTF> = new Map()

  public async setup() {
    if (this.ready) return

    const start = performance.now()

    const sources = Object.values(Character.sources).filter(
      (src) => src && src === 'subinwaiting.glb',
    )

    console.log(`-- starting GLTF preload --`)

    await Promise.all(sources.map((src) => this.load(src)))

    console.log(`-- GLTF preload took ${performance.now() - start}ms`)

    this.ready = true
  }

  public async maebot() {
    if (this.maebotReady) return

    const start = performance.now()

    const sources = Object.values(Character.sources).filter(
      (src) => src && src.endsWith('.glb'),
    )

    console.log(`-- starting GLTF preload --`)

    await Promise.all(sources.map((src) => this.load(src)))

    console.log(`-- GLTF preload took ${performance.now() - start}ms`)

    this.maebotReady = true
  }

  private async load(source: string) {
    try {
      const now = performance.now()

      const draco = new DRACOLoader()
      draco.setDecoderPath(`https://www.gstatic.com/draco/v1/decoders/`)
      draco.preload()

      const loader = new GLTFLoader()
      loader.setDRACOLoader(draco)

      const model = await loader.loadAsync(`/models/${source}`)

      this.models.set(source, model)

      const time = (performance.now() - now).toFixed(2)
      console.log(`-- pre-loaded ${source} in ${time} --`)
    } catch (error) {
      console.error(`-- failed to load ${source} --`, error)
    }
  }

  public get(source: string): GLTF | undefined {
    return this.models.get(source)
  }
}

export const preloader = new ModelPreloader()
