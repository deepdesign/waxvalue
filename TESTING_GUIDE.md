# WaxValue Testing Guide

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Testing Scenarios](#-testing-scenarios)
  - [Landing Page & Authentication](#1-landing-page--authentication-flow)
  - [Dashboard Features](#2-dashboard-features)
  - [Settings Page](#3-settings-page)
  - [Strategies Page](#4-strategies-page)
  - [Logs Page](#5-logs-page)
  - [Metrics Page](#6-metrics-page)
  - [Help Page](#7-help-page)
- [API Testing](#-api-testing)
- [Common Issues & Solutions](#-common-issues--solutions)
- [Mobile Responsiveness](#8-mobile-responsiveness-testing)
- [Performance Testing](#-performance-testing)
- [Automated Testing](#-automated-testing)
- [Production Testing](#-production-testing)

## 🚀 Quick Start

### Automated Setup (Recommended)
```bash
# Run the development startup script
./start-dev.bat
```

### Manual Setup
```bash
# Terminal 1: Start Backend
cd backend && python main-dev.py

# Terminal 2: Start Frontend  
npm run dev
```

## 🧪 Testing Scenarios

### 1. **Landing Page & Authentication Flow**
- [ ] **Welcome Page**: Visit `http://localhost:3000`
  - Should show rich landing page with WaxValue branding
  - Features "Get Started" buttons that link to authentication
  - Beautiful gradient background and feature descriptions

- [ ] **Authentication Page**: Click "Get Started" from landing page
  - Redirects to `/auth` with login form by default
  - Can switch between login and register forms
  - Test demo account: `demo@waxvalue.com` / `demo123`
  - "Back to Home" link returns to landing page

- [ ] **Registration Flow**:
  - Click "Create an account" to switch to register form
  - Fill in first name, last name, email, password
  - Password must be 8+ chars with uppercase, lowercase, number
  - Agree to terms and conditions
  - Click "Create Account" → redirects to dashboard

- [ ] **Login Flow**:
  - Enter email and password
  - Click "Sign In" → redirects to dashboard
  - Test "Remember me" functionality
  - Test "Forgot password" link (placeholder)

- [ ] **Discogs Connection** (after login):
  - Go to `/setup` or Settings → Discogs Account
  - Enter mock credentials (any values work)
  - Click "Get Authorization Link"
  - Click "Open Discogs" (opens new tab)
  - Enter any verification code
  - Should show "Connected" status

### 2. **Dashboard Features**
- [ ] **Onboarding Banner**: Should appear if not connected (cannot be dismissed)
- [ ] **Summary Cards**: Display mock data (150 listings, 3 suggestions, etc.)
- [ ] **Filters Bar**: 
  - Test status filter (For Sale, Draft, Sold)
  - Test format filter (Vinyl, CD, etc.)
  - Test condition filter (NM, VG+, etc.)
  - Test price range slider
  - Test "Show flagged only" toggle
- [ ] **Inventory Table**:
  - Test inline price editing (click pencil icon)
  - Test bulk selection (checkboxes)
  - Test Apply/Decline buttons
  - Test status indicators (Normal, Auto-applied, Flagged)

### 3. **Settings Page**
- [ ] **Discogs Account**: Test connection flow
- [ ] **Automation Settings**: 
  - Toggle auto-update increases
  - Set alert threshold
  - Configure daily schedule
- [ ] **General Settings**: 
  - Change currency
  - Set global floor/ceiling
  - Configure rate limits

### 4. **Strategies Page**
- [ ] **Preset Strategies**: View available templates
- [ ] **Custom Strategy**: 
  - Create new strategy
  - Set anchor metric (median, mean, etc.)
  - Configure offset and type
  - Test preview functionality
- [ ] **Strategy Application**: Test global application

### 5. **Logs Page**
- [ ] **Run History**: View mock run logs
- [ ] **Export CSV**: Test download functionality
- [ ] **Log Details**: Expand to see item snapshots

### 6. **Metrics Page**
- [ ] **Portfolio Summary**: View KPI cards
- [ ] **Trends Chart**: Interactive line chart
- [ ] **Distribution Chart**: Bar chart visualization
- [ ] **Item Drilldown**: 
  - Click on individual items
  - View sparklines and rankings
  - Test detail modal

### 7. **Help Page**
- [ ] **FAQ Section**: All questions should be answered
- [ ] **Detailed Guides**: Step-by-step instructions
- [ ] **Support Links**: Email and Discord links

## 🔧 API Testing

### Backend Endpoints (http://localhost:8000)
```bash
# Test authentication
curl http://localhost:8000/auth/me

# Test dashboard summary
curl http://localhost:8000/dashboard/summary

# Test inventory suggestions
curl http://localhost:8000/inventory/suggestions

# Test strategies
curl http://localhost:8000/strategies

# Test logs
curl http://localhost:8000/logs

# Test metrics
curl http://localhost:8000/metrics/portfolio
```

## 🐛 Common Issues & Solutions

### Frontend Issues
- **Port 3000 in use**: Change port with `npm run dev -- -p 3001`
- **Build errors**: Run `npm run lint` and fix TypeScript errors
- **Styling issues**: Check Tailwind CSS is working

### Backend Issues
- **Port 8000 in use**: Change port in `main-dev.py`
- **Import errors**: Ensure all dependencies are installed
- **CORS errors**: Check CORS middleware configuration

### Integration Issues
- **API calls failing**: Check Next.js proxy configuration in `next.config.js`
- **Data not loading**: Verify backend is running on port 8000
- **Authentication issues**: Check localStorage for user data

### 8. **Mobile Responsiveness Testing**
- [ ] **Landing Page**: Test on mobile viewport (320px-768px)
  - Hero section scales properly
  - Feature cards stack vertically
  - Buttons are touch-friendly
  - Text remains readable

- [ ] **Authentication Pages**: Test mobile forms
  - Form inputs are properly sized
  - Buttons are full-width on mobile
  - Touch targets are adequate (44px minimum)
  - Keyboard navigation works

- [ ] **Dashboard Mobile View**:
  - Summary cards stack vertically
  - Filters collapse to mobile-friendly layout
  - Table data shows as cards on mobile
  - Navigation drawer works properly

- [ ] **Inventory Table Mobile**:
  - Desktop table hidden on mobile (< lg breakpoint)
  - Mobile card layout shows all data
  - Action buttons are touch-friendly
  - Horizontal scrolling avoided

- [ ] **Charts and Metrics**:
  - Charts scale to mobile viewport
  - Tooltips work on touch devices
  - Data remains readable on small screens

- [ ] **Forms and Settings**:
  - All form inputs are mobile-optimized
  - Multi-step wizards work on mobile
  - Settings panels are touch-friendly

## 📊 Performance Testing

### Frontend Performance
```bash
# Build and analyze
npm run build
npm run start

# Check bundle size
npm run analyze
```

### Backend Performance
```bash
# Test API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/dashboard/summary
```

## 🧪 Automated Testing

### Unit Tests
```bash
# Run component tests
npm run test

# Run with coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test API endpoints
npm run test:api

# Test full user flows
npm run test:e2e
```

## 📝 Test Data

The development backend includes mock data:
- **Demo User**: demo@waxvalue.com / demo123
- **Listings**: 150 mock items
- **Suggestions**: 3 pricing suggestions
- **Logs**: 2 run history entries
- **Strategies**: 1 active strategy

## 🛡️ Error Handling Features
- **Global Error Boundary**: Catches and displays application errors gracefully
- **404 Page**: Custom not-found page with navigation options  
- **Development Errors**: Detailed error information in development mode
- **User-Friendly Messages**: Clear error messages for production users

## 📱 Mobile Responsiveness Features
- **Responsive Tables**: Desktop tables with mobile card layouts for complex data
- **Touch-Friendly Controls**: Larger touch targets and proper spacing on mobile
- **Collapsible Filters**: Mobile-optimized filter interfaces
- **Stacked Layouts**: Responsive grids that stack on smaller screens
- **Mobile Navigation**: Hamburger menu and mobile-optimized sidebar
- **Responsive Charts**: Charts that adapt to mobile viewport sizes
- **Mobile Forms**: Optimized form layouts with proper input sizing

## 🚀 Production Testing

### Environment Variables
```bash
# Set production environment
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost/waxvalue
DISCOGS_API_URL=https://api.discogs.com
```

### Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### Security Testing
- [ ] Test authentication flows
- [ ] Verify CORS configuration
- [ ] Check input validation
- [ ] Test rate limiting

## 📋 Testing Checklist

### Pre-Release
- [ ] All user flows work end-to-end
- [ ] No console errors
- [ ] Responsive design works on mobile
- [ ] Performance is acceptable
- [ ] Security measures in place
- [ ] Documentation is complete

### Post-Release
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Verify analytics
- [ ] Test backup/restore
- [ ] Monitor performance metrics

## 🆘 Getting Help

If you encounter issues:
1. Check the browser console for errors
2. Check the backend terminal for errors
3. Verify all dependencies are installed
4. Check the API endpoints directly
5. Review the documentation

For additional support, check the Help page in the application or contact the development team.
