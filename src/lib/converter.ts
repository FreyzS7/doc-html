import mammoth from 'mammoth'

export async function convertWordToHtml(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  
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
      return image.read("base64").then(function(imageBuffer) {
        return {
          src: "data:" + image.contentType + ";base64," + imageBuffer
        }
      })
    })
  })
  
  return cleanHtml(result.value)
}

function cleanHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim()
}