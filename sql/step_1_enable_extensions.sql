-- Step 1: Enable Required PostgreSQL Extensions
-- Run this first to enable UUID generation and other required features

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Note: Run this in the Supabase SQL Editor before running other migration files
