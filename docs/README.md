# ProsumeAI Documentation

Welcome to the ProsumeAI documentation! This directory contains all the guides, deployment instructions, and feature documentation organized by category.

## 📁 Documentation Structure

### 🚀 [Deployment](./deployment/)
Production and infrastructure setup guides:
- **[Production VPS Deployment Guide](./deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)** - Complete guide for deploying to VPS with data migration
- **[VPS Deployment Workflow](./deployment/VPS_DEPLOYMENT_WORKFLOW.md)** - Complete development to production pipeline
- **[Portainer Git Deployment](./deployment/PORTAINER_GIT_DEPLOYMENT.md)** - Deploy using Portainer with Git integration
- **[Image Architecture Guide](./deployment/IMAGE_ARCHITECTURE_GUIDE.md)** - 🆕 Dual image system for optimal persistence
- **[Docker Development Setup](./deployment/DOCKER_DEVELOPMENT_SETUP.md)** - Setting up development environment
- **[Docker Security Guide](./deployment/DOCKER_SECURITY_GUIDE.md)** - Security best practices for Docker deployment
- **[Docker Email Issue Fix](./deployment/DOCKER_EMAIL_ISSUE_FIXED.md)** - Email configuration fixes

### 🔧 [Development](./development/)
Development environment and workflow guides:
- **[Docker Hot Reload Setup](./development/DOCKER_DEVELOPMENT_HOT_RELOAD.md)** - Live reloading with Docker for development

### ✨ [Features](./features/)
Feature implementation and fixes:
- **[Blog Images Fix](./features/BLOG_IMAGES_FIX.md)** - How we fixed blog image persistence issue
- **[Skills Categorization Feature](./features/SKILLS_CATEGORIZATION_FEATURE.md)** - Skills feature implementation
- **[Skills Feature Summary](./features/SKILLS_FEATURE_IMPLEMENTATION_SUMMARY.md)** - Implementation summary

### 🔐 [Security](./security/)
Security implementation and audit guides:
- **[Security Implementation Guide](./security/SECURITY_IMPLEMENTATION_GUIDE.md)** - Comprehensive security setup
- **[Extended Security Audit](./security/EXTENDED_SECURITY_AUDIT.md)** - Security audit findings
- **[Security Keys Update Summary](./security/SECURITY_KEYS_UPDATE_SUMMARY.md)** - Security keys management

### 📊 [Analytics](./analytics/)
Analytics and revenue tracking:
- **[Revenue Analytics Implementation](./analytics/REVENUE_ANALYTICS_IMPLEMENTATION.md)** - Revenue tracking system

### 📖 [Guides](./guides/)
General usage and setup guides:
- **[Template System Guide](./guides/template-system-guide.md)** - How to work with templates
- **[PgAdmin Connection Guide](./guides/PGADMIN_CONNECTION_GUIDE.md)** - Database administration setup
- **[Notification System Plan](./guides/notification-system-plan.md)** - Notification system architecture

## 🛠️ [Scripts](../scripts/)
Utility scripts organized by purpose:
- **[Backup Scripts](../scripts/backup/)** - Database and full system backup scripts

## 📋 Quick Start Guides

### For Developers
1. [Development Environment Setup](./development/DOCKER_DEVELOPMENT_HOT_RELOAD.md)
2. [Template System Guide](./guides/template-system-guide.md)

### For DevOps/Deployment
1. [Image Architecture Guide](./deployment/IMAGE_ARCHITECTURE_GUIDE.md) - 🆕 **Start here for new deployments**
2. [Production Deployment Guide](./deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
3. [VPS Deployment Workflow](./deployment/VPS_DEPLOYMENT_WORKFLOW.md)
4. [Portainer Git Deployment](./deployment/PORTAINER_GIT_DEPLOYMENT.md)
5. [Security Implementation](./security/SECURITY_IMPLEMENTATION_GUIDE.md)
6. [Backup Scripts Setup](../scripts/backup/)

### For Feature Development
1. [Blog Images System](./features/BLOG_IMAGES_FIX.md)
2. [Skills Feature Implementation](./features/SKILLS_CATEGORIZATION_FEATURE.md)

## 🔍 Need Help?

- **🆕 Images not loading?** → [Image Architecture Guide](./deployment/IMAGE_ARCHITECTURE_GUIDE.md)
- **Issues with blog images?** → [Blog Images Fix](./features/BLOG_IMAGES_FIX.md)
- **Deployment problems?** → [Production Deployment Guide](./deployment/PRODUCTION_DEPLOYMENT_GUIDE.md)
- **Git-based deployment?** → [Portainer Git Deployment](./deployment/PORTAINER_GIT_DEPLOYMENT.md)
- **Development setup?** → [Docker Hot Reload Setup](./development/DOCKER_DEVELOPMENT_HOT_RELOAD.md)
- **Security concerns?** → [Security Implementation Guide](./security/SECURITY_IMPLEMENTATION_GUIDE.md)

## 🆕 Latest Updates

### **Image Architecture Revolution** 🖼️
ProsumeAI now features a revolutionary dual image architecture:
- **Static Images**: Automatically update with code deployments
- **Dynamic Images**: User uploads persist across all deployments
- **Zero Data Loss**: Perfect balance of automatic updates and data persistence

📖 **[Read the Image Architecture Guide](./deployment/IMAGE_ARCHITECTURE_GUIDE.md)**

## 📝 Contributing to Documentation

When adding new documentation:
1. Place files in the appropriate category folder
2. Update this README.md index
3. Use clear, descriptive filenames
4. Include emoji icons for better visual organization 
5. **For deployment docs**: Include image architecture considerations 