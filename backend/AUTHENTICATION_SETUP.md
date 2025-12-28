# Authentication Setup Guide

## Current Status

The User model points to `auth.users` table in Supabase, which has limited columns:
- `id` (UUID)
- `email` 
- `encrypted_password`
- `user_metadata` (JSONB) - can store custom fields

## Issue

The current code tries to:
- Query users by `phone` (not a column in auth.users)
- Set `name`, `phone`, `password`, `role`, `language` directly (not columns)

## Solutions

### Option 1: Use Supabase Auth API (Recommended)
1. Create users via Supabase Auth `signUp` API
2. Store custom fields (phone, name, role, language) in `user_metadata` JSONB
3. Update `authenticate_user()` to query `user_metadata->>'phone'`
4. Update User model properties to read from `user_metadata`

### Option 2: Create a public.users table
1. Create a `public.users` table with: id, name, phone, password, role, language
2. Use `id` as FK to `auth.users.id`
3. Update User model to point to `public.users` instead of `auth.users`
4. Keep auth.users for authentication, public.users for custom data

### Option 3: Use email instead of phone
1. Update authentication to use `email` instead of `phone`
2. Store phone in `user_metadata` if needed
3. Update all API endpoints to use email

## Current Implementation

- `authenticate_user()`: Returns False (needs implementation)
- `create_user()`: Returns 501 error (use Supabase Auth API)
- User properties: Return None/defaults (need to read from user_metadata)

## Next Steps

1. Choose one of the options above
2. Implement the chosen solution
3. Update User model and authentication functions accordingly


