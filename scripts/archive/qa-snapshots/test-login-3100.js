/**
 * MalocAuto - Login Test on Port 3100
 * Tests login page elements and functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3100';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots-login-3100');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let screenshotNum = 1;

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${String(screenshotNum).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`📸 ${screenshotNum}. ${name}`);
  screenshotNum++;
  return file;
}

async function wait(seconds) {
  await new Promise(r => setTimeout(r, seconds * 1000));
}

async function runTest() {
  console.log('🚀 MalocAuto - Login Test (Port 3100)\n');
  console.log('=' .repeat(80) + '\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    
    if (type === 'error' || type === 'warning') {
      console.log(`   🔴 Browser ${type}: ${text}`);
    }
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`   ❌ Page Error: ${error.message}`);
  });

  try {
    // Step 1: Navigate to login page
    console.log('📋 Step 1: Navigate to http://localhost:3100/login');
    
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log('   ✅ Page loaded successfully\n');
    } catch (error) {
      console.log(`   ❌ Failed to load page: ${error.message}\n`);
      await screenshot(page, '01-page-load-error');
      await browser.close();
      return;
    }
    
    await wait(2);
    await screenshot(page, '01-login-page-initial');
    
    // Analyze the page
    console.log('📋 Analyzing login page elements...');
    
    const pageAnalysis = await page.evaluate(() => {
      const results = {
        pageTitle: document.title,
        url: window.location.href,
        hasEmailInput: false,
        hasPasswordInput: false,
        hasSubmitButton: false,
        emailInputInfo: null,
        passwordInputInfo: null,
        submitButtonInfo: null,
        allInputs: [],
        allButtons: [],
        pageText: ''
      };
      
      // Find email input
      const emailInput = document.querySelector('input[type="email"]') || 
                        document.querySelector('input[name="email"]') ||
                        document.querySelector('input[placeholder*="email" i]') ||
                        document.querySelector('input[id*="email" i]');
      
      if (emailInput) {
        results.hasEmailInput = true;
        results.emailInputInfo = {
          type: emailInput.type,
          name: emailInput.name,
          id: emailInput.id,
          placeholder: emailInput.placeholder,
          disabled: emailInput.disabled,
          readonly: emailInput.readOnly,
          visible: emailInput.offsetWidth > 0 && emailInput.offsetHeight > 0
        };
      }
      
      // Find password input
      const passwordInput = document.querySelector('input[type="password"]') ||
                           document.querySelector('input[name="password"]') ||
                           document.querySelector('input[placeholder*="password" i]') ||
                           document.querySelector('input[id*="password" i]');
      
      if (passwordInput) {
        results.hasPasswordInput = true;
        results.passwordInputInfo = {
          type: passwordInput.type,
          name: passwordInput.name,
          id: passwordInput.id,
          placeholder: passwordInput.placeholder,
          disabled: passwordInput.disabled,
          readonly: passwordInput.readOnly,
          visible: passwordInput.offsetWidth > 0 && passwordInput.offsetHeight > 0
        };
      }
      
      // Find submit button
      const submitButton = document.querySelector('button[type="submit"]') ||
                          document.querySelector('button:contains("Se connecter")') ||
                          document.querySelector('button:contains("Connexion")') ||
                          document.querySelector('button:contains("Login")');
      
      if (submitButton) {
        results.hasSubmitButton = true;
        results.submitButtonInfo = {
          type: submitButton.type,
          text: submitButton.textContent.trim(),
          disabled: submitButton.disabled,
          visible: submitButton.offsetWidth > 0 && submitButton.offsetHeight > 0
        };
      }
      
      // Get all inputs
      document.querySelectorAll('input').forEach(input => {
        results.allInputs.push({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder
        });
      });
      
      // Get all buttons
      document.querySelectorAll('button').forEach(button => {
        results.allButtons.push({
          type: button.type,
          text: button.textContent.trim(),
          disabled: button.disabled
        });
      });
      
      // Get page text
      results.pageText = document.body.textContent.trim().substring(0, 500);
      
      return results;
    });
    
    console.log(`   Page Title: ${pageAnalysis.pageTitle}`);
    console.log(`   URL: ${pageAnalysis.url}`);
    console.log(`   Email Input: ${pageAnalysis.hasEmailInput ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   Password Input: ${pageAnalysis.hasPasswordInput ? '✅ FOUND' : '❌ NOT FOUND'}`);
    console.log(`   Submit Button: ${pageAnalysis.hasSubmitButton ? '✅ FOUND' : '❌ NOT FOUND'}`);
    
    if (pageAnalysis.emailInputInfo) {
      console.log(`\n   📧 Email Input Details:`);
      console.log(`      Type: ${pageAnalysis.emailInputInfo.type}`);
      console.log(`      Name: ${pageAnalysis.emailInputInfo.name}`);
      console.log(`      ID: ${pageAnalysis.emailInputInfo.id}`);
      console.log(`      Placeholder: ${pageAnalysis.emailInputInfo.placeholder}`);
      console.log(`      Disabled: ${pageAnalysis.emailInputInfo.disabled ? '❌ YES' : '✅ NO'}`);
      console.log(`      Visible: ${pageAnalysis.emailInputInfo.visible ? '✅ YES' : '❌ NO'}`);
    }
    
    if (pageAnalysis.passwordInputInfo) {
      console.log(`\n   🔒 Password Input Details:`);
      console.log(`      Type: ${pageAnalysis.passwordInputInfo.type}`);
      console.log(`      Name: ${pageAnalysis.passwordInputInfo.name}`);
      console.log(`      ID: ${pageAnalysis.passwordInputInfo.id}`);
      console.log(`      Placeholder: ${pageAnalysis.passwordInputInfo.placeholder}`);
      console.log(`      Disabled: ${pageAnalysis.passwordInputInfo.disabled ? '❌ YES' : '✅ NO'}`);
      console.log(`      Visible: ${pageAnalysis.passwordInputInfo.visible ? '✅ YES' : '❌ NO'}`);
    }
    
    if (pageAnalysis.submitButtonInfo) {
      console.log(`\n   🔘 Submit Button Details:`);
      console.log(`      Text: "${pageAnalysis.submitButtonInfo.text}"`);
      console.log(`      Type: ${pageAnalysis.submitButtonInfo.type}`);
      console.log(`      Disabled: ${pageAnalysis.submitButtonInfo.disabled ? '❌ YES' : '✅ NO'}`);
      console.log(`      Visible: ${pageAnalysis.submitButtonInfo.visible ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log(`\n   📋 All Inputs Found (${pageAnalysis.allInputs.length}):`);
    pageAnalysis.allInputs.forEach((input, idx) => {
      console.log(`      ${idx + 1}. type="${input.type}" name="${input.name}" id="${input.id}" placeholder="${input.placeholder}"`);
    });
    
    console.log(`\n   🔘 All Buttons Found (${pageAnalysis.allButtons.length}):`);
    pageAnalysis.allButtons.forEach((button, idx) => {
      console.log(`      ${idx + 1}. type="${button.type}" text="${button.text}" disabled=${button.disabled}`);
    });
    
    if (!pageAnalysis.hasEmailInput || !pageAnalysis.hasPasswordInput || !pageAnalysis.hasSubmitButton) {
      console.log('\n   ⚠️  WARNING: Login form elements not found!');
      console.log('\n   Page Text Preview:');
      console.log(`   ${pageAnalysis.pageText.substring(0, 200)}...`);
      await browser.close();
      return;
    }
    
    // Step 2: Click email input and type
    console.log('\n📋 Step 2: Click email input and type "admin@malocauto.com"');
    
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      await page.click('input[type="email"]');
      console.log('   ✅ Email input clicked');
      
      await wait(0.5);
      await page.type('input[type="email"]', 'admin@malocauto.com', { delay: 50 });
      console.log('   ✅ Email typed: admin@malocauto.com\n');
      
      await screenshot(page, '02-email-entered');
    } catch (error) {
      console.log(`   ❌ Failed to interact with email input: ${error.message}\n`);
      await screenshot(page, '02-email-error');
    }
    
    // Step 3: Click password input and type
    console.log('📋 Step 3: Click password input and type "admin123"');
    
    try {
      await page.waitForSelector('input[type="password"]', { timeout: 5000 });
      await page.click('input[type="password"]');
      console.log('   ✅ Password input clicked');
      
      await wait(0.5);
      await page.type('input[type="password"]', 'admin123', { delay: 50 });
      console.log('   ✅ Password typed: admin123\n');
      
      await screenshot(page, '03-password-entered');
    } catch (error) {
      console.log(`   ❌ Failed to interact with password input: ${error.message}\n`);
      await screenshot(page, '03-password-error');
    }
    
    // Step 4: Click submit button
    console.log('📋 Step 4: Click "Se connecter" button');
    
    try {
      const buttonSelector = 'button[type="submit"]';
      await page.waitForSelector(buttonSelector, { timeout: 5000 });
      
      // Check if button is enabled before clicking
      const isButtonEnabled = await page.evaluate((selector) => {
        const button = document.querySelector(selector);
        return button && !button.disabled;
      }, buttonSelector);
      
      if (!isButtonEnabled) {
        console.log('   ⚠️  Submit button is DISABLED');
        await screenshot(page, '04-button-disabled');
      } else {
        console.log('   ✅ Submit button is enabled');
        
        await page.click(buttonSelector);
        console.log('   ✅ Submit button clicked\n');
        
        // Wait for navigation or response
        console.log('📋 Waiting for response...');
        await wait(5);
        
        const afterClickUrl = page.url();
        console.log(`   Current URL: ${afterClickUrl}`);
        
        await screenshot(page, '04-after-submit-click');
        
        // Check for any error messages
        const errorCheck = await page.evaluate(() => {
          const errors = [];
          const errorSelectors = [
            '.text-red-500',
            '.text-red-600',
            '[class*="error"]',
            '[role="alert"]',
            '.alert-error',
            '.error-message'
          ];
          
          errorSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent.trim();
              if (text) errors.push(text);
            });
          });
          
          return errors;
        });
        
        if (errorCheck.length > 0) {
          console.log('\n   🚨 Error Messages Found:');
          errorCheck.forEach(err => {
            console.log(`      - ${err}`);
          });
        } else {
          console.log('   ✅ No error messages visible');
        }
        
        if (afterClickUrl !== `${BASE_URL}/login`) {
          console.log(`   ✅ Navigation occurred - redirected to: ${afterClickUrl}`);
        } else {
          console.log('   ⚠️  Still on login page - no redirect');
        }
      }
    } catch (error) {
      console.log(`   ❌ Failed to click submit button: ${error.message}\n`);
      await screenshot(page, '04-submit-error');
    }
    
    // Final analysis
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL ANALYSIS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`📸 Total Screenshots: ${screenshotNum - 1}`);
    console.log(`📁 Location: ${SCREENSHOTS_DIR}`);
    
    console.log(`\n🔴 Console Errors (${consoleMessages.filter(m => m.type === 'error').length}):`);
    consoleMessages.filter(m => m.type === 'error').forEach(msg => {
      console.log(`   - ${msg.text}`);
    });
    
    console.log(`\n⚠️  Console Warnings (${consoleMessages.filter(m => m.type === 'warning').length}):`);
    consoleMessages.filter(m => m.type === 'warning').forEach(msg => {
      console.log(`   - ${msg.text}`);
    });
    
    console.log(`\n❌ Page Errors (${pageErrors.length}):`);
    pageErrors.forEach(err => {
      console.log(`   - ${err}`);
    });
    
    if (consoleMessages.filter(m => m.type === 'error').length === 0 && pageErrors.length === 0) {
      console.log('\n✅ No errors detected!');
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      url: `${BASE_URL}/login`,
      pageAnalysis,
      consoleMessages,
      pageErrors,
      screenshots: screenshotNum - 1
    };
    
    const reportPath = path.join(__dirname, 'test-login-3100-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed Report: test-login-3100-report.json\n`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    await wait(2);
    await browser.close();
  }
}

runTest().catch(console.error);
