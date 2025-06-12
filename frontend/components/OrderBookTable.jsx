import { useState } from 'react'
import { ChevronUp, ChevronDown, Filter, Download } from 'lucide-react'

export default function OrderBookTable({ orders = [] }) {
  const [sortField, setSortField] = useState('timestamp')
  const [sortDirection, setSortDirection] = useState('desc')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (filterStatus === 'all') return true
    return order.status.toLowerCase() === filterStatus.toLowerCase()
  })

  // Sort orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
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

  // Paginate orders
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const exportToCSV = () => {
    const headers = ['Order ID', 'Symbol', 'Side', 'Type', 'Quantity', 'Price', 'Status', 'Timestamp', 'Filled Qty', 'Filled Price']
    const csvData = [
      headers.join(','),
      ...sortedOrders.map(order => [
        order.order_id,
        order.symbol,
        order.side,
        order.order_type,
        order.quantity,
        order.price || '',
        order.status,
        new Date(order.timestamp).toLocaleString(),
        order.filled_quantity,
        order.filled_price || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orderbook.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp className="h-4 w-4 opacity-30" />
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      'FILLED': 'badge-success',
      'PENDING': 'badge-warning',
      'CANCELLED': 'badge-error',
      'REJECTED': 'badge-error'
    }
    return `badge ${statusClasses[status] || 'badge-neutral'}`
  }

  const getSideBadge = (side) => {
    return side === 'BUY' ? 'text-success' : 'text-error'
  }

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-header p-6 border-b border-base-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="text-lg font-semibold">Order Book</h3>
          
          <div className="flex flex-wrap gap-2">
            {/* Filter */}
            <div className="form-control">
              <select
                className="select select-bordered select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="filled">Filled</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            {/* Export */}
            <button
              onClick={exportToCSV}
              className="btn btn-outline btn-sm"
              disabled={orders.length === 0}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>
      
      <div className="card-body p-0">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-base-content/60">No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th 
                      className="cursor-pointer hover:bg-base-200"
                      onClick={() => handleSort('order_id')}
                    >
                      <div className="flex items-center gap-1">
                        Order ID
                        <SortIcon field="order_id" />
                      </div>
                    </th>
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
                      onClick={() => handleSort('order_type')}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        <SortIcon field="order_type" />
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
                    <th 
                      className="cursor-pointer hover:bg-base-200"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <SortIcon field="status" />
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
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover">
                      <td className="font-mono text-sm">{order.order_id}</td>
                      <td className="font-medium">{order.symbol}</td>
                      <td>
                        <span className={`font-medium ${getSideBadge(order.side)}`}>
                          {order.side}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm">
                          {order.order_type}
                        </span>
                      </td>
                      <td>{order.quantity.toLocaleString()}</td>
                      <td>
                        {order.price ? `₹${order.price.toFixed(2)}` : 'Market'}
                      </td>
                      <td>
                        <span className={`badge badge-sm ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-sm">
                        {new Date(order.timestamp).toLocaleString()}
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
  )
}