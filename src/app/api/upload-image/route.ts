import { NextRequest, NextResponse } from 'next/server'

const IMAGEBB_API_KEY = process.env.IMAGEBB_API_KEY || 'YOUR_API_KEY_HERE'

export async function POST(request: NextRequest) {
  try {
    if (IMAGEBB_API_KEY === 'YOUR_API_KEY_HERE') {
      return NextResponse.json(
        { error: 'ImageBB API key not configured. Please set IMAGEBB_API_KEY environment variable.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      )
    }

    // Convert file to ArrayBuffer then to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = arrayBufferToBase64(arrayBuffer)

    // Upload to ImageBB
    const uploadFormData = new FormData()
    uploadFormData.append('image', base64)

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`, {
      method: 'POST',
      body: uploadFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ImageBB API error response:', errorText)
      return NextResponse.json(
        { error: `ImageBB API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'ImageBB upload failed' },
        { status: 500 }
      )
    }

    // Fix domain issue: ImageBB API returns i.ibb.co but actual URLs use i.ibb.co.com
    const fixImageBBDomain = (url: string): string => {
      if (url && url.includes('i.ibb.co/')) {
        return url.replace('i.ibb.co/', 'i.ibb.co.com/')
      }
      return url
    }
    
    const imageUrl = fixImageBBDomain(result.data.url) || fixImageBBDomain(result.data.display_url)
    
    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Error uploading to ImageBB:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}