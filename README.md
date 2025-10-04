# WaxValue - Discogs Pricing Automation

A consumer-friendly web application that keeps your Discogs prices in sync with the market through automated pricing suggestions.

## 🎯 Mission

**"Keep your Discogs prices in sync with the market."**

WaxValue provides automated pricing suggestions for your Discogs inventory while ensuring you always stay in control. All suggested changes are displayed in a review table where you can bulk apply or approve/decline individually.

## ✨ Key Features

- **🔗 Easy Setup**: Step-by-step Discogs OAuth connection
- **📊 Smart Pricing**: Market-driven suggestions based on real data
- **🎛️ Full Control**: Approve/decline changes individually or in bulk
- **📈 Analytics**: Comprehensive metrics and trend analysis
- **⚙️ Customizable**: Flexible pricing strategies and safeguards

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Git

### Installation

1. **Clone and setup**
   ```bash
   git clone https://github.com/deepdesign/waxvalue.git
   cd waxvalue
   npm install
   ```

2. **Start development servers**
   ```bash
   # Frontend (Terminal 1)
   npm run dev
   
   # Backend (Terminal 2)
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python init_db.py
   python main.py
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## 🛠 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, React Hook Form, Zod, Recharts
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL/SQLite, Pydantic
- **Integration**: Discogs API with OAuth 1.0a
- **Development**: ESLint, Prettier, TypeScript, Git

## 📋 API Compliance

- **Discogs API**: ✅ OAuth 1.0a, rate limiting, error handling
- **Documentation**: [Discogs API Docs](https://www.discogs.com/developers)
- **User Agent**: "WaxValue/1.0 +https://waxvalue.com"

## 📚 Documentation

For detailed documentation, see the [docs/](docs/) directory:

- **[API Documentation](docs/API.md)** - Complete REST API reference
- **[Development Guide](docs/development/DEVELOPMENT_GUIDELINES.md)** - Coding standards
- **[Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)** - Production setup
- **[Testing Guide](docs/development/TESTING_GUIDE.md)** - Testing procedures

## 🔧 Configuration

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=sqlite:///./waxvalue.db
DISCOGS_CONSUMER_KEY=your_consumer_key
DISCOGS_CONSUMER_SECRET=your_consumer_secret
SECRET_KEY=your_secret_key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/deepdesign/waxvalue/issues)
- **Discussions**: [GitHub Discussions](https://github.com/deepdesign/waxvalue/discussions)

---

**WaxValue** - Keep your Discogs prices in sync with the market. 🎵