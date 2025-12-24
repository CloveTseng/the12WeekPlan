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
      is_completed INTEGER DEFAULT 0,
      due_date TEXT,
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
    const tableInfo = db.prepare("PRAGMA table_info(weekly_actions)").all() as any[]
    const hasDueDate = tableInfo.some(col => col.name === 'due_date')
    if (!hasDueDate) {
      db.exec('ALTER TABLE weekly_actions ADD COLUMN due_date TEXT')
      console.log('Migration: Added due_date column to weekly_actions')
    }
    const hasPriority = tableInfo.some(col => col.name === 'priority')
    if (!hasPriority) {
      db.exec('ALTER TABLE weekly_actions ADD COLUMN priority TEXT DEFAULT NULL')
      console.log('Migration: Added priority column to weekly_actions')
    }
  } catch (error) {
    console.error('Migration error:', error)
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
