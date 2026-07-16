import { useState } from 'react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Mic, Square } from 'lucide-react'

const LANGUAGES = ['English', 'Hindi', 'Punjabi', 'Marathi']

function VoiceQuery() {
  const [status, setStatus] = useState('idle') // idle | listening | processing | answered
  const [language, setLanguage] = useState('English')
  const [messages, setMessages] = useState([])

  const handleMicClick = () => {
    if (status === 'idle' || status === 'answered') {
      setStatus('listening')
    } else if (status === 'listening') {
      setStatus('processing')
      // Simulate processing → answer (replace with real API call later)
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { role: 'user', text: 'What is the best time to irrigate wheat?' },
          { role: 'assistant', text: 'Early morning irrigation, between 6–8 AM, reduces evaporation loss and is ideal for wheat.' },
        ])
        setStatus('answered')
      }, 1500)
    }
  }

  const statusLabel = {
    idle: 'Tap the mic to ask a question',
    listening: 'Listening...',
    processing: 'Processing...',
    answered: 'Tap to ask again',
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Voice Query</h2>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      {/* Transcript */}
      <Card className="min-h-[300px] flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-sm text-center my-auto">
            Your conversation will appear here
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-2 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-white self-end'
                : 'bg-gray-100 text-text self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </Card>

      {/* Mic control */}
      <div className="flex flex-col items-center gap-3 py-4">
        <button
          onClick={handleMicClick}
          disabled={status === 'processing'}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            status === 'listening'
              ? 'bg-red-500 animate-pulse'
              : status === 'processing'
              ? 'bg-gray-300'
              : 'bg-primary hover:bg-green-800'
          }`}
        >
          {status === 'listening' ? (
            <Square size={22} className="text-white" fill="white" />
          ) : (
            <Mic size={24} className="text-white" />
          )}
        </button>
        <p className="text-sm text-gray-500">{statusLabel[status]}</p>
      </div>
    </div>
  )
}
export default VoiceQuery