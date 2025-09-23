'use client'
import { useState } from 'react'
import { convertWordToHtml } from '@/lib/converter'

export default function Home() {
  const [files, setFiles] = useState<FileList | null>(null)
  const [converting, setConverting] = useState(false)
  const [useImageBB, setUseImageBB] = useState(true)
  const [currentProgress, setCurrentProgress] = useState({ current: 0, total: 0, fileName: '' })
  const [results, setResults] = useState<Array<{name: string, html: string, originalPath: string}>>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files)
    setResults([])
    setCurrentProgress({ current: 0, total: 0, fileName: '' })
  }

  const handleConvert = async () => {
    if (!files || files.length === 0) return

    setConverting(true)
    setCurrentProgress({ current: 0, total: files.length, fileName: '' })
    const newResults: Array<{name: string, html: string, originalPath: string}> = []

    for (let i = 0; i < files.length; i++) {
      try {
        setCurrentProgress({ current: i + 1, total: files.length, fileName: files[i].name })
        const html = await convertWordToHtml(files[i], useImageBB)
        const file = files[i] as File & { path?: string; webkitRelativePath?: string }
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
    setCurrentProgress({ current: 0, total: 0, fileName: '' })
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

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useImageBB}
                onChange={(e) => setUseImageBB(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Upload images to ImageBB (requires free API key)
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {useImageBB 
                ? 'Images will be uploaded to ImageBB and linked in HTML' 
                : 'Images will be embedded as base64 data URIs'
              }
            </p>
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

          {converting && currentProgress.total > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Converting: {currentProgress.fileName}</span>
                <span>{currentProgress.current} of {currentProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentProgress.current / currentProgress.total) * 100}%` }}
                ></div>
              </div>
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
