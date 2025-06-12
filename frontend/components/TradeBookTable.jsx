import { useState } from 'react'
import { ChevronUp, ChevronDown, Download, Filter } from 'lucide-react'

export default function TradeBookTable({ trades = [] }) {
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  const [filterSide, setFilterSide] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    if (filterSide === 'all') return true
    return trade.side.toLowerCase() === filterSide.toLowerCase()
  })

  // Sort trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    let aValue = a[sortField]
    let bValue = b[sortField]
    
    if (sortField === 'timestamp') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Paginate trades
  const totalPages = Math.ceil(sortedTrades.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTrades = sortedTrades.slice(startIndex, startIndex + itemsPerPage)

  // Calculate summary statistics
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
  const totalCommission = trades.reduce((sum, trade) => sum + (trade.commission || 0), 0)
  const buyTrades = trades.filter(trade => trade.side === 'BUY').length
  const sellTrades = trades.filter(trade => trade.side === 'SELL').length

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const exportToCSV = () => {
    const headers = ['Symbol', 'Side', 'Quantity', 'Price', 'Timestamp', 'Order ID', 'Commission', 'P&L']
    const csvData = [
      headers.join(','),
      ...sortedTrades.map(trade => [
        trade.symbol,
        trade.side,
        trade.quantity,
        trade.price,
        new Date(trade.timestamp).toLocaleString(),
        trade.order_id || '',
        trade.commission || 0,
        trade.pnl || 0
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tradebook.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-30" />
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const getSideBadge = (side) => {
    return side === 'BUY' ? 'text-success' : 'text-error'
  }

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-success'
    if (pnl < 0) return 'text-error'
    return 'text-base-content'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Total P&L</div>
          <div className={`stat-value text-2xl ${getPnLColor(totalPnL)}`}>
            ₹{totalPnL.toFixed(2)}
          </div>
        </div>
        
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Total Commission</div>
          <div className="stat-value text-2xl text-warning">
            ₹{totalCommission.toFixed(2)}
          </div>
        </div>
        
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Buy Trades</div>
          <div className="stat-value text-2xl text-success">
            {buyTrades}
          </div>
        </div>
        
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Sell Trades</div>
          <div className="stat-value text-2xl text-error">
            {sellTrades}
          </div>
        </div>
      </div>

      {/* Trade Book Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-header p-6 border-b border-base-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-semibold">Trade Book</h3>
            
            <div className="flex flex-wrap gap-2">
              {/* Filter */}
              <div className="form-control">
                <select
                  className="select select-bordered select-sm"
                  value={filterSide}
                  onChange={(e) => setFilterSide(e.target.value)}
                >
                  <option value="all">All Trades</option>
                  <option value="buy">Buy Only</option>
                  <option value="sell">Sell Only</option>
                </select>
              </div>
              
              {/* Export */}
              <button
                onClick={exportToCSV}
                className="btn btn-outline btn-sm"
                disabled={trades.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0">
          {trades.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base-content/60">No trades found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('symbol')}
                      >
                        <div className="flex items-center gap-1">
                          Symbol
                          <SortIcon field="symbol" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('side')}
                      >
                        <div className="flex items-center gap-1">
                          Side
                          <SortIcon field="side" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('quantity')}
                      >
                        <div className="flex items-center gap-1">
                          Quantity
                          <SortIcon field="quantity" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center gap-1">
                          Price
                          <SortIcon field="price" />
                        </div>
                      </th>
                      <th>Value</th>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('commission')}
                      >
                        <div className="flex items-center gap-1">
                          Commission
                          <SortIcon field="commission" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('pnl')}
                      >
                        <div className="flex items-center gap-1">
                          P&L
                          <SortIcon field="pnl" />
                        </div>
                      </th>
                      <th 
                        className="cursor-pointer hover:bg-base-200"
                        onClick={() => handleSort('timestamp')}
                      >
                        <div className="flex items-center gap-1">
                          Time
                          <SortIcon field="timestamp" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTrades.map((trade) => (
                      <tr key={trade.id} className="hover">
                        <td className="font-medium">{trade.symbol}</td>
                        <td>
                          <span className={`font-medium ${getSideBadge(trade.side)}`}>
                            {trade.side}
                          </span>
                        </td>
                        <td>{trade.quantity.toLocaleString()}</td>
                        <td>₹{trade.price.toFixed(2)}</td>
                        <td>₹{(trade.quantity * trade.price).toFixed(2)}</td>
                        <td className="text-warning">₹{(trade.commission || 0).toFixed(2)}</td>
                        <td className={getPnLColor(trade.pnl || 0)}>
                          ₹{(trade.pnl || 0).toFixed(2)}
                        </td>
                        <td className="text-sm">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center p-4 border-t border-base-300">
                  <div className="join">
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      «
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        className={`join-item btn btn-sm ${currentPage === page ? 'btn-active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      className="join-item btn btn-sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      »
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}