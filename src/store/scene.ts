import { atom, onNotify } from 'nanostores'

import { world } from '../world'

export type SceneMode = 'BLACK' | 'ENDING'

export const $currentScene = atom<SceneMode>('BLACK')

onNotify($currentScene, async () => {
  const mode = $currentScene.get()

  console.log(`> setting scene to ${mode}`)

  // Two characters transitioning from body to shadow
  if (mode === 'ENDING') {
    // Disable position lock as we need characters to walk
    world.params.lockPosition = false
  }

  // Large characters dancing
  if (mode === 'BLACK') {
    world.params.lockPosition = true
  }

  // Fade out the current scene...
  await world.fadeOut()
  await world.setup()
  await world.fadeIn()

  console.log(`> next scene loaded`)
})
