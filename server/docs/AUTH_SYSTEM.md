# Authentication System Documentation

## Overview

The ProsumeAI authentication system is designed to provide secure, configurable user authentication with the following features:

- Password hashing with scrypt and salt
- Configurable password policies
- Password expiration
- Account lockout on failed attempts
- Password history to prevent reuse
- Password reset functionality

## Key Components

1. **Password Hashing**: Uses scrypt with a unique salt for each password
2. **Authentication Flow**: Passport.js LocalStrategy
3. **Session Management**: Express sessions with configurable settings
4. **Admin Controls**: Security dashboard for adjusting all settings

## Password Storage Format

Passwords are stored in the format: `hash.salt` where:
- `hash` is a 64-byte (128 hex character) hash generated with scrypt
- `salt` is a 16-byte (32 hex character) random salt unique to each password

## Database Schema

User authentication fields:
- `password`: The hashed password with salt
- `lastPasswordChange`: When password was last changed
- `failedLoginAttempts`: Counter for failed login attempts
- `lockoutUntil`: Timestamp until which the account is locked
- `passwordHistory`: Array of previous password hashes and change dates
- `resetPasswordToken`: Token for password reset
- `resetPasswordExpiry`: Expiry date for reset token

## Configuration

All security settings can be configured through the admin dashboard at `/admin/security`:

### Password Policy
- Minimum length
- Character requirements (uppercase, lowercase, numbers, special chars)
- Password expiry days
- Password history (prevent reuse)
- Failed login attempt limits
- Account lockout duration

### Session Security
- Session timeout settings
- Cookie security options
- Single session enforcement

## Migration Scripts

The system includes migration scripts to ensure password data consistency:

1. **standardize-password-formats.ts**: Ensures all passwords use the correct hashing format
   - Run with: `npx tsx server/migrations/standardize-password-formats.ts`
   - Resets invalid password formats to a secure default password
   - Forces password reset for affected users

## Recommended Security Practices

1. **Regular Key Rotation**: Use the admin dashboard to rotate encryption keys periodically
2. **Password Expiry**: Set an appropriate expiry policy (60-90 days recommended)
3. **Account Lockout**: Configure reasonable lockout settings (5 attempts, 30 min lockout)
4. **Session Timeouts**: Set both absolute and inactivity timeouts

## Troubleshooting

Common issues:

1. **Password Format Issues**: Run the standardization migration script
2. **Account Lockouts**: Admin can manually reset user's `failedLoginAttempts` and `lockoutUntil` fields
3. **Expired Passwords**: Users will be directed to reset their password

## Emergency Recovery

In case of emergency, admins can:
1. Run `npx tsx server/migrations/reset-user-auth-fields.ts` to reset all failed login attempts
2. Run `npx tsx server/migrations/standardize-password-formats.ts` to reset problematic passwords 