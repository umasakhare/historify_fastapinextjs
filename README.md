# Historify - FastAPI + Next.js

A modern stock historical data management application built with FastAPI backend and Next.js frontend.

## 🏗️ Architecture

- **Backend**: FastAPI with SQLAlchemy ORM and SQLite database
- **Frontend**: Next.js with React and Tailwind CSS + DaisyUI
- **API**: RESTful API with automatic OpenAPI documentation
- **Database**: SQLite with dynamic table creation for symbol-exchange-interval combinations
- **Scheduler**: APScheduler for automated data downloads
- **Charts**: TradingView Lightweight Charts integration

## 📦 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application entry point
│   │   ├── core/           # Core configuration
│   │   ├── database/       # Database setup and connection
│   │   ├── models/         # SQLAlchemy models and Pydantic schemas
│   │   ├── routes/         # API route handlers
│   │   └── utils/          # Utility functions (data fetcher, scheduler)
│   ├── requirements.txt    # Python dependencies
│   └── .env.example       # Environment variables template
├── frontend/               # Next.js frontend
│   ├── components/         # React components
│   ├── pages/             # Next.js pages
│   ├── styles/            # Global styles
│   ├── package.json       # Node.js dependencies
│   └── next.config.js     # Next.js configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and settings
   ```

5. **Run the FastAPI server:**
   ```bash
   python app/main.py
   ```

   The API will be available at `http://localhost:5001`
   - API Documentation: `http://localhost:5001/docs`
   - Alternative docs: `http://localhost:5001/redoc`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The frontend will be available at `http://localhost:3000`

## 🔧 Configuration

### Backend Environment Variables (.env)

```env
# FastAPI Configuration
API_HOST=0.0.0.0
API_PORT=5001
DEBUG=True
SECRET_KEY=your_secret_key_here

# Database
DATABASE_URL=sqlite:///./historify.db

# OpenAlgo API
OPENALGO_API_KEY=your_openalgo_api_key
OPENALGO_API_HOST=http://127.0.0.1:5000

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

### OpenAlgo Integration

Add to your OpenAlgo `.env`:
```env
CORS_ALLOWED_ORIGINS = 'http://127.0.0.1:5000,http://127.0.0.1:5001,http://localhost:3000'
```

## 📊 Features

### Data Management
- **Bulk Symbol Import**: CSV/Excel file support with drag-and-drop
- **Bulk Data Export**: Multiple formats (CSV, ZIP archives)
- **Bulk Download**: One-click download for entire watchlist
- **Real-time Quotes**: Live market data with auto-refresh

### Advanced Features
- **Multiple Exchange Support**: NSE, BSE, NFO, MCX, CDS
- **Dynamic Watchlist**: Real-time quotes with persistent storage
- **TradingView Charts**: Professional-grade charting with technical indicators
- **Scheduler Manager**: Automated data downloads at specific times
- **Technical Indicators**: EMA, RSI with customizable parameters

### Modern UI/UX
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Theme switching with persistent preferences
- **Toast Notifications**: Real-time feedback for user actions
- **Loading States**: Smooth loading indicators and skeleton screens
- **Modern Components**: Built with Tailwind CSS and DaisyUI

## 🛠️ API Endpoints

### Core API Routes

- `GET /api/symbols` - Get available symbols
- `POST /api/download` - Download historical data
- `GET /api/quotes` - Get real-time quotes
- `GET /api/data` - Get OHLCV data for charts

### Watchlist Management

- `GET /api/watchlist/items` - Get watchlist items
- `POST /api/watchlist/items` - Add symbol to watchlist
- `DELETE /api/watchlist/items/{id}` - Remove symbol from watchlist

### Charts & Visualization

- `GET /api/charts/chart-data/{symbol}/{exchange}/{interval}/{ema}/{rsi}` - Chart data with indicators
- `GET /api/charts/timeframes` - Available timeframes

### Scheduler

- `GET /api/scheduler/jobs` - Get scheduled jobs
- `POST /api/scheduler/jobs` - Create scheduled job
- `DELETE /api/scheduler/jobs/{id}` - Delete scheduled job
- `POST /api/scheduler/jobs/{id}/pause` - Pause job
- `POST /api/scheduler/jobs/{id}/resume` - Resume job

### Settings

- `GET /api/settings` - Get application settings
- `POST /api/settings` - Update settings
- `POST /api/settings/test-api` - Test API connection

## 🔄 Development Workflow

### Running Both Services

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python app/main.py
   ```

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Building for Production

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app/main.py
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest
```

### Frontend Testing
```bash
cd frontend
npm run test
```

## 📝 Database Schema

The application uses SQLite with the following main tables:

- `watchlist` - User's watchlist symbols
- `stock_data` - Historical OHLCV data
- `app_settings` - Application configuration
- `scheduler_jobs` - Scheduled download jobs
- Dynamic tables for symbol-exchange-interval combinations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- FastAPI for the excellent Python web framework
- Next.js for the React framework
- TradingView for the charting library
- OpenAlgo for market data API
- Tailwind CSS and DaisyUI for the UI components

## 📞 Support

For issues and feature requests, please use the GitHub issue tracker.

---

**Note**: This is a conversion of the original Flask/Jinja2 application to a modern FastAPI + Next.js stack while maintaining all original functionality and improving the developer experience.