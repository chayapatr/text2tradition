import * as THREE from 'three'

import Stats from 'three/addons/libs/stats.module.js'
import {OrbitControls} from 'three/addons/controls/OrbitControls.js'

import {Panel} from './panel.js'
import {Character} from './character.js'
import {Params} from './overrides.js'
import {profile} from './perf.js'
import {debounce} from './utils.js'

export class World {
  clock = new THREE.Clock()
  scene = new THREE.Scene()
  renderer = new THREE.WebGLRenderer({antialias: true})
  stats = new Stats()
  container = document.getElementById('container')
  params = new Params()
  panel = new Panel(this.params)

  /** @type {Character[]} */
  characters = []

  /** @type {THREE.PerspectiveCamera} */
  camera = null

  setup() {
    // Setup background
    this.scene.background = new THREE.Color(0xdedede)
    this.scene.fog = new THREE.Fog(0xdedede, 10, 50)

    // Setup the scenes
    this.setupLights()
    this.setupPlane()
    this.setupRenderer()
    this.setupCamera()
    this.setupControls()
    this.setupPanel()
    this.setupCharacters()

    // Setup elements
    this.container.appendChild(this.renderer.domElement)
    this.container.appendChild(this.stats.domElement)

    // Expose the world instance
    window.world = this
  }

  render() {
    requestAnimationFrame(this.render.bind(this))

    // Update mixers for each character
    const delta = this.clock.getDelta()

    for (const character of this.characters) {
      if (character.mixer) character.mixer.update(delta)
    }

    // Render the scene
    this.stats.update()
    this.renderer.render(this.scene, this.camera)
  }

  setupLights() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xfefefe, 4)
    hemiLight.position.set(0, 20, 0)
    this.scene.add(hemiLight)

    const dLight = new THREE.DirectionalLight(0xffffff, 4)
    dLight.position.set(3, 10, 10)
    dLight.castShadow = true
    dLight.shadow.camera.top = 2
    dLight.shadow.camera.bottom = -2
    dLight.shadow.camera.left = -2
    dLight.shadow.camera.right = 2
    dLight.shadow.camera.near = 0.1
    dLight.shadow.camera.far = 40
    this.scene.add(dLight)
  }

  setupPlane() {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({color: 0xcbcbcb, depthWrite: false})
    )

    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    this.scene.add(plane)
  }

  setupRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
  }

  setupCamera() {
    // Setup camera
    const aspect = window.innerWidth / window.innerHeight
    this.camera = new THREE.PerspectiveCamera(45, aspect, 1, 100)
    this.camera.position.set(-1, 2, 3)
  }

  setupControls() {
    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enablePan = true
    controls.enableZoom = true
    controls.target.set(0, 1, 0)
    controls.update()
  }

  addResizeHandler() {
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()

      renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  /**
   * @param {string} name
   * @returns {Character}
   */
  characterByName(name) {
    return this.characters.find((c) => c.name === name)
  }

  setupPanel() {
    this.panel.handlers.delay = debounce(() => this.updateParams(), 100)
    this.panel.handlers.energy = debounce(() => this.updateParams(), 100)

    this.panel.handlers.rotation = debounce(() => {
      return this.updateParams({rotation: true})
    }, 100)

    this.panel.handlers.timescale = () => {
      for (const character of this.characters) {
        character.mixer.timeScale = this.params.timescale
      }
    }

    /** @param {keyof typeof Params.prototype.characters} name */
    this.panel.handlers.character = (name) => {
      const character = this.characterByName(name)
      const config = this.params.characters[name]

      character.options.model = config.model
      character.setup()
    }

    /** @param {keyof typeof Params.prototype.characters} name */
    this.panel.handlers.action = (name) => {
      const action = this.params.characters[name].action

      this.characterByName(name).playByName(action)
    }

    this.panel.createPanel()
  }

  updateParams(flags) {
    profile('update', () => {
      for (const character of this.characters) {
        character.updateParams(flags)
      }
    })
  }

  /**
   * @param {typeof Character.prototype.options} config
   **/
  async addCharacter(config) {
    const character = new Character(config)
    await character.setup(this.scene, this.params)
    this.characters.push(character)
  }

  async setupCharacters() {
    this.addCharacter({
      name: 'first',
      model: 'robot',
      action: 'no.33_..001',
      position: [-0.5, 0, 0],
      freezeParams: true,
    })

    this.addCharacter({
      name: 'second',
      model: 'abstract',
      action: 'no.33_.',
      position: [0.5, 0, 0.5],
    })
  }
}
