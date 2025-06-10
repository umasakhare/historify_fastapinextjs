import { Search, Menu, Sun, Moon } from 'lucide-react'

export default function Navbar({ onMenuClick, theme, onThemeToggle }) {
  return (
    <header className="bg-base-100 border-b border-base-300 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="btn btn-ghost btn-sm lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <h1 className="text-xl font-semibold text-base-content">
              Historify
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Search (Command Palette Trigger) */}
          <button 
            className="btn btn-ghost btn-sm gap-2"
            aria-label="Open search"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
            <kbd className="hidden md:inline kbd kbd-xs">⌘K</kbd>
          </button>
          
          {/* Theme toggle */}
          <button
            onClick={onThemeToggle}
            className="btn btn-ghost btn-sm tooltip tooltip-bottom"
            data-tip={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 transition-transform hover:rotate-12" />
            ) : (
              <Sun className="h-4 w-4 transition-transform hover:rotate-90" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}