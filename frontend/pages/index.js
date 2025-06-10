import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { BarChart3, Download, Upload, FileText, TrendingUp, Database, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Dashboard() {
  const [watchlistSymbols, setWatchlistSymbols] = useState([])
  const [selectedSymbols, setSelectedSymbols] = useState([])
  const [downloadSettings, setDownloadSettings] = useState({
    interval: 'D',
    dateRange: '30d',
    startDate: '',
    endDate: '',
    mode: 'fresh'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState([])

  useEffect(() => {
    loadWatchlistSymbols()
    setDefaultDates()
  }, [])

  const loadWatchlistSymbols = async () => {
    try {
      const response = await axios.get('/api/watchlist/items')
      setWatchlistSymbols(response.data)
    } catch (error) {
      console.error('Error loading watchlist:', error)
      toast.error('Failed to load watchlist symbols')
    }
  }

  const setDefaultDates = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    setDownloadSettings(prev => ({
      ...prev,
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    }))
  }

  const handleSymbolToggle = (symbol) => {
    setSelectedSymbols(prev => 
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    )
  }

  const handleSelectAll = () => {
    if (selectedSymbols.length === watchlistSymbols.length) {
      setSelectedSymbols([])
    } else {
      setSelectedSymbols(watchlistSymbols.map(item => item.symbol))
    }
  }

  const getDateRange = () => {
    const today = new Date()
    let startDate = new Date()
    let endDate = today

    switch (downloadSettings.dateRange) {
      case 'today':
        startDate = today
        break
      case '5d':
        startDate.setDate(today.getDate() - 5)
        break
      case '30d':
        startDate.setDate(today.getDate() - 30)
        break
      case '90d':
        startDate.setDate(today.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(today.getFullYear() - 1)
        break
      case '2y':
        startDate.setFullYear(today.getFullYear() - 2)
        break
      case 'custom':
        return {
          startDate: downloadSettings.startDate,
          endDate: downloadSettings.endDate
        }
      default:
        startDate.setDate(today.getDate() - 30)
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const handleDownload = async (e) => {
    e.preventDefault()
    
    if (selectedSymbols.length === 0) {
      toast.error('Please select at least one symbol')
      return
    }

    setIsLoading(true)
    const { startDate, endDate } = getDateRange()
    
    try {
      const exchanges = selectedSymbols.map(symbol => {
        const item = watchlistSymbols.find(w => w.symbol === symbol)
        return item?.exchange || 'NSE'
      })

      const response = await axios.post('/api/download', {
        symbols: selectedSymbols,
        exchanges,
        interval: downloadSettings.interval,
        start_date: startDate,
        end_date: endDate,
        mode: downloadSettings.mode
      })

      const result = response.data
      
      if (result.status === 'success') {
        toast.success(`Successfully downloaded data for ${result.success.length} symbols`)
        setDownloadStatus([
          {
            timestamp: new Date().toLocaleTimeString(),
            message: `Downloaded ${result.success.length} symbols successfully`,
            type: 'success'
          },
          ...downloadStatus
        ])
      } else if (result.status === 'partial') {
        toast.warning(result.message)
        setDownloadStatus([
          {
            timestamp: new Date().toLocaleTimeString(),
            message: result.message,
            type: 'warning'
          },
          ...downloadStatus
        ])
      } else {
        toast.error(result.message || 'Download failed')
      }
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download failed. Please try again.')
      setDownloadStatus([
        {
          timestamp: new Date().toLocaleTimeString(),
          message: 'Download failed. Please try again.',
          type: 'error'
        },
        ...downloadStatus
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Layout title="Dashboard - Historify">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="hero min-h-[50vh] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold text-base-content">Historify</h1>
              <p className="py-6 text-base-content/70">
                Download, store, and visualize historical and real-time stock market data with ease.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a href="/watchlist" className="btn btn-primary">
                  Manage Watchlist
                </a>
                <a href="/charts" className="btn btn-secondary">
                  View Charts
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card bg-base-100 shadow-sm card-hover">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Total Symbols</p>
                  <p className="text-3xl font-bold text-base-content">{watchlistSymbols.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm card-hover">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Data Points</p>
                  <p className="text-3xl font-bold text-base-content">2.5M</p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
                  <Database className="h-6 w-6 text-success" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm card-hover">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Data Quality</p>
                  <p className="text-3xl font-bold text-base-content">98%</p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm card-hover">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-base-content/60">Last Sync</p>
                  <p className="text-3xl font-bold text-base-content">5m</p>
                  <p className="text-xs text-base-content/60">ago</p>
                </div>
                <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center">
                  <Clock className="h-6 w-6 text-info" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <a href="/import" className="card bg-base-100 shadow-sm hover:shadow-md transition-all group">
            <div className="card-body flex flex-row items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Import Symbols</h3>
                <p className="text-sm text-base-content/60">Bulk import from CSV/Excel</p>
              </div>
              <TrendingUp className="h-5 w-5 text-base-content/40 group-hover:text-primary transition-colors" />
            </div>
          </a>

          <a href="/export" className="card bg-base-100 shadow-sm hover:shadow-md transition-all group">
            <div className="card-body flex flex-row items-center gap-4">
              <div className="w-16 h-16 bg-success/10 rounded-xl flex items-center justify-center group-hover:bg-success/20 transition-colors">
                <FileText className="h-8 w-8 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Export Data</h3>
                <p className="text-sm text-base-content/60">Download in multiple formats</p>
              </div>
              <TrendingUp className="h-5 w-5 text-base-content/40 group-hover:text-success transition-colors" />
            </div>
          </a>

          <a href="/download" className="card bg-base-100 shadow-sm hover:shadow-md transition-all group">
            <div className="card-body flex flex-row items-center gap-4">
              <div className="w-16 h-16 bg-info/10 rounded-xl flex items-center justify-center group-hover:bg-info/20 transition-colors">
                <Download className="h-8 w-8 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Bulk Download</h3>
                <p className="text-sm text-base-content/60">Update historical data</p>
              </div>
              <TrendingUp className="h-5 w-5 text-base-content/40 group-hover:text-info transition-colors" />
            </div>
          </a>
        </div>

        {/* Data Download Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-header p-6 border-b border-base-300">
              <h2 className="text-xl font-semibold">Quick Data Download</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleDownload}>
                {/* Symbol Selection */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Select Symbols</h3>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="checkbox checkbox-primary"
                        checked={selectedSymbols.length === watchlistSymbols.length && watchlistSymbols.length > 0}
                        onChange={handleSelectAll}
                      />
                      <span className="font-medium">Select All / Deselect All</span>
                    </label>
                  </div>
                  <div className="bg-base-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {watchlistSymbols.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-base-content/60">No symbols in watchlist.</p>
                        <a href="/watchlist" className="link link-primary">Add symbols</a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {watchlistSymbols.map((item) => (
                          <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="checkbox checkbox-primary checkbox-sm"
                              checked={selectedSymbols.includes(item.symbol)}
                              onChange={() => handleSymbolToggle(item.symbol)}
                            />
                            <span className="text-sm">{item.symbol} ({item.exchange})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Options */}
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Interval</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      value={downloadSettings.interval}
                      onChange={(e) => setDownloadSettings(prev => ({ ...prev, interval: e.target.value }))}
                    >
                      <option value="1m">1 Minute</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="30m">30 Minutes</option>
                      <option value="1h">1 Hour</option>
                      <option value="D">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Date Range</span>
                    </label>
                    <select 
                      className="select select-bordered w-full"
                      value={downloadSettings.dateRange}
                      onChange={(e) => setDownloadSettings(prev => ({ ...prev, dateRange: e.target.value }))}
                    >
                      <option value="30d">Last 30 Days</option>
                      <option value="5d">Last 5 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="1y">Last 1 Year</option>
                      <option value="2y">Last 2 Years</option>
                      <option value="today">Today</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {downloadSettings.dateRange === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">
                          <span className="label-text">Start Date</span>
                        </label>
                        <input 
                          type="date" 
                          className="input input-bordered w-full"
                          value={downloadSettings.startDate}
                          onChange={(e) => setDownloadSettings(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text">End Date</span>
                        </label>
                        <input 
                          type="date" 
                          className="input input-bordered w-full"
                          value={downloadSettings.endDate}
                          onChange={(e) => setDownloadSettings(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="label">
                      <span className="label-text">Download Mode</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-base-200">
                        <input 
                          type="radio" 
                          name="download-mode" 
                          className="radio radio-primary" 
                          value="fresh"
                          checked={downloadSettings.mode === 'fresh'}
                          onChange={(e) => setDownloadSettings(prev => ({ ...prev, mode: e.target.value }))}
                        />
                        <div>
                          <span className="font-medium">Fresh Download</span>
                          <span className="text-sm text-base-content/60 block">Overwrite existing data for selected range</span>
                        </div>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-base-200">
                        <input 
                          type="radio" 
                          name="download-mode" 
                          className="radio radio-primary" 
                          value="continue"
                          checked={downloadSettings.mode === 'continue'}
                          onChange={(e) => setDownloadSettings(prev => ({ ...prev, mode: e.target.value }))}
                        />
                        <div>
                          <span className="font-medium">Continue Download</span>
                          <span className="text-sm text-base-content/60 block">Resume from last checkpoint</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-base-300">
                  <button type="button" className="btn btn-ghost">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isLoading || selectedSymbols.length === 0}
                  >
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Start Download
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Download Status */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-header p-6 border-b border-base-300">
              <h2 className="text-xl font-semibold">Download Status</h2>
            </div>
            <div className="card-body">
              <div className="h-64 overflow-y-auto space-y-2">
                {downloadStatus.length === 0 ? (
                  <p className="text-center text-base-content/60 py-8">No active downloads</p>
                ) : (
                  downloadStatus.map((status, index) => (
                    <div key={index} className={`alert ${
                      status.type === 'success' ? 'alert-success' : 
                      status.type === 'warning' ? 'alert-warning' : 
                      'alert-error'
                    }`}>
                      <div>
                        <div className="font-bold">{status.timestamp}</div>
                        <div className="text-sm">{status.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}