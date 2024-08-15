<script lang="ts" setup>
import { ref, onMounted, ReactiveFlags } from 'vue'
import { useStore } from '@nanostores/vue'
import { runCommand } from '../command.ts'

import { switchDancers } from '../switch-dance'
import type { Ref } from 'vue'

import {
  $showPrompt,
  $valueCompleted,
  extendPromptTimeout,
  clearPromptTimeout,
  resetPrompt,
  // $nonFinalNum,
  // handleVoiceSelection,
  // $selectedChoiceKey,
  // $selectedValues,
} from '../store/choice'

import { world } from '../world'

import StepPrompt from './StepPrompt.vue'
import { soundManager } from '../ding.ts' // ding
import StageControl from './StageControl.vue'

// import { EndingKeyframes } from '../character'
// import { $currentScene } from '../store/scene'

const showPrompt = useStore($showPrompt)

const rendererElement = ref<HTMLDivElement>()

let prompt = ref('')
let executed = ref(false)
let log: Ref<string[]> = ref([])
let timer: Ref<number[]> = ref([])
let pending = ref(false)

let show = () => {}
// const plotterContainer = ref<HTMLDivElement>()

type Morph =
  | 'energy'
  | 'rotations'
  | 'space'
  // | 'reset'
  // | 'dances'
  | 'curve'
  | 'shifting'
interface Set {
  dance: string
  morph: { name: Morph; type: string; value: number }[]
  // time: number
}

const gen = async (prompt: string): Promise<{ set: Set[] }> => {
  const text = await fetch('/textgen', {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt,
    }),
  }).then((x) => x.text())
  const parsed = JSON.parse(text)
  console.log('PARSED', parsed, parsed.content)
  return parsed.parsed
  // return JSON.parse(
  //   `{"set": [{"dance": "kukpat","morph": [{"name": "energy","type": "upper","value": 150},{"name": "curve","type": "rightArm","value": 60}]},{"dance": "yokrob","morph": [{"name": "shifting","type": "left","value": 20},{"name": "space","type": "","value": 10}]},{"dance": "terry","morph": [{"name": "rotations","type": "x","value": 45}]}]}`,
  // )
}

