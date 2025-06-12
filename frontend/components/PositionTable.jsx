import { useState } from 'react'
import { ChevronUp, ChevronDown, Download } from 'lucide-react'

export default function PositionTable({ positions = [] }) {
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Sort positions
  const sortedPositions = [...positions].sort((a, b) => {
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

  // Paginate positions
  const totalPages = Math.ceil(sortedPositions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPositions = sortedPositions.slice(startIndex, startIndex + itemsPerPage)

  // Calculate summary statistics
  const totalValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.avg_price), 0)
  const totalPnL = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0)
  const totalQuantity = positions.reduce((sum, pos) => sum + Math.abs(pos.quantity), 0)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const exportToCSV = () => {
    const headers = ['Symbol', 'Quantity', 'Avg Price', 'Current Price', 'Value', 'P&L', 'Timestamp']
    const csvData = [
      headers.join(','),
      ...sortedPositions.map(position => [
        position.symbol,
        position.quantity,
        position.avg_price,
        position.current_price || '',
        position.quantity * position.avg_price,
        position.pnl || 0,
        new Date(position.timestamp).toLocaleString()
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'positions.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-30" />
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const getPositionType = (quantity) => {
    if (quantity > 0) return { type: 'LONG', color: 'text-success' }
    if (quantity < 0) return { type: 'SHORT', color: 'text-error' }
    return { type: 'FLAT', color: 'text-base-content' }
  }

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'text-success'
    if (pnl < 0) return 'text-error'
    return 'text-base-content'
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Total Value</div>
          <div className="stat-value text-2xl text-primary">
            ₹{totalValue.toFixed(2)}
          </div>
        </div>
        
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Total P&L</div>
          <div className={`stat-value text-2xl ${getPnLColor(totalPnL)}`}>
            ₹{totalPnL.toFixed(2)}
          </div>
        </div>
        
        <div className="stat bg-base-100 rounded-lg shadow-sm">
          <div className="stat-title">Total Quantity</div>
          <div className="stat-value text-2xl text-info">
            {totalQuantity.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Positions Table */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-header p-6 border-b border-base-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-semibold">Positions</h3>
            
            <div className="flex flex-wrap gap-2">
              {/* Export */}
              <button
                onClick={exportToCSV}
                className="btn btn-outline btn-sm"
                disabled={positions.length === 0}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
        
        <div className="card-body p-0">
          {positions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base-content/60">No positions found</p>
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
                      <th>Type</th>
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
                        onClick={() => handleSort('avg_price')}
                      >
                        <div className="flex items-center gap-1">
                          Avg Price
                          <SortIcon field="avg_price" />
                        </div>
                      </th>
                      <th>Current Price</th>
                      <th>Value</th>
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
                    {paginatedPositions.map((position) => {
                      const positionType = getPositionType(position.quantity)
                      const value = position.quantity * position.avg_price
                      
                      return (
                        <tr key={position.id} className="hover">
                          <td className="font-medium">{position.symbol}</td>
                          <td>
                            <span className={`badge badge-outline badge-sm ${positionType.color}`}>
                              {positionType.type}
                            </span>
                          </td>
                          <td className={positionType.color}>
                            {Math.abs(position.quantity).toLocaleString()}
                          </td>
                          <td>₹{position.avg_price.toFixed(2)}</td>
                          <td>
                            {position.current_price ? 
                              `₹${position.current_price.toFixed(2)}` : 
                              'N/A'
                            }
                          </td>
                          <td>₹{Math.abs(value).toFixed(2)}</td>
                          <td className={getPnLColor(position.pnl || 0)}>
                            ₹{(position.pnl || 0).toFixed(2)}
                          </td>
                          <td className="text-sm">
                            {new Date(position.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
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