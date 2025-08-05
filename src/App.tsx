import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { WarehousePage } from '@/pages/WarehousePage'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/warehouse/:warehouseId" element={<WarehousePage />} />
      </Routes>
    </Router>
  )
}

export default App