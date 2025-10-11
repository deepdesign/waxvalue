#!/usr/bin/env node

/**
 * WaxValue API Compliance Checker
 * 
 * This script checks for deprecated code, API compliance issues,
 * and ensures all integrations are up to date.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const CONFIG = {
  // API Documentation URLs
  STREAMLINE_API_URL: 'https://streamline-api.readme.io/reference/introduction',
  DISCOGS_API_URL: 'https://www.discogs.com/developers',
  
  // File patterns to check
  FRONTEND_PATTERNS: [
    'src/**/*.tsx',
    'src/**/*.ts',
    'src/**/*.js',
    'src/**/*.jsx'
  ],
  
  BACKEND_PATTERNS: [
    'backend/**/*.py'
  ],
  
  // Deprecated patterns to check for
  DEPRECATED_PATTERNS: {
    // React/Next.js deprecations
    'componentWillMount': 'Use useEffect instead',
    'componentWillReceiveProps': 'Use useEffect with dependencies',
    'componentWillUpdate': 'Use useEffect or getSnapshotBeforeUpdate',
    'UNSAFE_': 'Remove UNSAFE_ lifecycle methods',
    
    // API deprecations
    'fetch.*then.*catch': 'Consider using async/await for better error handling',
    'XMLHttpRequest': 'Use fetch API instead',
    
    // CSS deprecations
    'float:': 'Use flexbox or grid instead',
    'display: table': 'Use flexbox or grid instead',
    
    // Node.js deprecations
    'require.*fs.*readFileSync': 'Consider using fs.promises for async operations',
    'process.env.NODE_ENV.*development': 'Use proper environment variable handling'
  },
  
  // Required API integrations
  REQUIRED_INTEGRATIONS: {
    'discogs': {
      patterns: ['DiscogsClient', 'DiscogsOAuth', 'discogs_client'],
      description: 'Discogs API integration'
    },
    'oauth': {
      patterns: ['oauth', 'OAuth', 'request_token', 'access_token'],
      description: 'OAuth 1.0a implementation'
    }
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ComplianceChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.success = [];
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
    this.issues.push(message);
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
    this.warnings.push(message);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
    this.success.push(message);
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  // Check for deprecated patterns in files
  checkDeprecatedPatterns() {
    this.log('\n🔍 Checking for deprecated code patterns...', 'cyan');
    
    const projectRoot = process.cwd();
    const filesToCheck = this.getAllFiles(projectRoot, ['.tsx', '.ts', '.js', '.jsx', '.py']);
    
    for (const file of filesToCheck) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(projectRoot, file);
        
        for (const [pattern, suggestion] of Object.entries(CONFIG.DEPRECATED_PATTERNS)) {
          const regex = new RegExp(pattern, 'gi');
          if (regex.test(content)) {
            this.logWarning(`Deprecated pattern found in ${relativePath}: ${pattern} - ${suggestion}`);
          }
        }
      } catch (error) {
        this.logError(`Error reading file ${file}: ${error.message}`);
      }
    }
  }

  // Check for required API integrations
  checkRequiredIntegrations() {
    this.log('\n🔗 Checking required API integrations...', 'cyan');
    
    const projectRoot = process.cwd();
    const filesToCheck = this.getAllFiles(projectRoot, ['.tsx', '.ts', '.js', '.jsx', '.py']);
    
    for (const [integration, config] of Object.entries(CONFIG.REQUIRED_INTEGRATIONS)) {
      let found = false;
      
      for (const file of filesToCheck) {
        try {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const pattern of config.patterns) {
            if (content.includes(pattern)) {
              found = true;
              break;
            }
          }
          
          if (found) break;
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      if (found) {
        this.logSuccess(`${config.description} integration found`);
      } else {
        this.logError(`Missing required integration: ${config.description}`);
      }
    }
  }

  // Check package.json for outdated dependencies
  checkDependencies() {
    this.log('\n📦 Checking dependencies...', 'cyan');
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const backendRequirementsPath = path.join(process.cwd(), 'backend', 'requirements.txt');
    
    // Check frontend dependencies
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Check for known problematic versions
        const problematicVersions = {
          'react': ['16.0.0', '17.0.0'], // Suggest React 18+
          'next': ['12.0.0', '13.0.0'], // Suggest Next.js 14+
          'typescript': ['4.0.0', '4.9.0'] // Suggest TypeScript 5+
        };
        
        for (const [dep, versions] of Object.entries(problematicVersions)) {
          if (dependencies[dep]) {
            const currentVersion = dependencies[dep];
            if (versions.some(v => currentVersion.includes(v))) {
              this.logWarning(`Consider updating ${dep} from ${currentVersion} to latest version`);
            } else {
              this.logSuccess(`${dep} version looks good: ${currentVersion}`);
            }
          }
        }
      } catch (error) {
        this.logError(`Error reading package.json: ${error.message}`);
      }
    }
    
    // Check backend dependencies
    if (fs.existsSync(backendRequirementsPath)) {
      try {
        const requirements = fs.readFileSync(backendRequirementsPath, 'utf8');
        
        // Check for known problematic versions
        if (requirements.includes('fastapi==0.68.0')) {
          this.logWarning('Consider updating FastAPI to latest version');
        } else {
          this.logSuccess('FastAPI version looks good');
        }
        
        if (requirements.includes('pydantic==1.8.0')) {
          this.logWarning('Consider updating Pydantic to v2 for better performance');
        } else {
          this.logSuccess('Pydantic version looks good');
        }
      } catch (error) {
        this.logError(`Error reading requirements.txt: ${error.message}`);
      }
    }
  }

  // Check TypeScript configuration
  checkTypeScriptConfig() {
    this.log('\n📝 Checking TypeScript configuration...', 'cyan');
    
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        // Check for recommended settings
        if (tsconfig.compilerOptions?.strict === true) {
          this.logSuccess('TypeScript strict mode enabled');
        } else {
          this.logWarning('Consider enabling TypeScript strict mode');
        }
        
        if (tsconfig.compilerOptions?.noImplicitAny === true) {
          this.logSuccess('TypeScript noImplicitAny enabled');
        } else {
          this.logWarning('Consider enabling noImplicitAny for better type safety');
        }
        
        if (tsconfig.compilerOptions?.target === 'ES2020' || tsconfig.compilerOptions?.target === 'ES2022') {
          this.logSuccess('TypeScript target version is modern');
        } else {
          this.logWarning('Consider updating TypeScript target to ES2020 or later');
        }
      } catch (error) {
        this.logError(`Error reading tsconfig.json: ${error.message}`);
      }
    } else {
      this.logError('tsconfig.json not found');
    }
  }

  // Check for security issues
  checkSecurity() {
    this.log('\n🔒 Checking for security issues...', 'cyan');
    
    const projectRoot = process.cwd();
    const filesToCheck = this.getAllFiles(projectRoot, ['.tsx', '.ts', '.js', '.jsx', '.py', '.env']);
    
    const securityPatterns = {
      'password.*=.*["\']': 'Hardcoded passwords detected',
      'api_key.*=.*["\']': 'Hardcoded API keys detected',
      'secret.*=.*["\']': 'Hardcoded secrets detected',
      'eval\\(': 'Use of eval() function (security risk)',
      'innerHTML.*=': 'Potential XSS risk with innerHTML',
      'dangerouslySetInnerHTML': 'Potential XSS risk with dangerouslySetInnerHTML'
    };
    
    for (const file of filesToCheck) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const relativePath = path.relative(projectRoot, file);
        
        for (const [pattern, message] of Object.entries(securityPatterns)) {
          const regex = new RegExp(pattern, 'gi');
          if (regex.test(content)) {
            this.logWarning(`Security concern in ${relativePath}: ${message}`);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }

  // Check API documentation compliance
  async checkAPIDocumentation() {
    this.log('\n📚 Checking API documentation compliance...', 'cyan');
    
    // Check if Discogs API documentation is accessible
    try {
      await this.checkURL(CONFIG.DISCOGS_API_URL);
      this.logSuccess('Discogs API documentation is accessible');
    } catch (error) {
      this.logWarning(`Discogs API documentation check failed: ${error.message}`);
    }
    
    // Check if Streamline documentation is accessible
    try {
      await this.checkURL(CONFIG.STREAMLINE_API_URL);
      this.logSuccess('Streamline API documentation is accessible');
    } catch (error) {
      this.logWarning(`Streamline API documentation check failed: ${error.message}`);
    }
  }

  // Helper method to check URL accessibility
  checkURL(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      });
      
      request.on('error', reject);
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  // Helper method to get all files matching patterns
  getAllFiles(dir, extensions) {
    const files = [];
    
    const walkDir = (currentDir) => {
      try {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip node_modules, .git, and other common directories
            if (!['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', 'venv'].includes(item)) {
              walkDir(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    walkDir(dir);
    return files;
  }

  // Generate compliance report
  generateReport() {
    this.log('\n📊 Compliance Report Summary', 'magenta');
    this.log('=' .repeat(50), 'magenta');
    
    this.log(`\n✅ Successes: ${this.success.length}`, 'green');
    this.success.forEach(item => this.log(`   • ${item}`, 'green'));
    
    this.log(`\n⚠️  Warnings: ${this.warnings.length}`, 'yellow');
    this.warnings.forEach(item => this.log(`   • ${item}`, 'yellow'));
    
    this.log(`\n❌ Issues: ${this.issues.length}`, 'red');
    this.issues.forEach(item => this.log(`   • ${item}`, 'red'));
    
    const totalChecks = this.success.length + this.warnings.length + this.issues.length;
    const successRate = totalChecks > 0 ? (this.success.length / totalChecks * 100).toFixed(1) : 0;
    
    this.log(`\n📈 Overall Compliance: ${successRate}%`, successRate > 80 ? 'green' : successRate > 60 ? 'yellow' : 'red');
    
    if (this.issues.length === 0) {
      this.log('\n🎉 All compliance checks passed!', 'green');
      process.exit(0);
    } else {
      this.log('\n⚠️  Some compliance issues found. Please review and fix.', 'yellow');
      process.exit(1);
    }
  }

  // Main execution method
  async run() {
    this.log('🔍 WaxValue API Compliance Checker', 'cyan');
    this.log('=' .repeat(40), 'cyan');
    
    try {
      this.checkDeprecatedPatterns();
      this.checkRequiredIntegrations();
      this.checkDependencies();
      this.checkTypeScriptConfig();
      this.checkSecurity();
      await this.checkAPIDocumentation();
      
      this.generateReport();
    } catch (error) {
      this.logError(`Compliance check failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the compliance checker
if (require.main === module) {
  const checker = new ComplianceChecker();
  checker.run();
}

module.exports = ComplianceChecker;