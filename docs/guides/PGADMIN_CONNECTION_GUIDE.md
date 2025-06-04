# pgAdmin Connection Guide

## 🚨 Important: Use Correct Host Name

When connecting to the PostgreSQL database from pgAdmin running in Docker, **DO NOT use `localhost`**. Use `db` instead.

## ✅ Correct Connection Settings

In the pgAdmin "Register - Server" dialog, use these **exact** settings:

### General Tab
- **Name**: `ProsumeAI Database` (or any name you prefer)

### Connection Tab
| Field | Value | ❌ Common Mistake |
|-------|--------|------------------|
| **Host name/address** | `db` | ❌ `localhost` or `127.0.0.1` |
| **Port** | `5432` | ✅ Correct |
| **Maintenance database** | `prosumeai` | ✅ Correct |
| **Username** | `raja` | ✅ Correct |
| **Password** | `raja` | ✅ Correct |

### Other Settings
- **Save password?**: ✅ Enable for convenience
- **Kerberos authentication?**: ❌ Disable

## 🔍 Why `localhost` Doesn't Work

- pgAdmin runs **inside** a Docker container
- From inside the container, `localhost` refers to the container itself, not your host machine
- The database is in a **different** container named `db`
- Docker networks allow containers to communicate using service names

## 🌐 Network Architecture

```
┌─────────────────────┐    ┌─────────────────────┐
│   pgAdmin Container │    │  Database Container │
│   (localhost:5051)  │◄──►│        (db:5432)    │
│                     │    │                     │
│   Use hostname: db  │    │   Service name: db  │
└─────────────────────┘    └─────────────────────┘
```

## 📝 Step-by-Step Connection Process

1. **Open pgAdmin**: http://localhost:5051
2. **Login**:
   - Email: `admin@atscribe.com`
   - Password: `admin123`
3. **Add Server**:
   - Right-click "Servers" → "Register" → "Server"
4. **Fill Connection Details**:
   - Use `db` as host (NOT `localhost`)
   - Use other settings from table above
5. **Click "Save"**

## 🎯 Alternative: Direct Database Access

If you prefer using a local database client instead of pgAdmin:

```bash
# From your host machine terminal
psql -h localhost -p 5432 -U raja -d prosumeai
```

This works because:
- Your host machine can access Docker's exposed port `5432`
- From the host, `localhost:5432` correctly points to the exposed database port

## 🔧 Troubleshooting

### Connection Refused Error
**Error**: `connection to server at "127.0.0.1", port 5432 failed: Connection refused`

**Solution**: Change hostname from `localhost`/`127.0.0.1` to `db`

### Permission Denied Error
**Error**: `FATAL: password authentication failed for user "raja"`

**Solutions**:
1. Verify username is exactly `raja` (lowercase)
2. Verify password is exactly `raja`
3. Check if database container is healthy: `docker compose ps`

### Database Does Not Exist Error
**Error**: `FATAL: database "prosumeai" does not exist`

**Solutions**:
1. Check database name is exactly `prosumeai` (lowercase)
2. Restart database: `docker compose restart db`
3. Check database logs: `docker compose logs db`

### Container Not Found Error
**Error**: Could not resolve hostname `db`

**Solutions**:
1. Ensure both pgAdmin and database are in same Docker network
2. Restart all services: `docker compose down && docker compose up -d`
3. Check network: `docker network ls`

## ✅ Verification Commands

```bash
# Check all containers are running
docker compose ps

# Test database connection from host
psql -h localhost -p 5432 -U raja -d prosumeai -c "SELECT version();"

# Test database connection from within Docker network
docker compose exec db psql -U raja -d prosumeai -c "SELECT version();"

# Check pgAdmin logs
docker compose logs pgadmin --tail=10
```

## 📊 Quick Reference

| Access Method | Host | Port | Notes |
|---------------|------|------|-------|
| pgAdmin (Docker) | `db` | `5432` | ✅ Use this for pgAdmin |
| Host Machine Client | `localhost` | `5432` | ✅ For psql, DBeaver, etc. |
| Application (Docker) | `db` | `5432` | ✅ Used in DATABASE_URL |

---

**Remember**: When in doubt, use `db` as the hostname for any Docker-to-Docker connections! 