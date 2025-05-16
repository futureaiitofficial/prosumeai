# Security Implementation Guide

This document explains the security features implemented in the ProsumeAI application, focusing on password policies and data encryption.

## Password Policy

The password policy system enforces strong password requirements and account security measures defined in the admin security panel.

### Password Policy Configuration

Password policies are stored in the database in the `app_settings` table with key `password_policy`. The configuration includes:

- **Minimum Length**: The minimum number of characters required in a password
- **Character Requirements**: Requirements for uppercase, lowercase, numbers, and special characters
- **Password Expiry**: Number of days after which passwords expire and must be changed (0 = never)
- **Password History**: Number of previous passwords remembered to prevent reuse 
- **Account Lockout**: Maximum number of failed login attempts before temporary lockout
- **Lockout Duration**: How long an account remains locked after too many failed attempts

### Implementation Details

1. **Registration**: When users register, their passwords are validated against the policy before account creation.

2. **Password Hashing**: Passwords are never stored in plain text. They are hashed using `scrypt` with individual salts for each password.

3. **Login Protection**:
   - Failed login attempts are tracked
   - Accounts are automatically locked after exceeding the maximum failed attempts
   - Successful logins reset the failed attempts counter

4. **Password Expiry**:
   - The system tracks when passwords were last changed
   - When a password expires, users can still log in but are prompted to change their password
   - The UI displays a banner notification when password change is required

5. **Password History**:
   - Previously used passwords are stored in hashed form
   - When changing password, the system prevents reuse of recent passwords
   - Only the configured number of previous passwords are retained

## Data Encryption

The application uses strong encryption to protect sensitive user data both at rest and in transit.

### Encryption Configuration

Encryption settings are stored in the database in the `app_settings` table:

- **Key**: `encryption_key` contains the AES-256 encryption key and initialization vector
- **Config**: `data_encryption_config` defines which models and fields should be encrypted
- **Status**: `encryption_enabled` determines whether encryption is active globally

### Implementation Details

1. **Encryption Algorithm**: AES-256-GCM with unique initialization vectors per field

2. **Field-Level Encryption**:
   - Specific fields in models can be configured for encryption (e.g., email, phone, address)
   - The system automatically encrypts/decrypts these fields when reading/writing data
   - Encrypted data is marked with a special format to distinguish it from unencrypted data

3. **Key Management**:
   - Encryption keys are stored securely in the database
   - Keys can be rotated periodically for increased security
   - During key rotation, all encrypted data is re-encrypted with the new key

4. **Middleware Implementation**:
   - Encryption/decryption is handled by middleware that processes requests and responses
   - Client-side code never sees encrypted data - all encryption/decryption happens on the server

5. **Transparent Operation**:
   - Application code doesn't need to handle encryption details
   - Encryption can be enabled/disabled without code changes
   - API routes work the same way whether encryption is enabled or not

## How Password Policy and Encryption Work Together

1. The admin security page allows configuration of both systems
2. Password policy protects account access
3. Data encryption protects sensitive information once access is granted
4. Both systems are implemented with minimal impact on application performance
5. Both systems follow security best practices and industry standards

## Technical Implementation

### Password Policy Components

- `server/utils/password-policy.ts`: Core password policy implementation
- `server/config/auth.ts`: Integration with authentication system
- `client/src/components/auth/*`: UI components for authentication with policy integration

### Data Encryption Components

- `server/utils/encryption.ts`: Core encryption/decryption functions
- `server/middleware/data-encryption.ts`: Request/response encryption middleware
- `server/src/routes/admin/security-routes.ts`: Admin API for configuring encryption

## Maintenance and Updates

1. **Password Policy Updates**:
   - Changes to password policy take effect immediately for new passwords
   - Existing passwords are evaluated against new policy on next login or when expired

2. **Encryption Updates**:
   - Enabling encryption for new fields automatically encrypts existing data
   - Disabling encryption leaves data encrypted until explicitly decrypted
   - Key rotation can be scheduled during low-traffic periods

## Security Best Practices

1. Regularly rotate encryption keys
2. Periodically review and update password policies
3. Monitor failed login attempts for potential attacks
4. Keep npm dependencies updated to patch security vulnerabilities 
5. Perform regular security audits of the application 