import OpenAI from 'openai'
import z from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const run = async (apiKey) => {
  console.log('run! hello!', apiKey)

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
    dance: z.enum(['kukpat', 'yokrob', 'yokroblingImprovise', 'terry']),
    morph: z.array(Morph),
  })

  const Sets = z.object({
    set: z.array(Set),
  })

  // dance can be ranged from number 1 to 59,
  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are an automated object schema analyzer',
      },
      {
        role: 'user',
        content: `provide sample data from the including respose format,
          be noted that
          range of morph value is 0-100 except speed and energy that will be 0-300
          sets should have less than 5 set and morph should be less than 3 per set
          `,
      },
    ],
    response_format: zodResponseFormat(Sets, 'sets_response'),
  })

  console.log('>', completion.choices[0].message)
  return completion.choices[0].message
}

export async function onRequest({ request, env }) {
  // const res = await run(env.OPENAI_API_KEY)
  console.log('RUN!')
  const res = await run(env.OPENAI_API_KEY)
  // const body = await request.text()
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
