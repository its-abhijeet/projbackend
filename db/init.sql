-- Create database if it doesn't exist
-- Note: This command must be run manually as PostgreSQL doesn't support
-- conditional database creation in a single script
-- CREATE DATABASE odoo_db;

-- Connect to the database
\c odoo_db;

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some sample data
INSERT INTO items (name, description) VALUES
  ('Item 1', 'Description for item 1'),
  ('Item 2', 'Description for item 2'),
  ('Item 3', 'Description for item 3');
