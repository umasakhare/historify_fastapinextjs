import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import PositionTable from '../components/PositionTable'
import LoadingSpinner from '../components/LoadingSpinner'
import { Target, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Positions() {
  const router = useRouter()
  const { backtest_id } = router.query
  
  const [positions, setPositions] = useState([])
  const [backtestInfo, setBacktestInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (backtest_id) {
      loadPositions()
    }
  }, [backtest_id])

  const loadPositions = async () => {
    try {
      const [positionsResponse, backtestResponse] = await Promise.all([
        axios.get(`/api/backtest/positions/${backtest_id}`),
        axios.get(`/api/backtest/results/${backtest_id}`)
      ])
      
      setPositions(positionsResponse.data)
      setBacktestInfo(backtestResponse.data)
    } catch (error) {
      console.error('Error loading positions:', error)
      toast.error('Failed to load positions')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Layout title="Positions - Historify">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!backtestInfo) {
    return (
      <Layout title="Positions - Historify">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold mb-2">Backtest Not Found</h2>
            <p className="text-base-content/60 mb-4">
              The requested backtest could not be found.
            </p>
            <button 
              onClick={() => router.push('/backtest')}
              className="btn btn-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Backtests
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Positions - Historify">
      <div className="space-y-6">
        {/* Header */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  Positions
                </h1>
                <p className="text-base-content/60 mt-1">
                  {backtestInfo.name} • {backtestInfo.symbol} • {backtestInfo.strategy_name}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => router.push('/backtest')}
                  className="btn btn-outline btn-sm"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Backtests
                </button>
                
                <button 
                  onClick={() => router.push(`/tradebook?backtest_id=${backtest_id}`)}
                  className="btn btn-primary btn-sm"
                >
                  View Trades
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Backtest Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-title">Strategy</div>
            <div className="stat-value text-lg">{backtestInfo.strategy_name}</div>
          </div>
          
          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-title">Symbol</div>
            <div className="stat-value text-lg">{backtestInfo.symbol}</div>
          </div>
          
          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-title">Period</div>
            <div className="stat-value text-lg">
              {new Date(backtestInfo.start_date).toLocaleDateString()} - {new Date(backtestInfo.end_date).toLocaleDateString()}
            </div>
          </div>
          
          <div className="stat bg-base-100 rounded-lg shadow-sm">
            <div className="stat-title">Total Positions</div>
            <div className="stat-value text-lg text-primary">{positions.length}</div>
          </div>
        </div>

        {/* Positions Table */}
        <PositionTable positions={positions} />
      </div>
    </Layout>
  )
}