#!/usr/bin/env node

/**
 * Cross-platform deployment retry wrapper
 * Invokes the appropriate capture script and provides a concise summary
 */

import { spawn } from 'child_process';
import { platform } from 'os';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isWindows = platform() === 'win32';

console.log('🔄 Retrying deployment with full log capture...');
console.log('');

// Determine which script to run
const scriptName = isWindows ? 'capture-deploy-output.ps1' : 'capture-deploy-output.sh';
const scriptPath = join(__dirname, scriptName);

console.log(`📝 Using capture script: ${scriptName}`);
console.log(`📂 Platform: ${isWindows ? 'Windows (PowerShell)' : 'Unix/macOS/Linux (Bash)'}`);
console.log('');

// Verify script exists
if (!existsSync(scriptPath)) {
  console.error(`❌ Error: Deployment script not found at ${scriptPath}`);
  process.exit(1);
}

// Prepare command based on platform
let command, args;
if (isWindows) {
  command = 'powershell.exe';
  args = ['-ExecutionPolicy', 'Bypass', '-File', scriptPath];
} else {
  command = 'bash';
  args = [scriptPath];
}

console.log('🚀 Starting deployment process...');
console.log('   All output will be captured and saved to deployment-logs/');
console.log('   Secrets (Stripe keys, tokens) will be automatically redacted');
console.log('');
console.log('='.repeat(60));
console.log('');

// Spawn the deployment process
const deployProcess = spawn(command, args, {
  stdio: 'inherit',
  shell: false,
  cwd: process.cwd()
});

deployProcess.on('error', (error) => {
  console.error(`\n❌ Failed to start deployment process: ${error.message}`);
  process.exit(1);
});

deployProcess.on('close', (code) => {
  console.log('\n' + '='.repeat(60));
  console.log('');
  
  if (code === 0) {
    console.log('✅ DEPLOYMENT SUCCESSFUL');
    console.log('');
    console.log('Your application has been deployed to the Internet Computer.');
    console.log('');
    console.log('📁 Complete deployment log saved (see path above)');
    console.log('   • All secrets have been redacted in the log file');
    console.log('   • Safe to share for debugging purposes');
  } else {
    console.log(`❌ DEPLOYMENT FAILED (Exit Code: ${code})`);
    console.log('');
    console.log('📁 Complete deployment log saved (see path above)');
    console.log('   • All secrets have been redacted in the log file');
    console.log('   • Safe to share for debugging purposes');
    console.log('');
    console.log('🔍 What to check in the log:');
    console.log('');
    console.log('   Phase 1 - Backend Canister Compilation (Motoko)');
    console.log('     → Look for: Type errors, syntax errors, import issues');
    console.log('     → File: backend/main.mo');
    console.log('');
    console.log('   Phase 2 - Canister Installation/Upgrade');
    console.log('     → Look for: Upgrade compatibility issues, state migration errors');
    console.log('     → May need: dfx canister stop/start or state reset');
    console.log('');
    console.log('   Phase 3 - Frontend Build (TypeScript/React/Vite)');
    console.log('     → Look for: TypeScript errors, missing imports, build failures');
    console.log('     → Test locally: npm run typescript-check');
    console.log('');
    console.log('   Phase 4 - Asset Upload');
    console.log('     → Look for: Network timeouts, asset size limits exceeded');
    console.log('     → Check: Network connection, asset file sizes');
    console.log('');
    console.log('💡 Quick Fixes:');
    console.log('   • Motoko errors → Review backend/main.mo for type mismatches');
    console.log('   • Upgrade failures → Try: dfx canister stop backend && dfx canister start backend');
    console.log('   • Frontend errors → Run: npm run typescript-check in frontend/');
    console.log('   • Network issues → Verify IC network connectivity');
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  process.exit(code || 0);
});
