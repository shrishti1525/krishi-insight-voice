import { useState } from 'react'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const LANGUAGES = ['English', 'Hindi', 'Punjabi', 'Marathi']

function Settings() {
  const [name, setName] = useState('Ramesh Kumar')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [language, setLanguage] = useState('Hindi')

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <h2 className="text-2xl font-bold">Settings</h2>

      <Card className="flex flex-col gap-4">
        <p className="font-semibold text-sm text-gray-500">Farmer Profile</p>
        <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text">Preferred Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        <Button variant="primary" className="self-start">Save Changes</Button>
      </Card>
    </div>
  )
}
export default Settings