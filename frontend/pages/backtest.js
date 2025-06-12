import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import BacktestForm from '../components/BacktestForm'
import MetricsTable from '../components/MetricsTable'
import StrategyInfoCard from '../components/StrategyInfoCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { TrendingUp, History, Play, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Backtest() {
  const [backtestResults, setBacktestResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [strategies, setStrategies] = useState({})
  const [selectedStrategy, setSelectedStrategy] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [strategiesResponse, resultsResponse] = await Promise.all([
        axios.get('/api/backtest/strategies'),
        axios.get('/api/backtest/results')
      ])
      
      setStrategies(strategiesResponse.data)
      setBacktestResults(resultsResponse.data)
      
      if (resultsResponse.data.length > 0) {
        setSelectedResult(resultsResponse.data[0])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load backtest data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBacktestStart = () => {
    setIsRunning(true)
  }

  const handleBacktestComplete = (result) => {
    setIsRunning(false)
    setBacktestResults(prev => [result, ...prev])
    setSelectedResult(result)
    toast.success('Backtest completed successfully!')
  }

  const handleResultSelect = (result) => {
    setSelectedResult(result)
  }

  if (isLoading) {
    return (
      <Layout title="Backtest - Historify">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Backtest - Historify">
      <div className="space-y-6">
        {/* Header */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Strategy Backtesting
                </h1>
                <p className="text-base-content/60 mt-1">
                  Test your trading strategies against historical data
                </p>
              </div>
              
              {isRunning && (
                <div className="flex items-center gap-2 text-primary">
                  <LoadingSpinner size="sm" />
                  <span>Running backtest...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form and Strategy Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Backtest Form */}
            <BacktestForm 
              onBacktestStart={handleBacktestStart}
              onBacktestComplete={handleBacktestComplete}
            />
            
            {/* Strategy Information */}
            <StrategyInfoCard 
              strategy={strategies[selectedStrategy]}
              strategyKey={selectedStrategy}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Results */}
            <div className="card bg-base-100 shadow-sm">
              <div className="card-header p-6 border-b border-base-300">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Recent Backtests
                </h3>
              </div>
              
              <div className="card-body">
                {backtestResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-base-content/40" />
                    </div>
                    <p className="text-base-content/60 mb-3">No backtests yet</p>
                    <p className="text-sm text-base-content/40">
                      Create your first backtest using the form on the left
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {backtestResults.map((result) => (
                      <div
                        key={result.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedResult?.id === result.id
                            ? 'border-primary bg-primary/5'
                            : 'border-base-300 hover:border-base-400 hover:bg-base-200'
                        }`}
                        onClick={() => handleResultSelect(result)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{result.name}</h4>
                            <p className="text-sm text-base-content/60">
                              {result.strategy_name} • {result.symbol}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${
                              result.results?.total_return >= 0 ? 'text-success' : 'text-error'
                            }`}>
                              {result.results?.total_return}%
                            </div>
                            <div className="text-xs text-base-content/60">
                              {new Date(result.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Results Display */}
            {selectedResult && (
              <MetricsTable results={selectedResult.results} />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}