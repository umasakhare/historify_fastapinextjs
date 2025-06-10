import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import { Save, TestTube, Database, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await axios.get('/api/settings')
      setSettings(response.data)
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async (settingsToSave) => {
    setIsSaving(true)
    try {
      const response = await axios.post('/api/settings', settingsToSave)
      
      if (response.data.status === 'success') {
        toast.success('Settings saved successfully')
        loadSettings() // Reload to get updated values
      } else {
        toast.error(response.data.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApiSettingsSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const apiSettings = {
      openalgo_api_host: formData.get('api_host'),
      openalgo_api_key: formData.get('api_key')
    }

    handleSaveSettings(apiSettings)
  }

  const handleTestApiConnection = async () => {
    setIsTesting(true)
    try {
      const response = await axios.post('/api/settings/test-api')
      
      if (response.data.success) {
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error('Error testing API:', error)
      toast.error('API connection test failed')
    } finally {
      setIsTesting(false)
    }
  }

  const handleDownloadSettingsSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const downloadSettings = {
      batch_size: formData.get('batch_size'),
      rate_limit_delay: formData.get('rate_limit'),
      default_date_range: formData.get('default_range')
    }

    handleSaveSettings(downloadSettings)
  }

  const handleDisplaySettingsSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    
    const displaySettings = {
      theme: formData.get('theme'),
      auto_refresh: formData.get('auto_refresh') === 'on',
      show_tooltips: formData.get('show_tooltips') === 'on',
      chart_height: formData.get('chart_height')
    }

    handleSaveSettings(displaySettings)
  }

  if (isLoading) {
    return (
      <Layout title="Settings - Historify">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Settings - Historify">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-base-content/60">Configure your Historify application</p>
          </div>
        </div>

        {/* API Configuration */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-header p-6 border-b border-base-300">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="h-4 w-4 text-blue-600" />
              </div>
              API Configuration
            </h2>
            <p className="text-sm text-base-content/60 mt-1">Configure your OpenAlgo API connection settings</p>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleApiSettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label">
                    <span className="label-text">OpenAlgo API Host</span>
                  </label>
                  <input 
                    type="url" 
                    name="api_host"
                    className="input input-bordered w-full" 
                    defaultValue={settings.openalgo_api_host || 'http://127.0.0.1:5000'}
                    placeholder="http://127.0.0.1:5000"
                    required
                  />
                  <div className="label">
                    <span className="label-text-alt">The base URL for your OpenAlgo API instance</span>
                  </div>
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">API Key</span>
                  </label>
                  <div className="join w-full">
                    <input 
                      type={showApiKey ? "text" : "password"}
                      name="api_key"
                      className="input input-bordered join-item flex-1" 
                      defaultValue={settings.openalgo_api_key || ''}
                      placeholder="Enter your API key"
                    />
                    <button 
                      type="button"
                      className="btn btn-outline join-item"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <div className="label">
                    <span className="label-text-alt">Your OpenAlgo API authentication key</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-4 border-t border-base-300">
                <button 
                  type="button"
                  onClick={handleTestApiConnection}
                  className="btn btn-outline gap-2"
                  disabled={isTesting}
                >
                  {isTesting ? <LoadingSpinner size="sm" /> : <TestTube className="h-4 w-4" />}
                  Test Connection
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                  Save API Settings
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Download Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-header p-6 border-b border-base-300">
            <h2 className="text-lg font-semibold">Download Settings</h2>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleDownloadSettingsSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Batch Size</span>
                </label>
                <input 
                  type="number" 
                  name="batch_size"
                  className="input input-bordered w-full" 
                  defaultValue={settings.batch_size || 10}
                  min="1" 
                  max="50"
                />
                <div className="label">
                  <span className="label-text-alt">Number of symbols to process per batch</span>
                </div>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Rate Limit Delay (ms)</span>
                </label>
                <input 
                  type="number" 
                  name="rate_limit"
                  className="input input-bordered w-full" 
                  defaultValue={settings.rate_limit_delay || 100}
                  min="0" 
                  max="5000"
                />
                <div className="label">
                  <span className="label-text-alt">Delay between API requests in milliseconds</span>
                </div>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Default Date Range</span>
                </label>
                <select name="default_range" className="select select-bordered w-full">
                  <option value="30" selected={settings.default_date_range === 30}>Last 30 days</option>
                  <option value="90" selected={settings.default_date_range === 90}>Last 90 days</option>
                  <option value="180" selected={settings.default_date_range === 180}>Last 180 days</option>
                  <option value="365" selected={settings.default_date_range === 365}>Last 1 year</option>
                  <option value="730" selected={settings.default_date_range === 730}>Last 2 years</option>
                </select>
              </div>
              
              <button type="submit" className="btn btn-primary gap-2" disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                Save Download Settings
              </button>
            </form>
          </div>
        </div>

        {/* Display Settings */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-header p-6 border-b border-base-300">
            <h2 className="text-lg font-semibold">Display Settings</h2>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleDisplaySettingsSubmit} className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Theme</span>
                </label>
                <select name="theme" className="select select-bordered w-full">
                  <option value="system" selected={settings.theme === 'system'}>System Default</option>
                  <option value="light" selected={settings.theme === 'light'}>Light</option>
                  <option value="dark" selected={settings.theme === 'dark'}>Dark</option>
                </select>
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">Chart Height</span>
                </label>
                <input 
                  type="number" 
                  name="chart_height"
                  className="input input-bordered w-full" 
                  defaultValue={settings.chart_height || 400}
                  min="200" 
                  max="800"
                />
                <div className="label">
                  <span className="label-text-alt">Default chart height in pixels</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input 
                      type="checkbox" 
                      name="auto_refresh"
                      className="checkbox checkbox-primary" 
                      defaultChecked={settings.auto_refresh !== false}
                    />
                    <span className="label-text">Enable auto-refresh for real-time quotes</span>
                  </label>
                </div>
                
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input 
                      type="checkbox" 
                      name="show_tooltips"
                      className="checkbox checkbox-primary" 
                      defaultChecked={settings.show_tooltips !== false}
                    />
                    <span className="label-text">Show tooltips</span>
                  </label>
                </div>
              </div>
              
              <button type="submit" className="btn btn-primary gap-2" disabled={isSaving}>
                {isSaving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                Save Display Settings
              </button>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card bg-error/10 border border-error/20 shadow-sm">
          <div className="card-header p-6 border-b border-error/20">
            <h2 className="text-lg font-semibold text-error">Danger Zone</h2>
          </div>
          
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <button className="btn btn-error gap-2">
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </button>
                <p className="text-sm text-error/70 mt-2">
                  This will delete all downloaded historical data. This action cannot be undone.
                </p>
              </div>
              
              <div>
                <button className="btn btn-error gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reset to Defaults
                </button>
                <p className="text-sm text-error/70 mt-2">
                  Reset all settings to their default values.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}