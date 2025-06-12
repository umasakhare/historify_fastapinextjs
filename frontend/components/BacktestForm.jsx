import { useState, useEffect } from 'react'
import { Calendar, Play, Settings, TrendingUp } from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function BacktestForm({ onBacktestStart, onBacktestComplete }) {
  const [strategies, setStrategies] = useState({})
  const [symbols, setSymbols] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    strategy_name: '',
    symbol: '',
    exchange: 'NSE',
    start_date: '',
    end_date: '',
    initial_capital: 100000,
    parameters: {}
  })

  useEffect(() => {
    loadStrategies()
    loadSymbols()
    setDefaultDates()
  }, [])

  const loadStrategies = async () => {
    try {
      const response = await axios.get('/api/backtest/strategies')
      setStrategies(response.data)
    } catch (error) {
      console.error('Error loading strategies:', error)
      toast.error('Failed to load strategies')
    }
  }

  const loadSymbols = async () => {
    try {
      const response = await axios.get('/api/backtest/symbols')
      setSymbols(response.data)
    } catch (error) {
      console.error('Error loading symbols:', error)
      toast.error('Failed to load symbols')
    }
  }

  const setDefaultDates = () => {
    const today = new Date()
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(today.getFullYear() - 1)
    
    setFormData(prev => ({
      ...prev,
      start_date: oneYearAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    }))
  }

  const handleStrategyChange = (strategyName) => {
    const strategy = strategies[strategyName]
    if (strategy) {
      const defaultParams = {}
      Object.entries(strategy.parameters || {}).forEach(([key, config]) => {
        defaultParams[key] = config.default
      })
      
      setFormData(prev => ({
        ...prev,
        strategy_name: strategyName,
        parameters: defaultParams
      }))
    }
  }

  const handleParameterChange = (paramName, value) => {
    setFormData(prev => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [paramName]: value
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a backtest name')
      return
    }
    
    if (!formData.strategy_name) {
      toast.error('Please select a strategy')
      return
    }
    
    if (!formData.symbol) {
      toast.error('Please select a symbol')
      return
    }

    setIsLoading(true)
    onBacktestStart?.()

    try {
      const response = await axios.post('/api/backtest/backtest', {
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString()
      })

      toast.success('Backtest completed successfully!')
      onBacktestComplete?.(response.data)
    } catch (error) {
      console.error('Backtest error:', error)
      toast.error(error.response?.data?.detail || 'Backtest failed')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStrategy = strategies[formData.strategy_name]

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-header p-6 border-b border-base-300">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Create New Backtest
        </h2>
      </div>
      
      <div className="card-body">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Backtest Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="Enter backtest name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Initial Capital</span>
              </label>
              <input
                type="number"
                className="input input-bordered"
                placeholder="100000"
                value={formData.initial_capital}
                onChange={(e) => setFormData(prev => ({ ...prev, initial_capital: parseFloat(e.target.value) }))}
                min="1000"
                step="1000"
                required
              />
            </div>
          </div>

          {/* Strategy Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Trading Strategy</span>
            </label>
            <select
              className="select select-bordered"
              value={formData.strategy_name}
              onChange={(e) => handleStrategyChange(e.target.value)}
              required
            >
              <option value="">Select a strategy</option>
              {Object.entries(strategies).map(([key, strategy]) => (
                <option key={key} value={key}>
                  {strategy.name}
                </option>
              ))}
            </select>
            {selectedStrategy && (
              <div className="label">
                <span className="label-text-alt">{selectedStrategy.description}</span>
              </div>
            )}
          </div>

          {/* Symbol and Exchange */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Symbol</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                required
              >
                <option value="">Select a symbol</option>
                {symbols.map((symbol) => (
                  <option key={symbol.symbol} value={symbol.symbol}>
                    {symbol.symbol} - {symbol.name || symbol.symbol}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">Exchange</span>
              </label>
              <select
                className="select select-bordered"
                value={formData.exchange}
                onChange={(e) => setFormData(prev => ({ ...prev, exchange: e.target.value }))}
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="NFO">NFO</option>
                <option value="MCX">MCX</option>
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Start Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            
            <div className="form-control">
              <label className="label">
                <span className="label-text">End Date</span>
              </label>
              <input
                type="date"
                className="input input-bordered"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Strategy Parameters */}
          {selectedStrategy && selectedStrategy.parameters && (
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4" />
                  Strategy Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedStrategy.parameters).map(([paramName, config]) => (
                    <div key={paramName} className="form-control">
                      <label className="label">
                        <span className="label-text capitalize">
                          {paramName.replace('_', ' ')}
                        </span>
                      </label>
                      <input
                        type={config.type === 'int' ? 'number' : config.type === 'float' ? 'number' : 'text'}
                        className="input input-bordered input-sm"
                        value={formData.parameters[paramName] || config.default}
                        onChange={(e) => {
                          const value = config.type === 'int' ? parseInt(e.target.value) :
                                       config.type === 'float' ? parseFloat(e.target.value) :
                                       e.target.value
                          handleParameterChange(paramName, value)
                        }}
                        min={config.min}
                        max={config.max}
                        step={config.type === 'float' ? '0.1' : '1'}
                      />
                      <div className="label">
                        <span className="label-text-alt">
                          Default: {config.default}
                          {config.min !== undefined && config.max !== undefined && 
                            ` (Range: ${config.min}-${config.max})`
                          }
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setFormData({
                name: '',
                strategy_name: '',
                symbol: '',
                exchange: 'NSE',
                start_date: '',
                end_date: '',
                initial_capital: 100000,
                parameters: {}
              })}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Running Backtest...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Backtest
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}