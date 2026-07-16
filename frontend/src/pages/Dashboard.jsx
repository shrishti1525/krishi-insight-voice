import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const moistureData = [
  { day: 'Mon', moisture: 42 },
  { day: 'Tue', moisture: 45 },
  { day: 'Wed', moisture: 40 },
  { day: 'Thu', moisture: 38 },
  { day: 'Fri', moisture: 44 },
  { day: 'Sat', moisture: 47 },
  { day: 'Sun', moisture: 43 },
]

function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-sm text-gray-500">Active Fields</p>
          <p className="text-2xl font-bold mt-1">6</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Last Irrigation</p>
          <p className="text-2xl font-bold mt-1">2h ago</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Pending Alerts</p>
          <p className="text-2xl font-bold mt-1 flex items-center gap-2">
            3 <Badge tone="warning">Review</Badge>
          </p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Disease Detections</p>
          <p className="text-2xl font-bold mt-1 flex items-center gap-2">
            1 <Badge tone="danger">Urgent</Badge>
          </p>
        </Card>
      </div>

      <Card>
        <p className="font-semibold mb-4">Soil Moisture — Last 7 Days</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moistureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="day" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="moisture" stroke="#2F6B3C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
export default Dashboard