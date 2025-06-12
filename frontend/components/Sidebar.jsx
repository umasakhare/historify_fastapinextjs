import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  Home, 
  Eye, 
  FileText, 
  Download, 
  Upload, 
  BarChart3, 
  Clock, 
  Settings,
  X,
  TrendingUp,
  Receipt,
  Target,
  FileBarChart
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Watchlist', href: '/watchlist', icon: Eye },
  { name: 'Import', href: '/import', icon: Upload },
  { name: 'Export', href: '/export', icon: FileText },
  { name: 'Download', href: '/download', icon: Download },
  { name: 'Charts', href: '/charts', icon: BarChart3 },
  { name: 'Scheduler', href: '/scheduler', icon: Clock },
  { 
    name: 'Trading', 
    href: '#', 
    icon: TrendingUp,
    children: [
      { name: 'Backtest', href: '/backtest', icon: TrendingUp },
      { name: 'Order Book', href: '/orderbook', icon: FileBarChart },
      { name: 'Trade Book', href: '/tradebook', icon: Receipt },
      { name: 'Positions', href: '/positions', icon: Target },
    ]
  },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar({ isOpen, onClose }) {
  const router = useRouter()

  const isActiveLink = (href) => {
    if (href === '/') {
      return router.pathname === '/'
    }
    return router.pathname.startsWith(href)
  }

  const isActiveParent = (item) => {
    if (item.children) {
      return item.children.some(child => isActiveLink(child.href))
    }
    return false
  }

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-base-100 border-r border-base-300 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="ml-3 text-xl font-semibold text-base-content">
              Historify
            </span>
          </div>
          
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name} className="space-y-1">
                    <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActiveParent(item) ? 'bg-primary/10 text-primary' : 'text-base-content/60'
                    }`}>
                      <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                      {item.name}
                    </div>
                    <div className="ml-8 space-y-1">
                      {item.children.map((child) => {
                        const isActive = isActiveLink(child.href)
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary text-white'
                                : 'text-base-content hover:bg-base-200'
                            }`}
                          >
                            <child.icon className={`mr-3 flex-shrink-0 h-4 w-4 ${
                              isActive ? 'text-white' : 'text-base-content/60'
                            }`} />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              const isActive = isActiveLink(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-base-content hover:bg-base-200'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-base-content/60'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="fixed inset-y-0 left-0 w-64 bg-base-100 shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-base-300">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-base-content">
                Historify
              </span>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="mt-4 px-2 space-y-1">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name} className="space-y-1">
                    <div className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActiveParent(item) ? 'bg-primary/10 text-primary' : 'text-base-content/60'
                    }`}>
                      <item.icon className="mr-3 flex-shrink-0 h-5 w-5" />
                      {item.name}
                    </div>
                    <div className="ml-8 space-y-1">
                      {item.children.map((child) => {
                        const isActive = isActiveLink(child.href)
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={onClose}
                            className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-primary text-white'
                                : 'text-base-content hover:bg-base-200'
                            }`}
                          >
                            <child.icon className={`mr-3 flex-shrink-0 h-4 w-4 ${
                              isActive ? 'text-white' : 'text-base-content/60'
                            }`} />
                            {child.name}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              }

              const isActive = isActiveLink(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-base-content hover:bg-base-200'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-base-content/60'
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </>
  )
}