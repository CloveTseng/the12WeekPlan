import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  const dbPath = join(app.getPath('userData'), 'database.sqlite')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      tactics TEXT,
      deadline TEXT,
      year INTEGER NOT NULL,
      quarter INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weekly_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      week_number INTEGER NOT NULL,
      content TEXT NOT NULL,
      due_date TEXT,
      priority TEXT DEFAULT 'none',
      is_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monthly_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plan_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)
  
  // Migration: Add due_date column if it doesn't exist
  try {
    db.exec(`
      ALTER TABLE weekly_actions ADD COLUMN due_date TEXT;
    `)
  } catch (error) {
    // Column already exists, ignore error
  }
  
  // Migration: Add priority column if it doesn't exist
  try {
    db.exec(`
      ALTER TABLE weekly_actions ADD COLUMN priority TEXT DEFAULT 'none';
    `)
  } catch (error) {
    // Column already exists, ignore error
  }
  
  // Migration: Add note column to projects if it doesn't exist
  try {
    db.exec(`
      ALTER TABLE projects ADD COLUMN note TEXT;
    `)
  } catch (error) {
    // Column already exists, ignore error
  }
  
  console.log('Database initialized at', dbPath)
  return db
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}
