import { useState } from 'react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { Droplets, Thermometer, Power } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const fields = [
  { id: 1, name: 'Field A - Wheat', moisture: 42, temp: 27, irrigation: 'active' },
  { id: 2, name: 'Field B - Sugarcane', moisture: 58, temp: 29, irrigation: 'idle' },
  { id: 3, name: 'Field C - Cotton', moisture: 31, temp: 31, irrigation: 'idle' },
]

const history = [
  { time: '6AM', temp: 22 },
  { time: '9AM', temp: 25 },
  { time: '12PM', temp: 30 },
  { time: '3PM', temp: 32 },
  { time: '6PM', temp: 28 },
  { time: '9PM', temp: 24 },
]

function FieldMonitor() {
  const [selected, setSelected] = useState(fields[0].id)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Field Monitor</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fields.map((field) => (
          <Card
            key={field.id}
            className={`cursor-pointer transition-all ${
              selected === field.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelected(field.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">{field.name}</p>
              <Badge tone={field.irrigation === 'active' ? 'success' : 'neutral'}>
                <span className="flex items-center gap-1">
                  <Power size={10} /> {field.irrigation}
                </span>
              </Badge>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Droplets size={16} className="text-blue-500" /> {field.moisture}%
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Thermometer size={16} className="text-orange-500" /> {field.temp}°C
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <p className="font-semibold mb-4">Temperature — Today</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="time" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="temp" stroke="#D98E27" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
export default FieldMonitor
