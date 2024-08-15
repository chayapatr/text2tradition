import OpenAI from 'openai'
import z from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const run = async (apiKey, prompt) => {
  const openai = new OpenAI({
    apiKey,
  })

  // const completion = await openai.chat.completions.create({
  //   model: 'gpt-4o-mini',
  //   messages: [
  //     { role: 'system', content: 'You are a helpful assistant.' },
  //     {
  //       role: 'user',
  //       content: 'Write a haiku about recursion in programming.',
  //     },
  //   ],
  // })

  // Set {
  //   dance: string
  //   morph: { key: Morph; value: [string, string] }[]
  //   time: number
  // }

  const Morph = z.union([
    z.object({
      name: z.literal('energy'),
      type: z.enum(['upper', 'lower']),
      value: z.number(),
    }),
    z.object({
      name: z.literal('curve'),
      type: z.enum(['body', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']),
      value: z.number(),
    }),
    z.object({
      name: z.literal('shifting'),
      type: z.enum(['left', 'right']),
      value: z.number(),
    }),
    z.object({
      name: z.literal('space'),
      type: z.literal(''),
      value: z.number(),
    }),
    z.object({
      name: z.literal('rotations'),
      type: z.enum(['x', 'y', 'z']),
      value: z.number(),
    }),
    // z.object({
    //   name: z.literal('speed'),
    //   type: z.literal(''),
    //   value: z.number(),
    // }),
  ])

  const Set = z.object({
    // dance: z.number(),
    dance: z.number(), // z.enum(['kukpat', 'yokrob', 'yokroblingImprovise', 'terry']), // z.number()
    morph: z.array(Morph),
    description: z.string(),
  })

  const Sets = z.object({
    set: z.array(Set),
  })

  const context = `You are a Thai traditional dance master, you're creating a new dance by composing "Mae Bot", the alphabet of thai dance, into a repertoire.`
  const maebot = `Here's the detail about each Mae Bot
    [{"thai":"เทพประนม","english":"The Salutation of the Angels","pronounce":"Thep-pra-nom","pose":1},{"thai":"ปฐม","english":"The Beginning","pronounce":"Pra-thom","pose":2},{"thai":"พรหมสี่หน้า","english":"The Four-Faced Brahma","pronounce":"Prom-see-na","pose":3},{"thai":"สอดสร้อยมาลา","english":"Stringing a Garland","pronounce":"Sod-soi-ma-la","pose":4},{"thai":"ช้านางนอน","english":"Lulling a Lady to Sleep","pronounce":"Cha-nang-non","pose":5},{"thai":"ผาลาเพียงไหล่","english":"A Hillock Reaching Only Up to the Shoulder ","pronounce":"Pa-la-peang-lai","pose":6},{"thai":"พิศมัยเรียงหมอน","english":"An Intimate Love","pronounce":"Pis-sa-mai-reang-mon","pose":7},{"thai":"กังหันร่อน","english":"A Flying Turbine","pronounce":"Kang-han-ron","pose":8},{"thai":"ภมรเคล้า","english":"A Bee Wallowing in a Flower","pronounce":"Pa-morn-klaow","pose":9},{"thai":"แขกเต้าเข้ารัง","english":"A Parakeet Entering the Nest","pronounce":"Kak-tao-khao-rang","pose":10},{"thai":"กระต่ายชมจันทร์","english":"A Rabbit Admiring the Moon","pronounce":"Kra-tai-chom-jan","pose":11},{"thai":"จันทร์ทรงกลด","english":"A Moon Halo","pronounce":"Jan-song-klod","pose":12},{"thai":"พระรถโยนสาร","english":"Phra Rod Throwing an Epistle","pronounce":"Pra-rod-yon-sarn","pose":13},{"thai":"จ่อเพลิงกาล","english":"Lighting Up a Great Fire","pronounce":"Jaw-plaeng-karn","pose":14},{"thai":"หณุมานผลาญยักษ์","english":"Hanuman Kills the Giants","pronounce":"Hanuman-plarn-yak","pose":15},{"thai":"พระรามโก่งศร (พระหริรักษ์โก่งศิลป์)","english":"Rama Arches His Arrow","pronounce":"Pra-ram-kong-sorn","pose":16},{"thai":"ช้างประสานงา (คชรินทร์ประสานงา)","english":"Elephants Clashing Their Tusks","pronounce":"Chang-pra-sarn-nga","pose":17},{"thai":"ช้างสบัดหญ้า","english":"An Elephant Shaking Grasses","pronounce":"Chang-sa-bad-nha","pose":18},{"thai":"ขี่ม้าตีคลี","english":"Playing Horseback Polo","pronounce":"Kee-ma-tee-klee","pose":19},{"thai":"สารถีชักรถ","english":"A Charioteer Controlling a Chariot","pronounce":"Sa-ra-tee-chak-rod","pose":20},{"thai":"กลดพระสุเมรุ","english":" The Aureole of the Sumeru Mountain","pronounce":"Glod-pra-su-main","pose":21},{"thai":"ตระเวนเวหา","english":"Flying through the Sky","pronounce":"Tra-wain-way-ha","pose":22},{"thai":"นาคาม้วนหาง","english":"Naga Rolling Its Tail","pronounce":"Na-ga-muan-hang","pose":23},{"thai":"กวางเดินดง","english":"A Deer Wandering in a Forest","pronounce":"Kwang-dern-dong","pose":24},{"thai":"หงส์ลีลา","english":"A Swan Gliding","pronounce":"Hong-lee-la","pose":25},{"thai":"ชักแป้งผัดหน้า","english":"Powdering the Face","pronounce":"Chak-pang-pad-na","pose":26},{"thai":"เหราเล่นน้ำ","english":"A Hera Playing in Water","pronounce":"He-ra-len-nam","pose":27},{"thai":"กินนรเลียบถ้ำ","english":"A Kinnorn Walking Around the Cave","pronounce":"Kin-norn-leab-tam","pose":28},{"thai":"ยังคิดประดิษฐ์รำ","english":"Creating New Dance Poses","pronounce":"Young-kid-pra-dit-tam","pose":29},{"thai":"กระหวัดเกล้า","english":"Tidying Up the Hair","pronounce":"Kra-wat-klaow","pose":30},{"thai":"ตีโทนโยนทับ","english":"Beating the Drum","pronounce":"Tee-ton-yon-tap","pose":31},{"thai":"งูขว้างค้อน","english":"Malayan Pit Viper","pronounce":"Ngu-kwang-kon","pose":32},{"thai":"มัจฉาชมสาคร","english":"A Fish Swimming in a River","pronounce":"Mad-cha-chom-sa-korn","pose":33},{"thai":"กินนรฟ้อนโอ้","english":"A Kinnorn Dancing","pronounce":"Kin-norn-forn-oh","pose":34},{"thai":"สิงห์โตเล่นหาง","english":"A Lion Playing with Its Tail","pronounce":"Sing-toe-len-hang","pose":35},{"thai":"นางกล่อมตัว","english":"A Lady Swaying Her Body","pronounce":"Nang-klom-tuo","pose":36},{"thai":"บัวชูฝัก","english":"A Blooming Lotus","pronounce":"Buo-choo-fag","pose":37},{"thai":"ขอนทิ้งอก","english":"Kon Ting Oak","pronounce":"Kon-ting-oak","pose":38},{"thai":"พระลักษณ์แผลงฤทธิ์","english":"Lakshmana's Rampant","pronounce":"Pra-lak-plang-rit","pose":39},{"thai":"เสือทำลายห้าง","english":"A Tiger Destroying a Hunter Lookout Tower","pronounce":"Suae-tam-lai-hang","pose":40},{"thai":"ช้างทำลายโรง","english":"An Elephant Destroying a Shed","pronounce":"Chang-tam-lai-rong","pose":41},{"thai":"ฉุยฉายเข้าวัง","english":"Gliding into a Palace","pronounce":"Chui-chai-khao-wang","pose":42},{"thai":"หนังหน้าไฟ","english":"A Shadow Play Before the Funeral","pronounce":"Nang-na-fai","pose":43},{"thai":"เครือวัลย์พันไม้","english":"An Ivy Creeping Around a Tree","pronounce":"Krua-wan-pan-mai","pose":44},{"thai":"เยื้องพายกฐิน","english":"Yuang Pai Kathin","pronounce":"Yuang-pai-ka-tin","pose":45},{"thai":"มังกรเล่นน้ำ (มังกรเที่ยวหาวาริน)","english":"A Dragon Playing in the Water","pronounce":"Mang-korn-len-nam","pose":46},{"thai":"ลมพัดยอดตอง","english":"A Wind Blowing the Top of a Banana Leaf","pronounce":"Lom-pad-yod-thong","pose":47},{"thai":"จีนสาวไส้","english":"A Chinese Disembowel Themselves","pronounce":"Jeen-sao-sai","pose":48},{"thai":"วิสัยแทงตรี","english":"Wi Sai Tang Tri","pronounce":"Wi-sai-tang-tri","pose":49},{"thai":"ชนีร่ายไม้","english":"A Gibbon Swinging Between the Trees","pronounce":"Cha-nee-rai-mai","pose":50}]
  `
  const six = `In addition, you should morph the dance by the following "Six Elements" of the dance to make it more compelling and meaningful.
  Here's the detail about each elments
  [{"name":"Energy","detail":"This principle represents the dynamic range of motion in different parts of the body over time, which is important to the aesthetics of Mae Bot Yai, such as the unique knee movements and rhythmic stamping actions. To computationally model energy, the algorithm scales the timing of the different groups of the limb’s animation keyframes to increase or decrease the velocity of each individual part’s movements, resulting in a variation of movement speed across the bodies."},{"name":"Axis Points","detail":"This principle represents key pivot points and body segments, which serve as the reference points for hand movement. The hand points towards this reference point, creating elaborate hand and finger gestures in Mae Bot Yai. To computationally model this principle, the algorithm applies inverse kinematics and smooth linear interpolation to gradually interpolate the position and rotation of arm and leg limbs towards the core axis points. The original movement is altered to gravitate towards the core skeletal axes points."},{"name":"Circles & Curves","detail":"This principle represents the circular and curved movement trajectories with rounded rather than linear pathway transformations, which make the Mae Bot Yai dance fluid, graceful, and pleasing to watch. To computationally model this principle, we apply mathematical equations to the rotational quaternions of the limb’s animation keyframes, such as a Gaussian smoothing filter, derivatives, low-pass, and high-pass filters. This results in an increase or reduction of curvature in the movement."},{"name":"Shifting Relation","detail":"Investigating how transitions between movements and poses direct audience attention and focus to different body parts and actions. Analyzing how progressions from one form to another create a seamless flow."},{"name":"External Body Space","detail":"This principle represents the negative geometric shapes outside the body that create beauty in Mae Bot Yai. In order to computationally model this principle, the algorithm detects transition signals between sequence positions to slow down the movement and influence the audience to see the negative space in the frozen pose. The algorithm identifies the movement sequences containing minimal rotational changes and then extends the timing of the animation keyframe for those sequences to pause the movement. The resulting movement highlights the external spaces around and within the dancer’s body."},{"name":"Synchronic Limbs","detail":"Analyzing the coordinated movement between different limbs, sides, or parts of the body. Looking at synchronous versus asynchronous body movements."}]
  `

  const rule = `
  you'll be given a story, and you should create a dance accoring to the story and provide a description (in description field) of why each Mae Bot and the morph (six elements) is respectively selected according to its name and your analysis of Mae Bot meaning (e.g. Salulation of the Angels may be selected as a pose for greeting) without mentioning the pose name again (we have an interface mentioning that already)
  please be noted that
  - dance must be ranged from 1 to 50
  - range of morph value is 0-100 except speed and energy that will be 0-300
  - sets should have less than 10 set and morph should be less than 3 per set`

  // dance can be ranged from number 1 to 59,
  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: `
        ${context}
        ${maebot}
        ${six}
        ${rule}
        `,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(Sets, 'sets_response'),
  })

  console.log('>', completion.choices[0].message)
  return completion.choices[0].message
}

export async function onRequest({ request, env }) {
  // const res = await run(env.OPENAI_API_KEY)
  const body = await request.text()
  const res = await run(env.OPENAI_API_KEY, JSON.parse(body).prompt)
  // const res = {
  //   role: 'assistant',
  //   content:
  //     'Functions call again,  \n' +
  //     'Infinite loops intertwine,  \n' +
  //     'Depth of thought unfolds.',
  //   refusal: null,
  // }
  // return new Response(JSON.stringify(body))
  return new Response(JSON.stringify(res))
}
