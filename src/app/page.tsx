'use client'
import { useState } from 'react'
import { convertWordToHtml } from '@/lib/converter'

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [converting, setConverting] = useState(false)
  const [results, setResults] = useState<Array<{name: string, html: string, originalPath: string}>>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
    setResults([])
  }

  const handleConvert = async () => {
    if (!files || files.length === 0) return

    setConverting(true)
    const newResults: Array<{name: string, html: string}> = []

    for (let i = 0; i < files.length; i++) {
      try {
        const html = await convertWordToHtml(files[i])
        const file = files[i] as any
        const originalPath = file.path || file.webkitRelativePath || ''
        newResults.push({
          name: files[i].name.replace('.docx', '.html'),
          html,
          originalPath: originalPath ? originalPath.substring(0, originalPath.lastIndexOf('\\')) : ''
        })
      } catch (error) {
        console.error(`Error converting ${files[i].name}:`, error)
      }
    }

    setResults(newResults)
    setConverting(false)
  }

  const downloadHtml = (filename: string, html: string) => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAll = () => {
    results.forEach(result => {
      downloadHtml(result.name, result.html)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Word to HTML Converter
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Word Documents (.docx)
            </label>
            <input
              type="file"
              multiple
              accept=".docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {files && files.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Selected {files.length} file(s):
              </p>
              <ul className="text-sm text-gray-500">
                {Array.from(files).map((file, index) => (
                  <li key={index}>• {file.name}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={handleConvert}
            disabled={!files || files.length === 0 || converting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {converting ? 'Converting...' : 'Convert to HTML'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Conversion Results ({results.length})
              </h2>
              <button
                onClick={downloadAll}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Download All
              </button>
            </div>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{result.name}</h3>
                      {result.originalPath && (
                        <p className="text-xs text-gray-500 mt-1">
                          Original location: {result.originalPath}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => downloadHtml(result.name, result.html)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded transition-colors"
                    >
                      Download
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                      {result.html.substring(0, 500)}...
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
