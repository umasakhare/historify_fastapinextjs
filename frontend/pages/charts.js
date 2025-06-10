import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { createChart } from 'lightweight-charts'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Charts() {
  const router = useRouter()
  const { symbol: querySymbol, exchange: queryExchange } = router.query
  
  const [watchlistItems, setWatchlistItems] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState(querySymbol || '')
  const [selectedExchange, setSelectedExchange] = useState(queryExchange || 'NSE')
  const [selectedTimeframe, setSelectedTimeframe] = useState('D')
  const [emaPeriod, setEmaPeriod] = useState(20)
  const [rsiPeriod, setRsiPeriod] = useState(14)
  const [isLoading, setIsLoading] = useState(false)
  const [autoUpdate, setAutoUpdate] = useState(false)
  
  const chartContainerRef = useRef()
  const rsiContainerRef = useRef()
  const chartRef = useRef()
  const rsiChartRef = useRef()
  const candleSeriesRef = useRef()
  const emaSeriesRef = useRef()
  const rsiSeriesRef = useRef()

  useEffect(() => {
    loadWatchlistItems()
  }, [])

  useEffect(() => {
    if (querySymbol && queryExchange) {
      setSelectedSymbol(querySymbol)
      setSelectedExchange(queryExchange)
    }
  }, [querySymbol, queryExchange])

  useEffect(() => {
    initializeCharts()
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (selectedSymbol && selectedExchange) {
      fetchChartData()
    }
  }, [selectedSymbol, selectedExchange, selectedTimeframe, emaPeriod, rsiPeriod])

  useEffect(() => {
    let interval
    if (autoUpdate && selectedSymbol) {
      interval = setInterval(() => {
        fetchChartData()
      }, 30000) // Update every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoUpdate, selectedSymbol, selectedExchange, selectedTimeframe])

  const loadWatchlistItems = async () => {
    try {
      const response = await axios.get('/api/watchlist/items')
      setWatchlistItems(response.data)
      
      if (response.data.length > 0 && !selectedSymbol) {
        const firstItem = response.data[0]
        setSelectedSymbol(firstItem.symbol)
        setSelectedExchange(firstItem.exchange)
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
      toast.error('Failed to load watchlist')
    }
  }

  const initializeCharts = () => {
    if (!chartContainerRef.current || !rsiContainerRef.current) return

    // Check if dark mode is active
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark'

    // Main chart options
    const chartOptions = {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { type: 'solid', color: isDarkMode ? '#1f2937' : 'white' },
        textColor: isDarkMode ? '#f3f4f6' : '#1f2937',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: {
          color: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)',
        },
        horzLines: {
          color: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)',
        },
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      },
      timeScale: {
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
    }

    // RSI chart options
    const rsiChartOptions = {
      width: rsiContainerRef.current.clientWidth,
      height: 200,
      layout: {
        background: { type: 'solid', color: isDarkMode ? '#1f2937' : 'white' },
        textColor: isDarkMode ? '#f3f4f6' : '#1f2937',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: {
          color: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)',
        },
        horzLines: {
          color: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.8)',
        },
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
      },
      timeScale: {
        borderColor: isDarkMode ? '#374151' : '#e5e7eb',
        timeVisible: true,
        secondsVisible: false,
      },
    }

    // Create charts
    chartRef.current = createChart(chartContainerRef.current, chartOptions)
    rsiChartRef.current = createChart(rsiContainerRef.current, rsiChartOptions)

    // Add series
    candleSeriesRef.current = chartRef.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    emaSeriesRef.current = chartRef.current.addLineSeries({
      color: '#2962FF',
      lineWidth: 2,
      priceLineVisible: false,
    })

    rsiSeriesRef.current = rsiChartRef.current.addLineSeries({
      color: '#f44336',
      lineWidth: 2,
      priceLineVisible: false,
    })

    // Handle window resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
      if (rsiChartRef.current && rsiContainerRef.current) {
        rsiChartRef.current.applyOptions({ width: rsiContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }

  const fetchChartData = async () => {
    if (!selectedSymbol || !selectedExchange) return

    setIsLoading(true)
    try {
      const response = await axios.get(
        `/api/charts/chart-data/${selectedSymbol}/${selectedExchange}/${selectedTimeframe}/${emaPeriod}/${rsiPeriod}`
      )

      const data = response.data

      if (data.error) {
        toast.error(data.error)
        return
      }

      // Update candlestick data
      if (data.candlestick && candleSeriesRef.current) {
        candleSeriesRef.current.setData(data.candlestick)
      }

      // Update EMA data
      if (data.ema && emaSeriesRef.current) {
        emaSeriesRef.current.setData(data.ema)
      }

      // Update RSI data
      if (data.rsi && rsiSeriesRef.current) {
        rsiSeriesRef.current.setData(data.rsi)
      }

      // Fit content
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.timeScale().fitContent()
      }

      toast.success(`Loaded ${data.candlestick?.length || 0} data points for ${selectedSymbol}`)
    } catch (error) {
      console.error('Error fetching chart data:', error)
      toast.error('Failed to fetch chart data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSymbolChange = (symbol) => {
    const item = watchlistItems.find(item => item.symbol === symbol)
    if (item) {
      setSelectedSymbol(symbol)
      setSelectedExchange(item.exchange)
    }
  }

  return (
    <Layout title="Charts - Historify">
      <div className="space-y-6">
        {/* Controls */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-2xl font-semibold">TradingView Charts</h2>
              
              <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                {/* Symbol & Exchange Selector */}
                <div className="form-control">
                  <div className="join">
                    <select 
                      className="select select-bordered join-item"
                      value={selectedSymbol}
                      onChange={(e) => handleSymbolChange(e.target.value)}
                    >
                      <option value="" disabled>Select Symbol</option>
                      {watchlistItems.map((item) => (
                        <option key={item.id} value={item.symbol}>
                          {item.symbol} - {item.name || item.symbol}
                        </option>
                      ))}
                    </select>
                    <select 
                      className="select select-bordered join-item"
                      value={selectedExchange}
                      onChange={(e) => setSelectedExchange(e.target.value)}
                    >
                      <option value="NSE">NSE</option>
                      <option value="NFO">NFO</option>
                      <option value="BSE">BSE</option>
                      <option value="BFO">BFO</option>
                      <option value="MCX">MCX</option>
                    </select>
                  </div>
                </div>
                
                {/* Timeframe Selector */}
                <div className="form-control">
                  <select 
                    className="select select-bordered"
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="D">Daily</option>
                    <option value="W">Weekly</option>
                  </select>
                </div>
                
                {/* Indicator Controls */}
                <div className="form-control">
                  <div className="join">
                    <input 
                      type="number" 
                      className="input input-bordered join-item w-20" 
                      value={emaPeriod}
                      onChange={(e) => setEmaPeriod(parseInt(e.target.value))}
                      min="1" 
                      max="200" 
                      placeholder="EMA"
                    />
                    <input 
                      type="number" 
                      className="input input-bordered join-item w-20" 
                      value={rsiPeriod}
                      onChange={(e) => setRsiPeriod(parseInt(e.target.value))}
                      min="1" 
                      max="100" 
                      placeholder="RSI"
                    />
                    <button 
                      onClick={fetchChartData}
                      className="btn btn-primary join-item"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingSpinner size="sm" /> : 'Apply'}
                    </button>
                  </div>
                </div>
                
                {/* Auto-update Toggle */}
                <div className="form-control">
                  <label className="label cursor-pointer">
                    <span className="label-text mr-2">Auto-update</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary"
                      checked={autoUpdate}
                      onChange={(e) => setAutoUpdate(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-2">
            <div ref={chartContainerRef} className="w-full h-[500px]" />
          </div>
        </div>

        {/* RSI Chart */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-2">
            <div ref={rsiContainerRef} className="w-full h-[200px]" />
          </div>
        </div>

        {/* Active Indicators */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="font-semibold mb-2">Active Indicators</h3>
            <div className="flex flex-wrap gap-2">
              <div className="badge badge-primary gap-2">
                EMA {emaPeriod}
              </div>
              <div className="badge badge-secondary gap-2">
                RSI {rsiPeriod}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}