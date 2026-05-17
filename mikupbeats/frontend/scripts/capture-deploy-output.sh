#!/bin/bash

# Deployment output capture script for Unix/macOS/Linux
# Captures complete build and deploy output for debugging with secret redaction

# Enable pipefail to catch errors in piped commands
set -o pipefail

# Create logs directory
mkdir -p deployment-logs

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOGFILE="deployment-logs/deploy-${TIMESTAMP}.log"

echo "========================================"
echo "MikupBeats Deployment Log"
echo "Started: $(date)"
echo "========================================"
echo ""

echo "Environment Information:"
echo "  dfx version: $(dfx --version 2>&1)"
echo "  node version: $(node --version 2>&1)"
echo "  npm version: $(npm --version 2>&1)"
echo "  pnpm version: $(pnpm --version 2>&1 || echo 'not installed')"
echo "  Working directory: $(pwd)"
echo ""

echo "========================================"
echo "Starting deployment..."
echo "========================================"
echo ""

# Function to redact sensitive information
redact_secrets() {
    sed -E \
        -e 's/sk_live_[a-zA-Z0-9]{24,}/[STRIPE_SECRET_KEY_REDACTED]/g' \
        -e 's/sk_test_[a-zA-Z0-9]{24,}/[STRIPE_TEST_KEY_REDACTED]/g' \
        -e 's/Bearer [a-zA-Z0-9_-]{20,}/Bearer [TOKEN_REDACTED]/g' \
        -e 's/"secretKey":"[^"]*"/"secretKey":"[REDACTED]"/g'
}

# Write header to log file
{
    echo "========================================"
    echo "MikupBeats Deployment Log"
    echo "Started: $(date)"
    echo "========================================"
    echo ""
    echo "Environment Information:"
    echo "  dfx version: $(dfx --version 2>&1)"
    echo "  node version: $(node --version 2>&1)"
    echo "  npm version: $(npm --version 2>&1)"
    echo "  pnpm version: $(pnpm --version 2>&1 || echo 'not installed')"
    echo "  Working directory: $(pwd)"
    echo ""
    echo "========================================"
    echo "Starting deployment..."
    echo "========================================"
    echo ""
} > "$LOGFILE"

# Run deployment and capture all output (stdout and stderr)
# Using a temporary file to ensure we capture everything
TEMP_OUTPUT=$(mktemp)

echo "📋 Phase 1: Backend Canister Compilation (Motoko)"
echo "📋 Phase 1: Backend Canister Compilation (Motoko)" >> "$LOGFILE"
echo ""
echo "" >> "$LOGFILE"

if dfx deploy 2>&1 | tee "$TEMP_OUTPUT"; then
    # Redact sensitive information and display to console
    cat "$TEMP_OUTPUT" | redact_secrets
    
    # Append redacted output to log file
    cat "$TEMP_OUTPUT" | redact_secrets >> "$LOGFILE"
    rm -f "$TEMP_OUTPUT"
    
    echo ""
    echo "========================================"
    echo "✅ Deployment completed successfully!"
    echo "Finished: $(date)"
    echo "========================================"
    echo ""
    echo "📁 Log saved to: $LOGFILE"
    
    {
        echo ""
        echo "========================================"
        echo "✅ Deployment completed successfully!"
        echo "Finished: $(date)"
        echo "========================================"
        echo ""
        echo "📁 Log saved to: $LOGFILE"
    } >> "$LOGFILE"
    
    exit 0
else
    EXIT_CODE=$?
    
    # Redact sensitive information and display to console
    cat "$TEMP_OUTPUT" | redact_secrets
    
    # Append redacted output to log file even on failure
    cat "$TEMP_OUTPUT" | redact_secrets >> "$LOGFILE"
    rm -f "$TEMP_OUTPUT"
    
    echo ""
    echo "========================================"
    echo "❌ Deployment FAILED with exit code: $EXIT_CODE"
    echo "Finished: $(date)"
    echo "========================================"
    echo ""
    echo "📁 Full log saved to: $LOGFILE"
    echo ""
    echo "🔍 Troubleshooting Hints:"
    echo "  1. Phase 1 - Motoko Compilation: Check backend/main.mo for syntax errors"
    echo "  2. Phase 2 - Canister Install/Upgrade: Verify canister state and upgrade compatibility"
    echo "  3. Phase 3 - Frontend Build: Look for TypeScript/React/Vite build errors"
    echo "  4. Phase 4 - Asset Upload: Check for network issues or asset size limits"
    echo "  5. Network: Verify connectivity to IC network (local replica or mainnet)"
    echo "  6. Review the complete log above for detailed error messages and stack traces"
    echo ""
    echo "💡 Common Issues:"
    echo "  • Motoko type errors → Check type definitions in backend/main.mo"
    echo "  • Canister upgrade failures → May need to clear state or check stable memory"
    echo "  • Frontend build errors → Run 'npm run typescript-check' to verify types"
    echo "  • Asset upload timeouts → Check network connection and asset sizes"
    
    {
        echo ""
        echo "========================================"
        echo "❌ Deployment FAILED with exit code: $EXIT_CODE"
        echo "Finished: $(date)"
        echo "========================================"
        echo ""
        echo "📁 Full log saved to: $LOGFILE"
        echo ""
        echo "🔍 Troubleshooting Hints:"
        echo "  1. Phase 1 - Motoko Compilation: Check backend/main.mo for syntax errors"
        echo "  2. Phase 2 - Canister Install/Upgrade: Verify canister state and upgrade compatibility"
        echo "  3. Phase 3 - Frontend Build: Look for TypeScript/React/Vite build errors"
        echo "  4. Phase 4 - Asset Upload: Check for network issues or asset size limits"
        echo "  5. Network: Verify connectivity to IC network (local replica or mainnet)"
        echo "  6. Review the complete log above for detailed error messages and stack traces"
        echo ""
        echo "💡 Common Issues:"
        echo "  • Motoko type errors → Check type definitions in backend/main.mo"
        echo "  • Canister upgrade failures → May need to clear state or check stable memory"
        echo "  • Frontend build errors → Run 'npm run typescript-check' to verify types"
        echo "  • Asset upload timeouts → Check network connection and asset sizes"
    } >> "$LOGFILE"
    
    exit $EXIT_CODE
fi
