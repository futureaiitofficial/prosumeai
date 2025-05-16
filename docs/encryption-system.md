# Data Encryption System Documentation

## Overview

The encryption system is designed to protect sensitive user data by encrypting it at rest in the database. This helps protect against data breaches and unauthorized access to user information.

## Features

- Strong AES-256-GCM encryption for all sensitive data
- Configurable encryption settings per data model
- Admin controls to enable/disable encryption and configure which fields are encrypted
- Key rotation capability for enhanced security
- Zero-knowledge architecture where encryption keys are stored securely

## Architecture

The encryption system consists of the following components:

1. **Encryption Utilities** (`server/utils/encryption.ts`):
   - Core encryption and decryption functions
   - Encryption key management
   - Utility functions to check if data is already encrypted

2. **Data Encryption Middleware** (`server/middleware/data-encryption.ts`):
   - Configuration for which data fields should be encrypted
   - Express middleware to automatically encrypt request data and decrypt response data
   - Admin functions to manage encryption settings

3. **Admin API** (`server/src/routes/admin/security-routes.ts`):
   - API endpoints for managing encryption settings
   - Endpoints for key rotation and other security settings

4. **Migration Scripts** (`server/migrations/add-encryption-settings.ts`):
   - Sets up initial encryption settings in the database

## How It Works

### Encryption Algorithm

The system uses AES-256-GCM (Galois/Counter Mode), which provides both confidentiality and data integrity. Key features:

- 256-bit encryption key for maximum security
- Unique Initialization Vector (IV) for each encrypted piece of data
- Authentication tag to verify data integrity
- Salted IVs to prevent pattern analysis

### Data Flow

1. When the server starts, it initializes the encryption system:
   - Loads encryption keys from database or generates new ones
   - Loads encryption configuration (which fields to encrypt)

2. When data is sent to the API:
   - The encryption middleware intercepts the request
   - Sensitive fields are encrypted before storing in the database
   - The encrypted data is stored in the database

3. When data is retrieved from the API:
   - The encryption middleware intercepts the response
   - Encrypted fields are decrypted before sending to the client
   - The client receives the decrypted data

### Security Considerations

- Encryption keys are stored in the database with restricted access
- Each piece of data has a unique IV to prevent pattern analysis
- Authentication tags ensure data integrity and prevent tampering
- Key rotation capability to periodically update encryption keys

## Admin Dashboard

Administrators can manage encryption settings through the admin dashboard:

1. **Enable/Disable Encryption**: Toggle encryption globally
2. **Configure Encrypted Fields**: Select which fields in each model should be encrypted
3. **Rotate Encryption Keys**: Generate new encryption keys and re-encrypt all data
4. **View Encryption Status**: See which models have encryption enabled

## API Endpoints

### Get Encryption Configuration
```
GET /api/admin/security/encryption
```

### Update Encryption Configuration
```
PUT /api/admin/security/encryption/config
```

### Enable/Disable Encryption
```
POST /api/admin/security/encryption/toggle
```

### Rotate Encryption Keys
```
POST /api/admin/security/encryption/rotate-keys
```

## Migration and Setup

To set up the encryption system:

1. The migration script creates necessary database settings
2. The server initializes encryption on startup
3. An administrator can enable encryption via the admin dashboard
4. The system is ready to encrypt and decrypt sensitive data

## Best Practices

1. **Enable encryption in production**: Always enable encryption in production environments
2. **Rotate keys periodically**: Schedule regular key rotations (e.g., quarterly)
3. **Regular backups**: Ensure database backups include encryption keys
4. **Limit admin access**: Only trusted administrators should have access to encryption settings
5. **Monitor access**: Audit who accesses encrypted data and when

## Technical References

- [AES-256-GCM](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf) - NIST specification
- [Node.js Crypto](https://nodejs.org/api/crypto.html) - Encryption implementation details 