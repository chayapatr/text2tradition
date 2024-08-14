import OpenAI from 'openai'

const run = async (apiKey) => {
  console.log('run! hello!', apiKey)

  const openai = new OpenAI({
    apiKey,
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      {
        role: 'user',
        content: 'Write a haiku about recursion in programming.',
      },
    ],
  })

  console.log('>', completion.choices[0].message)
  return completion.choices[0].message
}

export async function onRequest({ request, env }) {
  // const res = await run(env.OPENAI_API_KEY)
  const body = await request.text()
  const res = {
    role: 'assistant',
    content:
      'Functions call again,  \n' +
      'Infinite loops intertwine,  \n' +
      'Depth of thought unfolds.',
    refusal: null,
  }
  // return new Response(JSON.stringify(body))
  return new Response(body)
}
