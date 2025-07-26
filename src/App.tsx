import { useState } from 'react'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Truck className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">CP Antrean Truck</h1>
          </div>
          <p className="text-xl text-muted-foreground">Truck Queue Management System</p>
        </header>
        
        <div className="max-w-md mx-auto">
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="text-center">
              <Button onClick={() => setCount((count) => count + 1)}>
                count is {count}
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                Edit <code className="bg-muted px-1 py-0.5 rounded text-sm">src/App.tsx</code> and save to test HMR
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App