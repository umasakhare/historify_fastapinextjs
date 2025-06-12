import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import OrderBookTable from '../components/OrderBookTable'
import LoadingSpinner from '../components/LoadingSpinner'
import { FileText, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function OrderBook() {
  const router = useRouter()
  const { backtest_id } = router.query
  
  const [orders, setOrders] = useState([])
  const [backtestInfo, setBacktestInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (backtest_id) {
      loadOrderBook()
    }
  }, [backtest_id])

  const loadOrderBook = async () => {
    try {
      const [ordersResponse, backtestResponse] = await Promise.all([
        axios.get(`/api/backtest/orderbook/${backtest_id}`),
        axios.get(`/api/backtest/results/${backtest_id}`)
      ])
      
      setOrders(ordersResponse.data)
      setBacktestInfo(backtestResponse.data)
    } catch (error) {
      console.error('Error loading order book:', error)
      toast.error('Failed to load order book')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Layout title="Order Book - Historify">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!backtestInfo) {
    return (
      <Layout title="Order Book - Historify">
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
    <Layout title="Order Book - Historify">
      <div className="space-y-6">
        {/* Header */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Order Book
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
            <div className="stat-title">Total Orders</div>
            <div className="stat-value text-lg text-primary">{orders.length}</div>
          </div>
        </div>

        {/* Order Book Table */}
        <OrderBookTable orders={orders} />
      </div>
    </Layout>
  )
}