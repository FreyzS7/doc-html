// ImageBB API integration for image uploads
// Get a free API key from https://api.imgbb.com/

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
  try {
    console.log('Uploading image to ImageBB via API route...')
    
    // Convert ArrayBuffer to Blob for FormData
    const blob = new Blob([imageBuffer])
    const formData = new FormData()
    formData.append('image', blob, 'image.png')

    console.log('Making request to upload API...')
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    })

    console.log('API response status:', response.status)
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('API error response:', errorData)
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    console.log('ImageBB upload successful, using URL:', result.url)
    
    return result.url
  } catch (error) {
    console.error('Error uploading to ImageBB:', error)
    throw error
  }
}

