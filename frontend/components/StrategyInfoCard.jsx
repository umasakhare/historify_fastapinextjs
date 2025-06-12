import { Info, Settings, TrendingUp, BarChart3 } from 'lucide-react'

export default function StrategyInfoCard({ strategy, strategyKey }) {
  if (!strategy) {
    return (
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <p className="text-center text-base-content/60">Select a strategy to view details</p>
        </div>
      </div>
    )
  }

  const getStrategyIcon = (key) => {
    switch (key) {
      case 'sma_crossover':
        return TrendingUp
      case 'rsi_strategy':
        return BarChart3
      case 'bollinger_bands':
        return Settings
      default:
        return Info
    }
  }

  const getStrategyDescription = (key) => {
    switch (key) {
      case 'sma_crossover':
        return {
          overview: 'A trend-following strategy that generates buy signals when a short-term moving average crosses above a long-term moving average, and sell signals when it crosses below.',
          pros: ['Simple to understand', 'Works well in trending markets', 'Reduces noise'],
          cons: ['Lagging indicator', 'Poor performance in sideways markets', 'Frequent whipsaws'],
          bestFor: 'Trending markets with clear directional movement'
        }
      case 'rsi_strategy':
        return {
          overview: 'A momentum oscillator strategy that identifies overbought and oversold conditions. Buys when RSI is below the oversold threshold and sells when above the overbought threshold.',
          pros: ['Good for range-bound markets', 'Identifies reversal points', 'Works across timeframes'],
          cons: ['Can stay overbought/oversold for extended periods', 'False signals in trending markets', 'Requires parameter tuning'],
          bestFor: 'Range-bound or mean-reverting markets'
        }
      case 'bollinger_bands':
        return {
          overview: 'A volatility-based strategy using Bollinger Bands. Buys when price touches the lower band (oversold) and sells when it touches the upper band (overbought).',
          pros: ['Adapts to volatility', 'Good for mean reversion', 'Visual representation of support/resistance'],
          cons: ['Poor performance in trending markets', 'Requires volatility', 'Can give false signals'],
          bestFor: 'Markets with normal volatility and mean-reverting behavior'
        }
      default:
        return {
          overview: 'Strategy information not available.',
          pros: [],
          cons: [],
          bestFor: 'Various market conditions'
        }
    }
  }

  const IconComponent = getStrategyIcon(strategyKey)
  const description = getStrategyDescription(strategyKey)

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-header p-6 border-b border-base-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <IconComponent className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{strategy.name}</h3>
            <p className="text-sm text-base-content/60">{strategy.description}</p>
          </div>
        </div>
      </div>
      
      <div className="card-body space-y-6">
        {/* Overview */}
        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Overview
          </h4>
          <p className="text-sm text-base-content/80 leading-relaxed">
            {description.overview}
          </p>
        </div>

        {/* Parameters */}
        {strategy.parameters && Object.keys(strategy.parameters).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Parameters
            </h4>
            <div className="space-y-3">
              {Object.entries(strategy.parameters).map(([paramName, config]) => (
                <div key={paramName} className="bg-base-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium capitalize">
                      {paramName.replace('_', ' ')}
                    </span>
                    <span className="badge badge-outline badge-sm">
                      {config.type}
                    </span>
                  </div>
                  <div className="text-sm text-base-content/70">
                    Default: <span className="font-medium">{config.default}</span>
                    {config.min !== undefined && config.max !== undefined && (
                      <span className="ml-2">
                        Range: {config.min} - {config.max}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2 text-success">Advantages</h4>
            <ul className="space-y-1">
              {description.pros.map((pro, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-success mt-1">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2 text-error">Disadvantages</h4>
            <ul className="space-y-1">
              {description.cons.map((con, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-error mt-1">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Best For */}
        <div className="bg-info/10 rounded-lg p-4">
          <h4 className="font-semibold mb-2 text-info">Best For</h4>
          <p className="text-sm">{description.bestFor}</p>
        </div>
      </div>
    </div>
  )
}