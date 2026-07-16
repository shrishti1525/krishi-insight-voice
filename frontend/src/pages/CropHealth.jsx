import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { UploadCloud, Leaf } from 'lucide-react'

function CropHealth() {
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState('idle') // idle | analyzing | done
  const [result, setResult] = useState(null)

  const handleFile = (file) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setStatus('analyzing')
    setResult(null)
    // Simulate analysis — replace with real API call later
    setTimeout(() => {
      setResult({
        issue: 'Early Leaf Blight',
        confidence: 87,
        recommendation: 'Apply a copper-based fungicide and improve field drainage.',
      })
      setStatus('done')
    }, 1800)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-2xl font-bold">Crop Health</h2>

      {/* Upload area */}
      <Card>
        <label
          htmlFor="cropImage"
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-10 cursor-pointer hover:border-primary hover:bg-green-50 transition-colors"
        >
          {preview ? (
            <img src={preview} alt="preview" className="h-40 rounded-lg object-cover" />
          ) : (
            <>
              <UploadCloud size={28} className="text-gray-400" />
              <p className="text-sm text-gray-500">Tap to upload a leaf or soil photo</p>
            </>
          )}
        </label>
        <input
          id="cropImage"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </Card>

      {/* Result / loading state */}
      {status === 'analyzing' && (
        <Card className="animate-pulse">
          <p className="text-sm text-gray-500">Analyzing image...</p>
        </Card>
      )}

      {status === 'done' && result && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Leaf size={18} className="text-primary" />
            <p className="font-semibold">{result.issue}</p>
            <Badge tone="warning">{result.confidence}% confidence</Badge>
          </div>
          <p className="text-sm text-gray-600 mb-4">{result.recommendation}</p>
          <Button variant="secondary" onClick={() => { setPreview(null); setStatus('idle'); setResult(null) }}>
            Analyze another photo
          </Button>
        </Card>
      )}
    </div>
  )
}
export default CropHealth