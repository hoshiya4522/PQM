const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Ensure database directory exists
const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT,
      image_path TEXT,
      notes TEXT,
      references_text TEXT,
      difficulty INTEGER DEFAULT 0,
      year INTEGER,
      type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      image_path TEXT,
      content TEXT,
      title TEXT,
      group_id TEXT,
      page_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      color TEXT
    );

    CREATE TABLE IF NOT EXISTS question_tags (
      question_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (question_id, tag_id),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS question_pages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      image_path TEXT,
      content TEXT,
      page_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `;
  db.exec(schema);
  
  // Migration: Add year column if it doesn't exist
  try {
    db.prepare('ALTER TABLE questions ADD COLUMN year INTEGER').run();
  } catch (error) {}

  // Migration: Add page_order to solutions
  try {
    db.prepare('ALTER TABLE solutions ADD COLUMN page_order INTEGER DEFAULT 0').run();
  } catch (error) {}

  // Migration: Add sort_order to courses
  try {
    db.prepare('ALTER TABLE courses ADD COLUMN sort_order INTEGER DEFAULT 0').run();
  } catch (error) {}

  // Migration: Add title to solutions
  try {
    db.prepare('ALTER TABLE solutions ADD COLUMN title TEXT').run();
  } catch (error) {}

  // Migration: Add type to questions
  try {
    db.prepare('ALTER TABLE questions ADD COLUMN type TEXT').run();
  } catch (error) {}

  // Migration: Add question_number to questions
  try {
    db.prepare('ALTER TABLE questions ADD COLUMN question_number INTEGER').run();
  } catch (error) {}

  // Migration: Add group_id to solutions
  try {
    db.prepare('ALTER TABLE solutions ADD COLUMN group_id TEXT').run();
    // Populate existing solutions with a unique group_id per row if they don't have one
    db.prepare("UPDATE solutions SET group_id = 'legacy-' || id WHERE group_id IS NULL").run();
  } catch (error) {}

  console.log('Database initialized');
}

module.exports = { db, initDb };