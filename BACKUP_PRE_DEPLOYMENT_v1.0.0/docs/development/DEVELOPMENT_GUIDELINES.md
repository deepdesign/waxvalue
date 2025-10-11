# WaxValue Development Guidelines

This document outlines the coding standards, best practices, and compliance requirements for the WaxValue project.

## 🎯 Overview

Every code iteration must follow the latest documentation and best practices for:
- Tailwind CSS components
- Discogs API integration
- TypeScript and security standards
- Performance optimization

### Tailwind CSS Components
**Reference**: https://tailwindcss.com/docs

#### Pre-Development Checklist
- [ ] Review latest Tailwind CSS documentation for utility updates
- [ ] Check for deprecated utility classes
- [ ] Verify TypeScript definitions are up to date
- [ ] Confirm responsive design patterns
- [ ] Validate accessibility requirements

#### Component Usage Guidelines
- Use Tailwind's utility classes for tab implementations [[memory:6417303]]
- Follow Tailwind's design system for consistent UI
- Implement proper loading states and error handling
- Ensure all components are responsive for desktop/tablet
- Use Tailwind's built-in utility classes and design tokens

#### Code Review Checklist
- [ ] All UI components use Tailwind CSS utility classes where applicable
- [ ] No custom implementations that duplicate Tailwind functionality
- [ ] Proper TypeScript types for component props
- [ ] Responsive design follows Tailwind patterns
- [ ] Accessibility features are implemented using Tailwind utilities

### Discogs API Integration
**Reference**: https://www.discogs.com/developers

#### Authentication & OAuth Flow
- [ ] Implement OAuth 1.0a flow correctly
- [ ] Handle request token generation
- [ ] Manage authorization URL redirection
- [ ] Process verifier code exchange for access token
- [ ] Store access tokens securely

#### API Rate Limiting
- [ ] Implement 60 requests per minute limit for authenticated users
- [ ] Add proper throttling and queue management
- [ ] Handle rate limit exceeded responses gracefully
- [ ] Implement exponential backoff for retries

#### Data Models & Endpoints
- [ ] Use correct Discogs API endpoints for inventory fetching
- [ ] Implement proper market data retrieval
- [ ] Handle pagination for large inventories
- [ ] Process condition ratings correctly (Mint, Near Mint, etc.)
- [ ] Map Discogs media types to internal representations

#### Error Handling
- [ ] Handle API authentication failures
- [ ] Manage network timeouts and retries
- [ ] Process API error responses appropriately
- [ ] Log API interactions for debugging
- [ ] Provide user-friendly error messages

### Code Quality Standards

#### TypeScript Compliance
- [ ] Strict type checking enabled
- [ ] No `any` types without justification
- [ ] Proper interface definitions for API responses
- [ ] Type-safe component props and state management

#### Security Best Practices
- [ ] No API keys or secrets in client-side code
- [ ] Proper environment variable handling
- [ ] Secure token storage and transmission
- [ ] Input validation and sanitization
- [ ] CSRF protection for API endpoints

#### Performance Optimization
- [ ] Implement proper caching strategies
- [ ] Optimize API calls with batching where possible
- [ ] Use React.memo and useMemo for expensive operations
- [ ] Implement lazy loading for large datasets
- [ ] Minimize bundle size and optimize assets

### Testing Requirements
- [ ] Unit tests for all utility functions
- [ ] Integration tests for API endpoints
- [ ] Component tests for UI interactions
- [ ] End-to-end tests for critical user flows
- [ ] API mocking for development and testing

### Deployment Checklist
- [ ] Environment variables properly configured
- [ ] Database migrations applied
- [ ] API endpoints secured with proper authentication
- [ ] Error monitoring and logging configured
- [ ] Performance monitoring in place

## 🔄 Maintenance & Monitoring

### Regular Tasks
- [ ] Weekly check for Tailwind CSS updates
- [ ] Monthly review of Discogs API changes  
- [ ] Quarterly security audit of dependencies
- [ ] Regular performance profiling and optimization

### Deprecation Monitoring
- Monitor Tailwind CSS changelog for deprecated utilities
- Subscribe to Discogs API announcements
- Regular `npm audit` for security vulnerabilities
- Update dependencies monthly with thorough testing

## 📚 Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Discogs API**: https://www.discogs.com/developers
- **Documentation Index**: [docs/README.md](docs/README.md)
- **Testing Guide**: [TESTING_GUIDE.md](TESTING_GUIDE.md)

---

*Last Updated: January 2025*  
*Next Review: Monthly*