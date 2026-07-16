import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import VoiceQuery from './pages/VoiceQuery'
import CropHealth from './pages/CropHealth'
import FieldMonitor from './pages/FieldMonitor'
import Settings from './pages/Settings'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/voice-query" element={<VoiceQuery />} />
          <Route path="/crop-health" element={<CropHealth />} />
          <Route path="/field-monitor" element={<FieldMonitor />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
export default App
