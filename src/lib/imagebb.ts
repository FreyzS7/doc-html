// ImageBB API integration for image uploads
// Get a free API key from https://api.imgbb.com/

const IMAGEBB_API_KEY = process.env.IMAGEBB_API_KEY || 'YOUR_API_KEY_HERE'

export interface ImageBBUploadResponse {
  success: boolean
  data: {
    id: string
    title: string
    url_viewer: string
    url: string
    display_url: string
    width: number
    height: number
    size: number
    time: number
    expiration: number
    image: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    thumb: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    medium: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    delete_url: string
  }
  status: number
}

export async function uploadImageToImageBB(imageBuffer: ArrayBuffer): Promise<string> {
  console.log('ImageBB API Key configured:', IMAGEBB_API_KEY !== 'YOUR_API_KEY_HERE' ? 'Yes' : 'No')
  
  if (IMAGEBB_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('ImageBB API key not configured. Please set NEXT_PUBLIC_IMAGEBB_API_KEY environment variable.')
  }

  try {
    console.log('Converting ArrayBuffer to base64...')
    // Convert ArrayBuffer to base64
    const base64 = arrayBufferToBase64(imageBuffer)
    console.log('Base64 conversion complete, length:', base64.length)
    
    const formData = new FormData()
    formData.append('image', base64)

    console.log('Making request to ImageBB API...')
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGEBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    })

    console.log('ImageBB API response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('ImageBB API error response:', errorText)
      throw new Error(`ImageBB API error: ${response.status} ${response.statusText}`)
    }

    const result: ImageBBUploadResponse = await response.json()
    console.log('ImageBB API response:', result)
    
    if (!result.success) {
      throw new Error('ImageBB upload failed')
    }

    // Fix domain issue: ImageBB API returns i.ibb.co but actual URLs use i.ibb.co.com
    const fixImageBBDomain = (url: string): string => {
      if (url && url.includes('i.ibb.co/')) {
        return url.replace('i.ibb.co/', 'i.ibb.co.com/')
      }
      return url
    }
    
    // Use the primary URL with domain fix (skip validation to avoid timeouts)
    const imageUrl = fixImageBBDomain(result.data.url) || fixImageBBDomain(result.data.display_url)
    
    console.log('Original URL:', result.data.url)
    console.log('Fixed URL:', imageUrl)
    console.log('ImageBB upload successful, using URL:', imageUrl)
    
    return imageUrl
  } catch (error) {
    console.error('Error uploading to ImageBB:', error)
    throw error
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