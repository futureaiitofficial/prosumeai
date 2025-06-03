#!/bin/bash

echo "🔒 Installing Security Dependencies for Resume Builder"
echo "=================================================="

# Navigate to project root
cd "$(dirname "$0")"

echo "📦 Installing main security packages..."
npm install --save \
  isomorphic-dompurify \
  validator \
  express-rate-limit \
  helmet \
  express-validator

echo "📦 Installing TypeScript definitions..."
npm install --save-dev \
  @types/validator \
  @types/express-rate-limit

echo "✅ Security dependencies installed successfully!"
echo ""
echo "📋 Installed packages:"
echo "  - isomorphic-dompurify: XSS protection and HTML sanitization"
echo "  - validator: Email, URL, and data format validation"
echo "  - express-rate-limit: Rate limiting for API endpoints"
echo "  - helmet: Security headers middleware"
echo "  - express-validator: Input validation middleware"
echo ""
echo "🔧 Next steps:"
echo "  1. Replace resume-routes.ts with resume-routes-enhanced.ts"
echo "  2. Run the comprehensive security tests"
echo "  3. Update your main server.js to use the enhanced routes"
echo ""
echo "🚀 Security implementation ready!" 