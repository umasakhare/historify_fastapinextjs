import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import TradeBookTable from '../components/TradeBookTable'
import LoadingSpinner from '../components/LoadingSpinner'
import { Receipt, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function TradeBook() {
  const router = useRouter()
  const { backtest_id } = router.query
  
  const [trades, setTrades] = useState([])
  const [backtestInfo, setBacktestInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (backtest_id) {
      loadTradeBook()
    }
  }, [backtest_id])

  const loadTradeBook = async () => {
    try {
      const [tradesResponse, backtestResponse] = await Promise.all([
        axios.get(`/api/backtest/tradebook/${backtest_id}`),
        axios.get(`/api/backtest/results/${backtest_id}`)
      ])
      
      setTrades(tradesResponse.data)
      setBacktestInfo(backtestResponse.data)
    } catch (error) {
      console.error('Error loading trade book:', error)
      toast.error('Failed to load trade book')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Layout title="Trade Book - Historify">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!backtestInfo) {
    return (
      <Layout title="Trade Book - Historify">
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
    <Layout title="Trade Book - Historify">
      <div className="space-y-6">
        {/* Header */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  Trade Book
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
                  onClick={() => router.push(`/orderbook?backtest_id=${backtest_id}`)}
                  className="btn btn-primary btn-sm"
                >
                  View Orders
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
            <div className="stat-title">Total Trades</div>
            <div className="stat-value text-lg text-primary">{trades.length}</div>
          </div>
        </div>

        {/* Trade Book Table */}
        <TradeBookTable trades={trades} />
      </div>
    </Layout>
  )
}