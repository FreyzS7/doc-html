import mammoth from 'mammoth'
import { uploadImageToImageBB } from './imagebb'

// Helper function to get image dimensions and compress image
function processImage(base64: string, contentType: string): Promise<{ 
  width: number; 
  height: number; 
  compressedBase64: string;
  originalSize: number;
  compressedSize: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      
      ctx!.drawImage(img, 0, 0)
      
      // Compress image: JPEG at 85% quality for good balance
      const quality = 0.85
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
      const compressedBase64 = compressedDataUrl.split(',')[1]
      
      const originalSize = base64.length * 0.75 // approximate bytes
      const compressedSize = compressedBase64.length * 0.75
      
      console.log(`Image compression: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (${Math.round((1-compressedSize/originalSize)*100)}% reduction)`)
      
      resolve({ 
        width: img.naturalWidth, 
        height: img.naturalHeight,
        compressedBase64,
        originalSize,
        compressedSize
      })
    }
    img.onerror = () => {
      reject(new Error('Failed to load image for processing'))
    }
    img.src = `data:${contentType};base64,${base64}`
  })
}

export async function convertWordToHtml(file: File, useImageBB: boolean = false): Promise<string> {
  console.log('Converting file:', file.name, 'useImageBB:', useImageBB)
  const arrayBuffer = await file.arrayBuffer()
  
  // Get filename without extension for alt text, limit to 125 characters for SEO best practices
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "").substring(0, 125)
  
  const result = await mammoth.convertToHtml({ arrayBuffer }, {
    styleMap: [
      "p[style-name='Heading 1'] => p > strong:fresh",
      "p[style-name='Heading 2'] => p > strong:fresh", 
      "p[style-name='Heading 3'] => p > strong:fresh",
      "p[style-name='Title'] => p > strong:fresh",
      "p[style-name='Subtitle'] => p > strong:fresh",
      "b => strong",
      "i => em",
      "u => u"
    ],
    convertImage: mammoth.images.imgElement(function(image) {
      if (useImageBB) {
        console.log('ImageBB mode enabled, attempting to upload image...')
        return image.read("base64").then(async function(imageBuffer) {
          try {
            console.log('Converting image to ArrayBuffer for ImageBB upload...')
            
            // Process and compress image
            const processed = await processImage(imageBuffer, image.contentType)
            
            // Convert compressed base64 to ArrayBuffer for ImageBB upload
            const binaryString = atob(processed.compressedBase64)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            
            console.log('Uploading compressed image to ImageBB...')
            const imageBBUrl = await uploadImageToImageBB(bytes.buffer)
            console.log('Successfully uploaded to ImageBB:', imageBBUrl)
            
            return {
              src: imageBBUrl,
              width: processed.width.toString(),
              height: processed.height.toString(),
              alt: fileNameWithoutExt,
              style: `width:${processed.width}px;height:${processed.height}px;max-width:100%;height:auto`
            }
          } catch (error) {
            console.error('Failed to upload image to ImageBB, falling back to base64:', error)
            // Fallback to base64 if ImageBB upload fails
            try {
              const processed = await processImage(imageBuffer, image.contentType)
              return {
                src: "data:image/jpeg;base64," + processed.compressedBase64,
                width: processed.width.toString(),
                height: processed.height.toString(),
                alt: fileNameWithoutExt,
                style: `width:${processed.width}px;height:${processed.height}px;max-width:100%;height:auto`
              }
            } catch (dimError) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer,
                alt: fileNameWithoutExt,
                style: "max-width:100%;height:auto"
              }
            }
          }
        })
      } else {
        console.log('Using base64 mode for images')
        return image.read("base64").then(async function(imageBuffer) {
          try {
            const processed = await processImage(imageBuffer, image.contentType)
            console.log('Image processed:', processed.width, 'x', processed.height)
            return {
              src: "data:image/jpeg;base64," + processed.compressedBase64,
              width: processed.width.toString(),
              height: processed.height.toString(),
              alt: fileNameWithoutExt,
              style: `width:${processed.width}px;height:${processed.height}px;max-width:100%;height:auto`
            }
          } catch (error) {
            console.error('Failed to process image:', error)
            return {
              src: "data:" + image.contentType + ";base64," + imageBuffer,
              alt: fileNameWithoutExt,
              style: "max-width:100%;height:auto"
            }
          }
        })
      }
    })
  })
  
  return addImageStyling(cleanHtml(result.value))
}

function cleanHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim()
}

function addImageStyling(html: string): string {
  // Minimal CSS for essential image styling only
  const imageCSS = `<style>img{max-width:100%;height:auto}img[width][height]{width:auto;height:auto}</style>`
  
  // Insert minimal CSS at the beginning
  if (html.includes('<html>') || html.includes('<head>')) {
    return html.replace(/<head[^>]*>/i, (match) => match + imageCSS)
  } else {
    return imageCSS + html
  }
}