# Two-Factor Authentication (2FA) System

## Overview

The Two-Factor Authentication (2FA) system adds an additional layer of security to ProsumeAI accounts by requiring users to verify their identity using two different authentication factors:

1. Something they know (username and password)
2. Something they have (email access or authenticator app)

This document details the implementation, architecture, and usage of the 2FA system.

## Features

### Authentication Methods

- **Email Verification**
  - Sends a 6-digit code to the user's registered email address
  - Codes expire after 10 minutes
  - Email templates are customizable

- **Authenticator App**
  - Compatible with standard TOTP authenticator apps (Google Authenticator, Authy, Microsoft Authenticator, etc.)
  - QR code for easy setup
  - Time-based tokens with 30-second validity

- **Backup Codes**
  - 10 single-use recovery codes are generated when authenticator app is set up
  - Allows account access if other methods are unavailable
  - Can be regenerated if needed

### User Experience

- **Device Recognition**
  - "Remember this device" option for 2FA verification
  - Configurable duration (default 30 days)
  - Helps reduce verification frequency on trusted devices

- **Setup Flows**
  - Step-by-step guided setup process
  - Email verification is immediate
  - Authenticator app requires verification with a valid code

### Administrative Controls

- **2FA Policy**
  - Organization-wide settings for 2FA enforcement
  - Can require 2FA for all users or admins only
  - Configurable allowed authentication methods

- **User Management**
  - Administrators can view 2FA status for all users
  - Statistics on 2FA adoption and method preferences
  - Ability to reset 2FA for users who lose access

## Architecture

### Database Schema

The 2FA system uses the following tables:

#### `user_two_factor`

Stores the user's 2FA preferences and status.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users table |
| enabled | BOOLEAN | Whether 2FA is enabled |
| preferred_method | ENUM | 'EMAIL' or 'AUTHENTICATOR_APP' |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

#### `two_factor_email`

Stores email-based 2FA settings.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users table |
| email | TEXT | Email for verification codes |
| token | TEXT | Current verification token |
| token_expires_at | TIMESTAMP | Token expiry time |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

#### `two_factor_authenticator`

Stores authenticator app settings.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users table |
| secret | TEXT | TOTP secret key |
| recovery_codes | JSONB | Array of recovery codes |
| verified | BOOLEAN | Whether setup is verified |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

#### `two_factor_backup_codes`

Stores backup recovery codes.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users table |
| code | TEXT | Backup code |
| used | BOOLEAN | Whether code has been used |
| created_at | TIMESTAMP | Record creation time |

#### `two_factor_policy`

Stores organization-wide 2FA policy settings.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| enforce_for_admins | BOOLEAN | Whether to require 2FA for admins |
| enforce_for_all_users | BOOLEAN | Whether to require 2FA for all users |
| allowed_methods | JSONB | Array of allowed methods |
| remember_device_days | INTEGER | Days to remember devices |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record update time |

#### `two_factor_remembered_devices`

Manages device recognition for users.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users table |
| device_identifier | TEXT | Unique device ID |
| token | TEXT | Recognition token |
| expires_at | TIMESTAMP | Token expiry time |
| created_at | TIMESTAMP | Record creation time |

### Server-Side Components

#### TwoFactorService

The core service handling all 2FA operations:

- User 2FA setup and verification
- Email code generation and validation
- Authenticator app setup and validation
- Backup code management
- Device recognition token management
- Policy enforcement checks

#### Email Integration

Email-based 2FA relies on the system's EmailService to send verification codes using customizable email templates.

#### API Routes

- **User Routes**
  - 2FA status and configuration retrieval
  - Email 2FA setup and verification
  - Authenticator app setup and verification
  - Backup code generation and verification
  - Device recognition management

- **Admin Routes**
  - Policy management
  - User 2FA status monitoring
  - Statistics on 2FA usage
  - User 2FA reset functionality

### Client-Side Components

#### TwoFactorVerification Component

Handles the verification process during login:

- Supports email, authenticator, and backup code verification
- Provides "remember this device" option
- Handles resending email codes

#### Admin Settings

The admin dashboard includes a dedicated section for 2FA management:

- Policy configuration
- User monitoring
- Statistics on 2FA adoption

## Implementation Details

### Verification Flow

1. User logs in with username and password
2. System checks if 2FA is enabled for the user
3. If enabled, redirects to 2FA verification screen
4. User selects verification method and provides code
5. System validates the code:
   - For email: Checks against stored token
   - For authenticator: Validates using TOTP algorithm
   - For backup codes: Checks against stored unused codes
6. On successful verification:
   - If "remember this device" is selected, generates and stores a device token
   - Completes the login process

### Security Considerations

- Email verification codes expire after 10 minutes
- TOTP tokens have 30-second validity with a small window for time drift
- Backup codes are one-time use only
- Device recognition tokens have a configurable expiration period
- Policy enforcement ensures critical accounts have 2FA protection

## API Endpoints

### User Endpoints

- `GET /api/two-factor/status`: Get current 2FA configuration
- `POST /api/two-factor/email/setup`: Set up email-based 2FA
- `POST /api/two-factor/email/send-code`: Generate and send a verification code
- `POST /api/two-factor/email/verify`: Verify an email code
- `POST /api/two-factor/authenticator/setup`: Set up authenticator app
- `POST /api/two-factor/authenticator/verify`: Verify and complete authenticator setup
- `GET /api/two-factor/backup-codes`: Get backup codes
- `POST /api/two-factor/disable`: Disable 2FA
- `POST /api/two-factor/verify`: Verify during login

### Admin Endpoints

- `GET /api/admin/2fa/policy`: Get the organization 2FA policy
- `POST /api/admin/2fa/policy`: Update the 2FA policy
- `GET /api/admin/2fa/stats`: Get 2FA usage statistics
- `GET /api/admin/2fa/users`: List users with 2FA status
- `GET /api/admin/2fa/users/:userId`: Get a user's 2FA details
- `POST /api/admin/2fa/users/:userId/reset`: Reset a user's 2FA settings

## Dependencies

- `speakeasy`: TOTP algorithm implementation for authenticator apps
- `qrcode`: QR code generation for authenticator app setup
- Email service for sending verification codes
- Cookie management for device recognition

## Migration and Setup

The 2FA database structure is created by running:

```
npm run db:migrate:2fa
npm run db:migrate:2fa-email
```

The first command creates the database tables, and the second adds the email template for verification codes.

## Best Practices

1. **Security**: Ensure email templates don't include the full verification code in the subject line
2. **User Support**: Have a process for users who lose access to their 2FA methods
3. **Monitoring**: Regularly review 2FA adoption rates and encourage usage
4. **Testing**: Verify all 2FA paths, especially recovery options
5. **Communication**: Clearly explain 2FA benefits and options to users

## Troubleshooting

Common issues and solutions:

- **User can't receive verification emails**: Check spam folders and email delivery logs
- **Authenticator app codes not working**: Verify server time synchronization
- **Lost access to 2FA methods**: Use admin reset feature after identity verification
- **Device not being remembered**: Check cookie settings and expiration policy 