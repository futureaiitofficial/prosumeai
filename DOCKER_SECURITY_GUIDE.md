# 🔒 Docker Security Guide for ProsumeAI

## Overview
This guide covers the enhanced security setup for ProsumeAI's Docker deployment, including proper environment variable management and security best practices.

## 🚀 Quick Setup

### 1. Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env  # or your preferred editor
```

### 2. Security Checklist
Before deployment, ensure you've updated the following in your `.env` file:

- [ ] `POSTGRES_PASSWORD` - Strong database password
- [ ] `SECRET_KEY` - 32+ character secret key
- [ ] `JWT_SECRET` - 32+ character JWT secret
- [ ] `SESSION_SECRET` - 32+ character session secret  
- [ ] `COOKIE_SECRET` - 32+ character cookie secret
- [ ] `ADMIN_EMAIL` - Your admin email
- [ ] `ADMIN_PASSWORD` - Strong admin password
- [ ] `PGADMIN_DEFAULT_PASSWORD` - Strong PgAdmin password

### 3. Start Services
```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs app
```

## 🔐 Security Features

### Environment Variables
All sensitive configuration is now managed through environment variables:

#### Database Security
- Database credentials are not hardcoded
- Separate user/password for database access
- Connection pooling with proper timeouts

#### Authentication Security
- Strong session management with PostgreSQL storage
- Configurable cookie security settings
- JWT tokens with configurable expiration
- BCrypt password hashing with configurable rounds

#### API Key Management
- ✅ OpenAI API keys stored securely in database
- ✅ Razorpay credentials stored securely in database  
- ✅ SMTP settings stored securely in database
- No API keys exposed in configuration files

### Session Persistence
- Sessions are stored in PostgreSQL database
- Sessions persist across container restarts
- Automatic session cleanup for expired sessions
- Proper session security headers

## 🛡️ Production Deployment

### Environment Variables for Production
Update your `.env` file for production:

```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com
VITE_APP_URL=https://yourdomain.com
ORIGIN_URL=https://yourdomain.com
DISABLE_SECURE_COOKIE=false
```

### SSL/TLS Configuration
For production, you'll need to:

1. **Setup reverse proxy** (nginx/traefik) with SSL certificates
2. **Update cookie settings** for HTTPS
3. **Configure CORS** for your domain
4. **Use environment-specific secrets**

### Database Security
- Use strong, unique passwords
- Enable SSL for database connections
- Regular backups with encryption
- Network isolation between services

## 🔍 Security Verification

### Check Session Persistence
```bash
# Test session persistence
curl -c cookies.txt http://localhost:3000/api/session-test
docker compose restart app
curl -b cookies.txt http://localhost:3000/api/session-test
```

### Verify Environment Variables
```bash
# Check if variables are loaded correctly
docker compose exec app env | grep -E "SECRET|PASSWORD" | head -5
```

### Database Connection Test
```bash
# Run session verification script
docker compose exec app node server/verify-sessions.js
```

## ⚠️ Security Warnings

### Never Commit Secrets
- ❌ Never commit `.env` files to version control
- ❌ Never hardcode secrets in source code
- ❌ Never log sensitive information

### Rotate Secrets Regularly
- 🔄 Change database passwords quarterly
- 🔄 Rotate JWT secrets monthly
- 🔄 Update session secrets weekly in high-security environments

### Monitor Access
- 📊 Monitor failed login attempts
- 📊 Track admin access logs
- 📊 Audit API key usage

## 🛠️ Troubleshooting

### Environment Variable Issues
```bash
# Check if variables are loaded
docker compose config

# Verify environment in container
docker compose exec app printenv | grep DATABASE_URL
```

### Session Issues
```bash
# Check session table
docker compose exec db psql -U raja -d prosumeai -c "SELECT COUNT(*) FROM session;"

# Verify session store
docker compose exec app node server/verify-sessions.js
```

### Database Connection Issues
```bash
# Test database connection
docker compose exec db psql -U raja -d prosumeai -c "SELECT version();"

# Check database logs
docker compose logs db
```

## 📚 Additional Resources

- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

## 🆘 Emergency Procedures

### Reset Admin Access
```bash
# Connect to database
docker compose exec db psql -U raja -d prosumeai

# Reset admin password (in psql)
UPDATE users SET password = '$2b$12$newhashedpassword' WHERE email = 'admin@prosumeai.com';
```

### Clear All Sessions
```bash
# Emergency session clear
docker compose exec db psql -U raja -d prosumeai -c "DELETE FROM session;"
```

### Backup Security Data
```bash
# Backup configuration and keys
docker compose exec db pg_dump -U raja -d prosumeai -t api_keys -t app_settings > security_backup.sql
```

---

**⚡ Remember**: Security is an ongoing process. Regularly review and update your security configuration! 