onMounted(async () => {
  await world.preload()
  await world.setup()

  show = async () => {
    console.log('start')
    if (world.isEnding && world.flags.waitingEndingStart) {
      return
    }

    const willVisible = !showPrompt.value

    const completed = $valueCompleted.get()

    if (completed) {
      soundManager.play()
      // world.voice.enableVoice('prompt completed')
      resetPrompt()
      $showPrompt.set(true)

      return
    }

    resetPrompt()

    if (willVisible) {
      soundManager.play()
      // world.voice.enableVoice('prompt activated')
      $showPrompt.set(true)

      // start the prompt timeout countdown
      extendPromptTimeout('prompt activated', true)
    } else {
      world.voice.stop()
      $showPrompt.set(false)

      clearPromptTimeout('prompt deactivated')
    }
  }

  window.addEventListener('keydown', async (event) => {
    const el = document.getElementById('prompt')

    if (executed.value) {
      executed.value = false
      prompt.value = ''
      timer.value.forEach((t) => clearTimeout(t))
      timer.value = []
      log.value = []
      world.params.reset()
    }

    if (el) {
      el.focus()
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      document.getElementById('prompt').value = ''
      // prompt.value = ""
      pending.value = true
      const res = await gen(prompt.value)
      pending.value = false
      executed.value = true
      console.log('RES >>>>>>>', res)

      pending.value = false

      let acc = 0

      const setDance = async (set: Set) => {
        log.value = [
          ...log.value,
          `DANCE > ${set.dance} ${
            set.morph.length > 0
              ? `| ${set.morph
                  .map(
                    (morph) => `${morph.name} [${morph.type}, ${morph.value}]`,
                  )
                  .join(' + ')}`
              : ''
          }`,
        ]
        console.log('SET DANCE > ', set.dance)
        console.log('SET MORPH > ', set.morph[0])
        // world.voice.speak(set.dance)
        await switchDancers(set.dance)
        set.morph.forEach((morph) => {
          runCommand(morph.name, [morph.type, morph.value + ''])
        })
      }

      for (let i = 0; i < res.set.length; i++) {
        const set = res.set[i]
        const t = setTimeout(() => {
          setDance(set)
        }, acc * 1000)
        timer.value = [...timer.value, t]
        acc += 5 // set.time
        // await switchDancers('yokroblingImprovise')
        // runCommand('energy', ['upper', '300'])
        // runCommand('rotations', ['x', '25'])
        // runCommand('rotations', ['y', '100'])
      }
    }

    // if (event.key === ' ' || event.key === 'PageDown') {
    //   if (world.isEnding && world.flags.waitingEndingStart) {
    //     return
    //   }

    //   const willVisible = !showPrompt.value

    //   const completed = $valueCompleted.get()

    //   if (completed) {
    //     soundManager.play()
    //     world.voice.enableVoice('prompt completed')
    //     resetPrompt()
    //     $showPrompt.set(true)

    //     return
    //   }

    //   resetPrompt()

    //   if (willVisible) {
    //     soundManager.play()
    //     world.voice.enableVoice('prompt activated')
    //     $showPrompt.set(true)

    //     // start the prompt timeout countdown
    //     extendPromptTimeout('prompt activated', true)
    //   } else {
    //     world.voice.stop()
    //     $showPrompt.set(false)

    //     clearPromptTimeout('prompt deactivated')
    //   }
    // }

    // if (event.key === 'i') {
    //   if (world.panel.panel._hidden) {
    //     world.panel.panel.show(true)
    //   } else {
    //     world.panel.panel.hide()
    //   }
    // }

    // if (event.key === 'c') {
    //   world.setupControls()
    // }

    // if (event.key === 'k') {
    //   const cam = world.camera
    //   if (!cam) return

    //   const output = JSON.stringify({
    //     position: cam.position.toArray(),
    //     rotation: cam.rotation.toArray(),
    //     zoom: cam.zoom,
    //   })

    //   navigator.clipboard.writeText(output)
    // }

    // if ((event.key === 'e' || event.key === 'ำ') && event.ctrlKey) {
    //   if (world.flags.waitingEndingStart) {
    //     world.fadeInSceneContent()

    //     world.flags.waitingEndingStart = false
    //     return
    //   }

    //   if (world.isEnding) return $currentScene.set('BLACK')

    //   $currentScene.set('ENDING')
    // }

    // if ((event.key === 'u' || event.key === 'ี') && event.ctrlKey) {
    //   world.startShadowCharacter()
    // }

    // if ((event.key === 'i' || event.key === 'ร') && event.ctrlKey) {
    //   world.startDissolveCharacter()
    // }

    // if (event.key === 'f' && event.ctrlKey) {
    //   if (!document.fullscreenElement) {
    //     document.documentElement.requestFullscreen()
    //   } else if (document.exitFullscreen) {
    //     document.exitFullscreen()
    //   }
    // }

    // if (event.key === 'j' && event.ctrlKey) {
    //   console.log(`FORCE RESTART RECOGNIZER`)
    //   world.voice.stop()

    //   setTimeout(() => {
    //     world.voice.startRecognition('FORCE RESTART')
    //   }, 50)
    // }

    // if (event.key === 'k' && event.ctrlKey) {
    //   console.log(`FORCE STOP RECOGNIZER`)
    //   world.voice.stop()
    // }

    // if (event.key === 'l' && event.ctrlKey) {
    //   const nfn = $nonFinalNum.get()
    //   console.log(`INSERT NONFINAL NUM: ${nfn}`)

    //   if (nfn !== null) {
    //     handleVoiceSelection(nfn)
    //   }
    // }
  })

  rendererElement.value?.appendChild(world.renderer.domElement)

  // if (world.plotter.domElement) {
  //   plotterContainer.value?.appendChild(world.plotter.domElement)
  // }

  world.render()
})
</script>

<template>
  <div class="app-container">
    <div class="backdrop" />
    <div class="renderer-container" id="stage" ref="rendererElement" />

    <!-- <div ref="plotterContainer" pointer-events-none /> -->

    <StepPrompt v-if="showPrompt" />
    <StageControl />

    <div class="fixed w-screen h-screen m-4 font-mono">
      <!-- <button @click="show" class="border-0 lg:text-4 bg-neutral-900 bg-black text-white px-4 py-2 hover:bg-neutral-800 hover:cursor-pointer">
        Add Command
      </button> -->
      <div class="flex gap-2">
        <div class="text-white text-2xl">></div>
        <div class="flex items-end">
          <textarea
            v-model="prompt"
            class="max-w-md bg-transparent focus:outline-none border-none text-white text-2xl"
            type="text"
            id="prompt"
            style="
              caret-color: transparent;
              field-sizing: content;
              resize: none;
            "
          ></textarea>
          <!-- a -->
        </div>
      </div>
    </div>

    <div class="absolute bottom-4 flex gap-2 font-mono p-6" v-if="pending">
      <div
        class="bg-red-500 aspect-square h-7 animate__rotateIn animate__infinite shadow relative z-2 flex items-center justify-center animate__animated"
      />
      <div class="text-white p-1 w-min">processing</div>
    </div>

    <div
      class="absolute bottom-4 flex flex-col gap-2 font-mono p-6"
      v-if="executed"
    >
      <div class="bg-red-500 text-white p-1 w-min">executing</div>
      <div class="text-sm text-neutral-500">
        <div v-for="i in log">{{ i }}</div>
      </div>
    </div>
  </div>
</template>
