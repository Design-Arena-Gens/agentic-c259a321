import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getCourseContext } from '@/lib/context'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages provided' },
        { status: 400 }
      )
    }

    const courseContext = getCourseContext()

    const systemPrompt = `You are an expert Amity University professor and study assistant. Your role is to help students deeply understand their course materials.

${courseContext ? `COURSE MATERIALS CONTEXT:\n${courseContext}\n\n` : ''}

Your teaching approach:
1. **Deep Explanations**: Don't just give answers - explain the WHY and HOW behind concepts
2. **Step-by-Step**: Break down complex topics into digestible steps
3. **Real Examples**: Use practical examples and analogies to clarify concepts
4. **Multiple Perspectives**: Explain concepts from different angles to ensure understanding
5. **Encouraging**: Be patient, supportive, and encouraging
6. **Comprehensive**: Cover all aspects of a topic thoroughly
7. **Check Understanding**: Ask clarifying questions when needed

When answering:
- Start with a clear, direct answer
- Then provide detailed explanation with context
- Use examples, diagrams (described in text), or analogies
- Connect to related concepts from the course materials
- Highlight key takeaways
- Suggest practice problems or further reading when relevant

If you don't have specific course materials, use your general academic knowledge to provide the best educational support possible.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat error:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process your question' },
      { status: 500 }
    )
  }
}
