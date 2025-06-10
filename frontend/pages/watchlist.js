import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { Plus, Trash2, BarChart3, X } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState([])
  const [quotes, setQuotes] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteItem, setDeleteItem] = useState(null)
  const [newSymbol, setNewSymbol] = useState({
    symbol: '',
    name: '',
    exchange: 'NSE'
  })

  useEffect(() => {
    loadWatchlistData()
    
    // Auto-refresh quotes every 30 seconds
    const interval = setInterval(loadWatchlistData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadWatchlistData = async () => {
    try {
      // Load watchlist items
      const itemsResponse = await axios.get('/api/watchlist/items')
      const items = itemsResponse.data
      setWatchlistItems(items)

      if (items.length > 0) {
        // Load quotes
        const symbols = items.map(item => item.symbol).join(',')
        const exchanges = items.map(item => item.exchange).join(',')
        
        try {
          const quotesResponse = await axios.get(`/api/quotes?symbols=${symbols}&exchanges=${exchanges}`)
          const quotesData = quotesResponse.data
          
          // Convert to map for easy lookup
          const quotesMap = {}
          quotesData.forEach(quote => {
            if (quote && quote.symbol) {
              quotesMap[quote.symbol] = {
                price: quote.ltp || 0,
                change: quote.change_percent || 0,
                volume: quote.volume || 0,
                error: quote.error
              }
            }
          })
          setQuotes(quotesMap)
        } catch (quotesError) {
          console.error('Error loading quotes:', quotesError)
          // Continue without quotes
        }
      }
    } catch (error) {
      console.error('Error loading watchlist:', error)
      toast.error('Failed to load watchlist')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSymbol = async (e) => {
    e.preventDefault()
    
    if (!newSymbol.symbol.trim()) {
      toast.error('Symbol is required')
      return
    }

    try {
      await axios.post('/api/watchlist/items', {
        symbol: newSymbol.symbol.toUpperCase(),
        name: newSymbol.name || newSymbol.symbol.toUpperCase(),
        exchange: newSymbol.exchange
      })

      toast.success('Symbol added to watchlist')
      setShowAddModal(false)
      setNewSymbol({ symbol: '', name: '', exchange: 'NSE' })
      loadWatchlistData()
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Symbol already exists in watchlist')
      } else {
        toast.error('Failed to add symbol')
      }
    }
  }

  const handleDeleteClick = (item) => {
    setDeleteItem(item)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return

    try {
      await axios.delete(`/api/watchlist/items/${deleteItem.id}`)
      toast.success(`Removed ${deleteItem.symbol} from watchlist`)
      setShowDeleteModal(false)
      setDeleteItem(null)
      loadWatchlistData()
    } catch (error) {
      toast.error('Failed to remove symbol')
    }
  }

  if (isLoading) {
    return (
      <Layout title="Watchlist - Historify">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Watchlist - Historify">
      <div className="space-y-6">
        {/* Header */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <h2 className="text-2xl font-semibold">Watchlist</h2>
              <button 
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary mt-3 md:mt-0"
              >
                <Plus className="h-5 w-5 mr-1" />
                Add Symbol
              </button>
            </div>
            
            {/* Watchlist Table */}
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Exchange</th>
                    <th>Last Price</th>
                    <th>Change %</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistItems.length === 0 ? (
                    <tr>
                      <td colSpan="6\" className="text-center py-8">
                        <div>
                          <p className="text-base-content/60 mb-3">Your watchlist is empty</p>
                          <button 
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary btn-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Symbol
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    watchlistItems.map((item) => {
                      const quote = quotes[item.symbol] || {}
                      const price = quote.price || 0
                      const change = quote.change || 0
                      const changeClass = change >= 0 ? 'text-success' : 'text-error'
                      const changeIcon = change >= 0 ? '↑' : '↓'

                      return (
                        <tr key={item.id} className="hover">
                          <td className="font-medium">{item.symbol}</td>
                          <td>{item.name || item.symbol}</td>
                          <td>
                            <span className="badge badge-outline">{item.exchange}</span>
                          </td>
                          <td>
                            {quote.error ? (
                              <span className="text-error text-sm">Error</span>
                            ) : (
                              <span>₹{price.toFixed(2)}</span>
                            )}
                          </td>
                          <td>
                            {quote.error ? (
                              <span className="text-error text-sm">--</span>
                            ) : (
                              <span className={changeClass}>
                                {changeIcon} {Math.abs(change).toFixed(2)}%
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="flex gap-2">
                              <a 
                                href={`/charts?symbol=${item.symbol}&exchange=${item.exchange}`}
                                className="btn btn-sm btn-outline btn-primary"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </a>
                              <button 
                                onClick={() => handleDeleteClick(item)}
                                className="btn btn-sm btn-outline btn-error"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Symbol Modal */}
      {showAddModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Symbol to Watchlist</h3>
            <form onSubmit={handleAddSymbol}>
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Symbol</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered w-full" 
                  placeholder="Enter symbol (e.g. RELIANCE)"
                  value={newSymbol.symbol}
                  onChange={(e) => setNewSymbol(prev => ({ ...prev, symbol: e.target.value }))}
                  required 
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Name (Optional)</span>
                </label>
                <input 
                  type="text" 
                  className="input input-bordered w-full" 
                  placeholder="Enter company name"
                  value={newSymbol.name}
                  onChange={(e) => setNewSymbol(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Exchange</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={newSymbol.exchange}
                  onChange={(e) => setNewSymbol(prev => ({ ...prev, exchange: e.target.value }))}
                >
                  <option value="NSE">NSE Equity</option>
                  <option value="NFO">NSE Futures & Options</option>
                  <option value="CDS">NSE Currency</option>
                  <option value="BSE">BSE Equity</option>
                  <option value="BFO">BSE Futures & Options</option>
                  <option value="BCD">BSE Currency</option>
                  <option value="MCX">MCX Commodity</option>
                </select>
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">Add</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteItem && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Confirm Delete</h3>
            <p>Are you sure you want to remove <span className="font-semibold">{deleteItem.symbol}</span> from your watchlist?</p>
            <div className="modal-action">
              <button 
                onClick={handleDeleteConfirm}
                className="btn btn-error"
              >
                Delete
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}