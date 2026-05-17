# Deployment output capture script for Windows PowerShell
# Captures complete build and deploy output for debugging with secret redaction

# Set error action preference to continue capturing output
$ErrorActionPreference = "Continue"

# Create logs directory
New-Item -ItemType Directory -Force -Path deployment-logs | Out-Null

# Generate timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logfile = "deployment-logs\deploy-$timestamp.log"

# Function to redact sensitive information
function Redact-Secrets {
    param([string]$text)
    
    $text = $text -replace 'sk_live_[a-zA-Z0-9]{24,}', '[STRIPE_SECRET_KEY_REDACTED]'
    $text = $text -replace 'sk_test_[a-zA-Z0-9]{24,}', '[STRIPE_TEST_KEY_REDACTED]'
    $text = $text -replace 'Bearer [a-zA-Z0-9_-]{20,}', 'Bearer [TOKEN_REDACTED]'
    $text = $text -replace '"secretKey":"[^"]*"', '"secretKey":"[REDACTED]"'
    
    return $text
}

# Header
$header = @"
========================================
MikupBeats Deployment Log
Started: $(Get-Date)
========================================

"@

Write-Host $header
$header | Out-File -FilePath $logfile -Encoding UTF8

# Environment information
$dfxVersion = & dfx --version 2>&1 | Out-String
$nodeVersion = & node --version 2>&1 | Out-String
$npmVersion = & npm --version 2>&1 | Out-String
$pnpmVersion = try { & pnpm --version 2>&1 | Out-String } catch { "not installed" }
$workingDir = Get-Location

$envInfo = @"
Environment Information:
  dfx version: $dfxVersion
  node version: $nodeVersion
  npm version: $npmVersion
  pnpm version: $pnpmVersion
  Working directory: $workingDir

"@

Write-Host $envInfo
$envInfo | Out-File -FilePath $logfile -Append -Encoding UTF8

# Deployment start
$deployStart = @"
========================================
Starting deployment...
========================================

📋 Phase 1: Backend Canister Compilation (Motoko)

"@

Write-Host $deployStart
$deployStart | Out-File -FilePath $logfile -Append -Encoding UTF8

# Run deployment and capture all output (stdout and stderr)
$deployOutput = & dfx deploy 2>&1
$exitCode = $LASTEXITCODE

# Convert output to string
$outputString = $deployOutput | Out-String

# Redact sensitive information
$redactedOutput = Redact-Secrets -text $outputString

# Display redacted output to console
Write-Host $redactedOutput

# Write redacted output to log
$redactedOutput | Out-File -FilePath $logfile -Append -Encoding UTF8

if ($exitCode -eq 0) {
    $success = @"

========================================
✅ Deployment completed successfully!
Finished: $(Get-Date)
========================================

📁 Log saved to: $logfile
"@
    
    Write-Host $success
    $success | Out-File -FilePath $logfile -Append -Encoding UTF8
    
    exit 0
}
else {
    $failure = @"

========================================
❌ Deployment FAILED with exit code: $exitCode
Finished: $(Get-Date)
========================================

📁 Full log saved to: $logfile

🔍 Troubleshooting Hints:
  1. Phase 1 - Motoko Compilation: Check backend/main.mo for syntax errors
  2. Phase 2 - Canister Install/Upgrade: Verify canister state and upgrade compatibility
  3. Phase 3 - Frontend Build: Look for TypeScript/React/Vite build errors
  4. Phase 4 - Asset Upload: Check for network issues or asset size limits
  5. Network: Verify connectivity to IC network (local replica or mainnet)
  6. Review the complete log above for detailed error messages and stack traces

💡 Common Issues:
  • Motoko type errors → Check type definitions in backend/main.mo
  • Canister upgrade failures → May need to clear state or check stable memory
  • Frontend build errors → Run 'npm run typescript-check' to verify types
  • Asset upload timeouts → Check network connection and asset sizes
"@
    
    Write-Host $failure
    $failure | Out-File -FilePath $logfile -Append -Encoding UTF8
    
    exit $exitCode
}
