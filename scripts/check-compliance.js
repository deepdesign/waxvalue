#!/usr/bin/env node

/**
 * WaxValue Development Compliance Checker
 * 
 * This script verifies that all required documentation and links are accessible
 * before making code changes to the WaxValue project.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Required files and URLs to check
const REQUIRED_FILES = [
    'DEVELOPMENT_GUIDELINES.md',
    'docs/iteration-checklist.md',
    'docs/pre-development-checklist.md'
];

const REQUIRED_URLS = [
    'https://streamline-api.readme.io/reference/introduction',
    'https://www.discogs.com/developers'
];

function checkFileExists(filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ File exists: ${filePath}`);
        return true;
    } else {
        console.log(`❌ File missing: ${filePath}`);
        return false;
    }
}

function checkUrlAccessible(url) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            // Accept 200-399 and 403 (forbidden but accessible)
            if ((res.statusCode >= 200 && res.statusCode < 400) || res.statusCode === 403) {
                console.log(`✅ URL accessible: ${url} (status: ${res.statusCode})`);
                resolve(true);
            } else {
                console.log(`❌ URL returned status ${res.statusCode}: ${url}`);
                resolve(false);
            }
        });
        
        req.on('error', (err) => {
            console.log(`❌ URL error: ${url} - ${err.message}`);
            resolve(false);
        });
        
        req.setTimeout(10000, () => {
            console.log(`❌ URL timeout: ${url}`);
            req.destroy();
            resolve(false);
        });
    });
}

async function checkCompliance() {
    console.log('🔍 WaxValue Development Compliance Check\n');
    
    let allFilesExist = true;
    let allUrlsAccessible = true;
    
    // Check required files
    console.log('📁 Checking required files...');
    for (const file of REQUIRED_FILES) {
        if (!checkFileExists(file)) {
            allFilesExist = false;
        }
    }
    
    console.log('\n🌐 Checking required URLs...');
    for (const url of REQUIRED_URLS) {
        const accessible = await checkUrlAccessible(url);
        if (!accessible) {
            allUrlsAccessible = false;
        }
    }
    
    console.log('\n📋 Compliance Summary:');
    console.log(`Files: ${allFilesExist ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`URLs: ${allUrlsAccessible ? '✅ PASS' : '❌ FAIL'}`);
    
    if (allFilesExist && allUrlsAccessible) {
        console.log('\n🎉 All compliance checks passed! You may proceed with development.');
        console.log('\n📝 Remember to:');
        console.log('- Complete the pre-development checklist');
        console.log('- Review DEVELOPMENT_GUIDELINES.md thoroughly');
        console.log('- Verify Streamline and Discogs API compliance');
        process.exit(0);
    } else {
        console.log('\n⚠️  Compliance checks failed! Please resolve issues before proceeding.');
        console.log('\n📝 Required actions:');
        if (!allFilesExist) {
            console.log('- Ensure all required documentation files exist');
        }
        if (!allUrlsAccessible) {
            console.log('- Check internet connection and URL accessibility');
            console.log('- Verify external documentation links are still valid');
        }
        process.exit(1);
    }
}

// Run the compliance check
checkCompliance().catch((error) => {
    console.error('❌ Compliance check failed with error:', error);
    process.exit(1);
});
