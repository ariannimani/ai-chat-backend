# Database Migration Guide

## 🎯 Overview

This project now uses **TypeORM migrations** for database schema management instead of manual SQL scripts. This is a more professional and standard approach.

## 🔄 How It Works

### **Development Environment:**

- ✅ `synchronize: true` - TypeORM automatically creates/updates tables from your entities
- ✅ **Fast iteration** - Just modify entities and restart the app
- ✅ **No migration needed** for development

### **Production Environment:**

- ✅ `synchronize: false` - No automatic schema changes
- ✅ `migrationsRun: true` - Automatically runs pending migrations on startup
- ✅ **Controlled schema changes** via migration files

## 📁 File Structure

```
src/
  migrations/
    1753618607832-InitialSchema.ts    # Initial database schema
  entities/
    user.entity.ts                    # TypeORM entity definitions
    room.entity.ts
    chat.entity.ts
typeorm.config.ts                     # TypeORM CLI configuration
```

## 🚀 Quick Commands

### **Essential Commands:**

```bash
# Run pending migrations (production)
npm run db:migrate

# Rollback last migration
npm run db:rollback

# Generate new migration from entity changes
npm run typeorm:generate-migration -- src/migrations/AddNewFeature

# Create empty migration
npm run typeorm:create-migration -- src/migrations/CustomChanges
```

## 🏗️ Development Workflow

### **1. For New Features (Development):**

```bash
# 1. Modify your entity files
# 2. Restart your app
# 3. Tables are automatically updated!
npm run start:dev
```

### **2. For Production Deployment:**

```bash
# 1. Generate migration from your changes
npm run typeorm:generate-migration -- src/migrations/AddUserProfile

# 2. Review the generated migration file
# 3. Deploy your app (migrations run automatically)
npm run start:prod
```

## 🔧 Configuration

### **Environment Variables:**

```env
# Development
NODE_ENV=development              # Enables auto-sync

# Production
NODE_ENV=production              # Enables migrations, disables auto-sync

# Database (same for both)
SUPABASE_DB_HOST=your-supabase-host.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-password
SUPABASE_DB_NAME=postgres
```

## 📋 Migration Best Practices

### **✅ DO:**

- Generate migrations for all schema changes before production
- Test migrations on a copy of production data
- Keep migration files in version control
- Review generated migrations before committing

### **❌ DON'T:**

- Edit migration files after they've been run in production
- Delete migration files
- Mix manual SQL changes with TypeORM migrations

## 🔄 Migration from Manual SQL Setup

If you previously used the manual `supabase_migration.sql`:

### **Option 1: Fresh Database (Recommended)**

1. Drop all tables in Supabase
2. Run: `npm run db:migrate`
3. ✅ Clean TypeORM-managed schema

### **Option 2: Keep Existing Data**

1. Your current setup will work as-is
2. Future changes use TypeORM migrations
3. Mark initial migration as already run:

   ```bash
   # In Supabase SQL Editor, create migrations table:
   CREATE TABLE "migrations" (
       "id" SERIAL PRIMARY KEY,
       "timestamp" bigint NOT NULL,
       "name" varchar NOT NULL
   );

   # Mark initial migration as complete:
   INSERT INTO "migrations" ("timestamp", "name")
   VALUES (1753618607832, 'InitialSchema1753618607832');
   ```

## 🎯 Advantages of This Approach

### **✅ Benefits:**

- **Version Control** - All schema changes tracked in Git
- **Team Collaboration** - No conflicts with manual SQL
- **Rollback Support** - Easy to undo changes
- **Automated Deployment** - Migrations run automatically
- **Type Safety** - Entities and database stay in sync
- **Industry Standard** - Professional development practice

### **vs Manual SQL:**

| Feature                | TypeORM Migrations | Manual SQL     |
| ---------------------- | ------------------ | -------------- |
| **Version Control**    | ✅ Automatic       | ❌ Manual      |
| **Team Collaboration** | ✅ Easy            | ❌ Conflicts   |
| **Rollback**           | ✅ Built-in        | ❌ Manual      |
| **Type Safety**        | ✅ Guaranteed      | ❌ Can drift   |
| **Production Safety**  | ✅ Tested          | ❌ Error-prone |

## 🚨 Troubleshooting

### **Migration Fails:**

```bash
# Check migration status
npm run typeorm -- migration:show

# Rollback and fix
npm run db:rollback
```

### **Schema Drift:**

```bash
# Generate migration to fix differences
npm run typeorm:generate-migration -- src/migrations/FixSchemaDrift
```

### **Reset Database (Development Only):**

```bash
# Drop all tables and re-run migrations
# WARNING: This deletes ALL data!
npm run typeorm -- schema:drop
npm run db:migrate
```

## 📚 Learn More

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [Supabase with TypeORM](https://supabase.com/docs/guides/database/typeorm)

---

**🎉 You now have a professional database migration setup!**
