export interface CameraPreset {
  zoom: number
  position: [number, number, number]
  rotation: [number, number, number, 'XYZ']
}

export const CAMERA_PRESETS = {
  front: {
    zoom: 0.45,
    position: [-0.1799835844727462, 1.0133617545109455, 2.8262908802109057],
    rotation: [
      -0.3442698300021332,
      -0.05987353788133281,
      -0.02145143946651945,
      'XYZ',
    ],
  },

  zoomFirst: {
    zoom: 0.45,
    position: [0.017562729875999012, 0.4385453544466625, 2.184576428532982],
    rotation: [
      0.07954774638211351,
      -0.0007542777216278531,
      0.00006012796747340352,
      'XYZ',
    ],
  },

  endingStart: {
    position: [1.9096274095729886, 1.1589946566621263, 4.092093284691646],
    rotation: [
      -0.043840091157280846,
      0.011955373990352375,
      0.0005244481834008832,
      'XYZ',
    ],
    zoom: 0.24316203944819315,
  },

  endingSideBySide: {
    position: [1.0410581170566617, 0.6004299258516296, 4.2369931367349025],
    rotation: [
      -0.04853859521884976,
      0.23741010347786798,
      0.01142408265474794,
      'XYZ',
    ],
    zoom: 0.2985391940800849,
  },
} satisfies Record<string, CameraPreset>

export type CameraPresetKey = keyof typeof CAMERA_PRESETS
