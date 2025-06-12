import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Percent } from 'lucide-react'

export default function MetricsTable({ results }) {
  if (!results) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-center text-base-content/60">No results to display</p>
        </div>
      </div>
    )
  }

  const metrics = [
    {
      label: 'Total Return',
      value: `${results.total_return}%`,
      icon: results.total_return >= 0 ? TrendingUp : TrendingDown,
      color: results.total_return >= 0 ? 'text-success' : 'text-error',
      bgColor: results.total_return >= 0 ? 'bg-success/10' : 'bg-error/10'
    },
    {
      label: 'Initial Capital',
      value: `₹${results.initial_capital?.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-info',
      bgColor: 'bg-info/10'
    },
    {
      label: 'Final Capital',
      value: `₹${results.final_capital?.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: 'Total Trades',
      value: results.total_trades,
      icon: BarChart3,
      color: 'text-neutral',
      bgColor: 'bg-neutral/10'
    },
    {
      label: 'Win Rate',
      value: `${results.win_rate}%`,
      icon: Target,
      color: results.win_rate >= 50 ? 'text-success' : 'text-warning',
      bgColor: results.win_rate >= 50 ? 'bg-success/10' : 'bg-warning/10'
    },
    {
      label: 'Max Drawdown',
      value: `${results.max_drawdown}%`,
      icon: TrendingDown,
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      label: 'Sharpe Ratio',
      value: results.sharpe_ratio?.toFixed(2) || '0.00',
      icon: Percent,
      color: results.sharpe_ratio >= 1 ? 'text-success' : 'text-warning',
      bgColor: results.sharpe_ratio >= 1 ? 'bg-success/10' : 'bg-warning/10'
    },
    {
      label: 'Winning Trades',
      value: results.winning_trades,
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      label: 'Losing Trades',
      value: results.losing_trades,
      icon: TrendingDown,
      color: 'text-error',
      bgColor: 'bg-error/10'
    }
  ]

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-header p-6 border-b border-base-300">
        <h3 className="text-lg font-semibold">Performance Metrics</h3>
      </div>
      
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <div key={index} className="stat bg-base-200 rounded-lg p-4">
                <div className="stat-figure">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${metric.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${metric.color}`} />
                  </div>
                </div>
                <div className="stat-title text-sm">{metric.label}</div>
                <div className={`stat-value text-2xl ${metric.color}`}>
                  {metric.value}
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Details */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="font-semibold mb-2">Trade Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Trades:</span>
                  <span className="font-medium">{results.total_trades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Winning Trades:</span>
                  <span className="font-medium text-success">{results.winning_trades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Losing Trades:</span>
                  <span className="font-medium text-error">{results.losing_trades}</span>
                </div>
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="font-medium">{results.win_rate}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h4 className="font-semibold mb-2">Risk Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="font-medium text-error">{results.max_drawdown}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Sharpe Ratio:</span>
                  <span className="font-medium">{results.sharpe_ratio?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Return:</span>
                  <span className={`font-medium ${results.total_return >= 0 ? 'text-success' : 'text-error'}`}>
                    {results.total_return}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Profit/Loss:</span>
                  <span className={`font-medium ${(results.final_capital - results.initial_capital) >= 0 ? 'text-success' : 'text-error'}`}>
                    ₹{(results.final_capital - results.initial_capital).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}