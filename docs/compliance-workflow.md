# WaxValue Compliance Workflow

## Overview

This document explains how to ensure that `DEVELOPMENT_GUIDELINES.md` and all referenced links are checked before every code change to the WaxValue project.

## Mandatory Pre-Development Process

### 1. Automated Compliance Check

Before making any code changes, run the automated compliance checker:

```bash
npm run check-compliance
```

This script will:
- ✅ Verify all required documentation files exist
- ✅ Check accessibility of external documentation links
- ✅ Provide a compliance summary
- ❌ Fail if any requirements are not met

### 2. Manual Pre-Development Checklist

Complete the manual checklist in `docs/pre-development-checklist.md`:

- [ ] Read and understand `DEVELOPMENT_GUIDELINES.md`
- [ ] Check Tailwind CSS documentation compliance
- [ ] Verify Discogs API integration requirements
- [ ] Review TypeScript and security best practices
- [ ] Confirm performance and testing requirements

### 3. Integration with Development Workflow

The compliance check is integrated into the development workflow:

```bash
# This will run compliance check, type checking, and linting before development
npm run pre-dev

# Or run individually:
npm run check-compliance  # Check documentation and links
npm run type-check        # TypeScript validation
npm run lint             # Code style validation
```

## Required Documentation

### Core Files
- `DEVELOPMENT_GUIDELINES.md` - Main development guidelines
- `docs/iteration-checklist.md` - Iteration-specific checklist
- `docs/pre-development-checklist.md` - Pre-development compliance checklist

### External Links
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Discogs API Documentation](https://www.discogs.com/developers)

## Compliance Areas

### 1. Tailwind CSS Components
- Use Tailwind utility classes instead of custom implementations
- Follow Tailwind's design system and theming
- Implement proper responsive design patterns
- Ensure accessibility compliance

### 2. Discogs API Integration
- Implement OAuth 1.0a authentication correctly
- Handle rate limiting (60 requests/minute)
- Use proper error handling and retry logic
- Secure token storage and transmission

### 3. TypeScript & Security
- Strict type checking enabled
- No client-side API keys or secrets
- Proper input validation and sanitization
- Secure environment variable handling

### 4. Performance & Testing
- Implement caching strategies
- Optimize API calls and React components
- Write comprehensive tests
- Monitor performance metrics

## Enforcement

### Automatic Enforcement
- CI/CD pipeline includes compliance checks
- Pre-commit hooks verify documentation review
- Automated scripts check link accessibility

### Manual Enforcement
- Code review process requires compliance verification
- Development team training on guidelines
- Regular compliance audits

## Troubleshooting

### Common Issues

**File Not Found Errors:**
```bash
# Ensure you're in the project root
cd /path/to/waxvalue-project

# Check if files exist
ls -la DEVELOPMENT_GUIDELINES.md
ls -la docs/
```

**URL Accessibility Issues:**
- Check internet connection
- Verify external documentation links are still valid
- Contact documentation maintainers if links are broken

**Compliance Check Failures:**
- Review the specific error messages
- Update documentation if requirements have changed
- Ensure all team members are aware of compliance requirements

### Getting Help

If you encounter compliance issues:
1. Check the error messages in the compliance checker output
2. Review the `DEVELOPMENT_GUIDELINES.md` file for clarification
3. Verify external documentation links are accessible
4. Contact the development team for guidance

## Updates

This workflow should be updated when:
- New compliance requirements are added
- External documentation links change
- Development guidelines are modified
- New tools or processes are introduced

---

**Remember:** Compliance checking is not optional. Every code change must pass the compliance verification process before implementation.

