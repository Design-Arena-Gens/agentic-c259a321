import { NextRequest, NextResponse } from 'next/server'
import { setCourseContext } from '@/lib/context'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    let allText = ''

    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const content = Buffer.from(buffer).toString('utf-8')

      allText += `\n\n=== ${file.name} ===\n\n${content}`
    }

    setCourseContext(allText)

    return NextResponse.json({
      success: true,
      message: `Processed ${files.length} file(s)`,
      contextLength: allText.length
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process files' },
      { status: 500 }
    )
  }
}
