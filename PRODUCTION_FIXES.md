# 🚨 CRITICAL PRODUCTION FIXES REQUIRED

## Issues Found in Production Logs

### 1. OpenAI API Key Error (401 Unauthorized)
**Error**: `Incorrect API key provided: sk-proj-***...nKgA`
**Cause**: Environment variable contains placeholder value `your_openai_api_key_here`

### 2. Database Integer Constraint Error  
**Error**: `invalid input syntax for type integer: "640.5"`
**Cause**: Token calculation generates decimals but database expects integers

## IMMEDIATE FIXES REQUIRED

### Fix #1: Update OpenAI API Key
```bash
# On your SSH server, update the environment variable:
# Edit the .env file in your server directory
nano server/.env

# Replace this line:
OPENAI_API_KEY=your_openai_api_key_here

# With your actual OpenAI API key:
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE
```

### Fix #2: Database Schema Fix (Already Applied)
The decimal token calculation has been fixed in the code to round to integers:
```typescript
// Before: const estimatedTokens = Math.min(extractedText.length / 4, 10000);
// After: const estimatedTokens = Math.round(Math.min(extractedText.length / 4, 10000));
```

## DEPLOYMENT STEPS

### Step 1: Get OpenAI API Key
1. Go to https://platform.openai.com/account/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-proj-...`)

### Step 2: Update Production Environment
```bash
# SSH into your production server
ssh your-server

# Navigate to project directory
cd /path/to/ProsumeAI

# Pull latest code changes
git pull origin main

# Update environment variable
nano server/.env
# Replace: OPENAI_API_KEY=your_openai_api_key_here
# With: OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE

# Rebuild and restart containers
docker-compose down
docker-compose up --build -d
```

### Step 3: Verify Fixes
```bash
# Check logs for errors
docker-compose logs -f app

# Test an AI feature through the web interface
# - Try the keyword generator
# - Upload a resume for parsing
# - Check that no 401 or database errors appear
```

## ALTERNATIVE: Database API Key Management

If you prefer to manage API keys through the admin panel instead of environment variables:

1. **Login as admin** to your website
2. **Go to Admin Panel** → API Keys section  
3. **Add OpenAI API Key**:
   - Service: `openai`
   - Key Name: `production-key`
   - API Key: `sk-proj-YOUR_ACTUAL_KEY_HERE`
   - Active: ✅ Yes

This allows dynamic key management without server restarts.

## MONITORING

After applying fixes, monitor logs for:
- ✅ **No more 401 OpenAI errors**
- ✅ **No more decimal database errors** 
- ✅ **AI features working properly**

## SECURITY NOTE

🔒 **Keep your OpenAI API key secure:**
- Never commit it to git repositories
- Use environment variables or database storage
- Monitor usage on OpenAI dashboard
- Set usage limits to prevent overcharging

## Files Modified in This Fix

- `server/src/routes/ai.ts` - Fixed decimal token calculation
- `PRODUCTION_FIXES.md` - This documentation

## Contact

If you encounter issues after applying these fixes, check:
1. OpenAI account has sufficient credits
2. API key permissions are correct  
3. Database connection is stable
4. Docker containers have restarted successfully 