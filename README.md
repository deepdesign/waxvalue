# WaxValue

A consumer-friendly web app that checks Discogs listings against wider marketplace data and suggests price changes. Users stay in control, but prices can be updated automatically.

## Features

- **Secure OAuth Integration**: Connect your Discogs account safely with OAuth 1.0a
- **Market-Driven Pricing**: Suggestions based on comprehensive Discogs marketplace data
- **Custom Strategies**: Create and manage pricing strategies tailored to your business
- **Bulk Operations**: Apply or decline price changes individually or in bulk
- **Transparency**: Detailed logs, metrics, and reasoning for all suggestions
- **Responsive Design**: Works seamlessly on desktop and tablet devices

## Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hook Form** with Zod validation
- **React Hot Toast** for notifications
- **Heroicons** for icons

### Backend
- **FastAPI** for high-performance API
- **SQLAlchemy** with PostgreSQL for data persistence
- **Discogs API** integration for marketplace data
- **OAuth 1.0a** for secure authentication

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

5. Start the backend server:
```bash
python main.py
```

The backend API will be available at `http://localhost:8000`.

## Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=postgresql://user:password@localhost/waxvalue
DISCOGS_CONSUMER_KEY=your_consumer_key
DISCOGS_CONSUMER_SECRET=your_consumer_secret
SECRET_KEY=your_secret_key
```

## Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE waxvalue;
```

2. The application will automatically create tables on first run.

## Discogs API Setup

1. Go to [Discogs Developer Settings](https://www.discogs.com/settings/developers)
2. Create a new application
3. Copy your Consumer Key and Consumer Secret
4. Add them to your environment variables

## Project Structure

```
waxvalue/
├── src/                    # Next.js frontend application
│   ├── app/               # App router pages and API routes
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript definitions
├── backend/              # FastAPI backend application
│   ├── main.py          # Main application entry
│   ├── requirements.txt # Python dependencies
│   └── ...
├── docs/                # Project documentation
│   ├── README.md       # Documentation index
│   ├── deployment/     # Deployment guides
│   ├── development/    # Development setup guides
│   ├── security/       # Security documentation
│   └── archive/        # Historical documents
├── config/             # Configuration files
│   ├── systemd/        # Systemd service files
│   └── env.production.example
├── scripts/            # Development and build scripts
└── README.md          # This file
```

## 📚 Documentation

All documentation is organized in the `docs/` directory:

- **[Documentation Index](docs/README.md)** - Complete documentation overview
- **[Development Guidelines](DEVELOPMENT_GUIDELINES.md)** - Coding standards and best practices
- **[Testing Guide](TESTING_GUIDE.md)** - Testing procedures and scenarios

### Key Documentation Sections:
- **[Deployment](docs/deployment/)** - Production deployment and migration guides
- **[Development](docs/development/)** - Development environment setup (including QNAP NAS)
- **[Security](docs/security/)** - Security checklists and best practices

## API Endpoints

### Authentication
- `POST /auth/setup` - Setup OAuth authentication
- `POST /auth/verify` - Verify OAuth authorization

### Dashboard
- `GET /dashboard/summary` - Get dashboard summary data
- `POST /simulate` - Run pricing simulation

### Inventory
- `GET /inventory/suggestions` - Get pricing suggestions
- `POST /inventory/apply` - Apply individual price change
- `POST /inventory/decline` - Decline suggestion
- `POST /inventory/bulk-apply` - Apply bulk changes
- `POST /inventory/bulk-decline` - Decline bulk suggestions

### Strategies
- `GET /strategies` - Get user strategies
- `POST /strategies/create` - Create new strategy
- `POST /strategies/preview` - Preview strategy
- `POST /strategies/apply-globally` - Apply strategy globally

## Contributing

1. Follow the development guidelines in `DEVELOPMENT_GUIDELINES.md`
2. Ensure all code passes linting and type checking
3. Test thoroughly before submitting changes
4. Update documentation as needed

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: support@waxvalue.com
- Discord: [Join our community](https://discord.gg/waxvalue)
- Documentation: [Read the docs](https://docs.waxvalue.com)
