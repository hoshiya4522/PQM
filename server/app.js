const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const morgan = require('morgan');
const logger = require('./logger');
const { db, initDb } = require('./db');

// Initialize DB
// In test environments, we might want to use an in-memory DB or skip this if handled by test setup
if (process.env.NODE_ENV !== 'test') {
    initDb();
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.info(message.trim())
    },
    skip: (req, res) => process.env.NODE_ENV === 'test' // Skip access logs during tests to keep output clean
}));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Serve static files (uploaded images)
app.use('/uploads', express.static(uploadDir));

// --- Helper: Delete File ---
const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// --- API Routes ---

// 1. Courses
app.get('/api/courses', (req, res) => {
  try {
    const courses = db.prepare('SELECT * FROM courses ORDER BY sort_order, title').all();
    res.json(courses);
  } catch (err) {
    logger.error("Error fetching courses", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', (req, res) => {
  const { code, title, description } = req.body;
  if (!code || !title) {
      logger.warn("Attempt to create course without code or title");
      return res.status(400).json({ error: 'Code and Title are required' });
  }
  
  try {
    const stmt = db.prepare('INSERT INTO courses (code, title, description) VALUES (?, ?, ?)');
    const info = stmt.run(code, title, description || '');
    logger.info(`Course created: ${code} - ${title}`);
    res.json({ id: info.lastInsertRowid, code, title, description });
  } catch (err) {
    logger.error("Error creating course", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    const { code, title, description } = req.body;
    try {
        db.prepare('UPDATE courses SET code = ?, title = ?, description = ? WHERE id = ?')
          .run(code, title, description, id);
        logger.info(`Course updated: ${id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error(`Error updating course ${id}`, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/courses/:id', (req, res) => {
    const { id } = req.params;
    try {
        // Find all images related to this course's questions/solutions/pages
        const questions = db.prepare('SELECT id FROM questions WHERE course_id = ?').all(id);
        for (const q of questions) {
            const solutions = db.prepare('SELECT image_path FROM solutions WHERE question_id = ?').all(q.id);
            const pages = db.prepare('SELECT image_path FROM question_pages WHERE question_id = ?').all(q.id);
            solutions.forEach(s => { if (s.image_path) deleteFile(s.image_path); });
            pages.forEach(p => { if (p.image_path) deleteFile(p.image_path); });
        }

        db.prepare('DELETE FROM courses WHERE id = ?').run(id);
        logger.info(`Course deleted: ${id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error(`Error deleting course ${id}`, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/courses/reorder', (req, res) => {
    const { orders } = req.body; // Array of {id, sort_order}
    const updateOrder = db.transaction((items) => {
        const stmt = db.prepare('UPDATE courses SET sort_order = ? WHERE id = ?');
        for (const item of items) {
            stmt.run(item.sort_order, item.id);
        }
    });

    try {
        updateOrder(orders);
        logger.info("Courses reordered");
        res.json({ success: true });
    } catch (err) {
        logger.error("Error reordering courses", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// 2. Questions

app.get('/api/questions/recent', (req, res) => {
    try {
        const recent = db.prepare(`
            SELECT q.*, c.code as course_code 
            FROM questions q
            JOIN courses c ON q.course_id = c.id
            ORDER BY q.created_at DESC, q.id DESC 
            LIMIT 5
        `).all();
        res.json(recent);
    } catch (err) {
        logger.error("Error fetching recent questions", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/questions/unsolved', (req, res) => {
    try {
        const unsolved = db.prepare(`
            SELECT q.*, c.code as course_code
            FROM questions q
            JOIN courses c ON q.course_id = c.id
            WHERE q.id NOT IN (SELECT question_id FROM solutions)
            ORDER BY q.created_at DESC, q.id DESC
            LIMIT 5
        `).all();
        res.json(unsolved);
    } catch (err) {
        logger.error("Error fetching unsolved questions", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/courses/:courseId/questions', (req, res) => {
  const { courseId } = req.params;
  const { search, sortBy = 'created_at', order = 'desc' } = req.query;

  try {
    let query = `
        SELECT q.*, 
            (SELECT COUNT(*) FROM solutions s WHERE s.question_id = q.id) as solution_count,
            (SELECT image_path FROM question_pages qp WHERE qp.question_id = q.id AND qp.image_path IS NOT NULL ORDER BY qp.page_order ASC LIMIT 1) as thumbnail_path
        FROM questions q 
        WHERE q.course_id = ?
    `;
    const params = [courseId];

    if (search) {
        query += ` AND (q.title LIKE ? OR q.notes LIKE ? OR q.references_text LIKE ?)`;
        const term = `%${search}%`;
        params.push(term, term, term);
    }

    // Validate sort columns to prevent SQL injection
    const validSorts = ['year', 'difficulty', 'created_at', 'title', 'question_number'];
    const sortColumn = validSorts.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY q.${sortColumn} ${sortOrder}`;

    const questions = db.prepare(query).all(...params);
    
    const questionsWithTags = questions.map(q => {
        const tags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN question_tags qt ON qt.tag_id = t.id
        WHERE qt.question_id = ?
        `).all(q.id);
        return { ...q, tags };
    });

    res.json(questionsWithTags);
  } catch (err) {
      logger.error(`Error fetching questions for course ${courseId}`, { error: err.message });
      res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions', upload.array('images'), (req, res) => {
  const { course_id, title, notes, references_text, difficulty, year, tags, type, question_number } = req.body;
  const files = req.files || [];

  if (!course_id) return res.status(400).json({ error: 'Course ID is required' });

  const insertQuestion = db.transaction(() => {
    // Insert main question
    const stmt = db.prepare(`
      INSERT INTO questions (course_id, title, image_path, notes, references_text, difficulty, year, type, question_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
        course_id, 
        title || 'Untitled', 
        null, // legacy image_path unused for new uploads
        notes, 
        references_text, 
        difficulty || 0,
        year || new Date().getFullYear(),
        type || null,
        question_number || null
    );
    const questionId = info.lastInsertRowid;

    // Create Pages from uploaded images
    if (files.length > 0) {
        files.forEach((file, index) => {
            // First page gets the "notes" as content
            const content = index === 0 ? (notes || '') : ''; 
            const image_path = `/uploads/${file.filename}`;
            
            db.prepare('INSERT INTO question_pages (question_id, image_path, content, page_order) VALUES (?, ?, ?, ?)')
              .run(questionId, image_path, content, index);
        });
    } else if (notes) {
        // No images, just text page
        db.prepare('INSERT INTO question_pages (question_id, image_path, content, page_order) VALUES (?, ?, ?, 0)')
          .run(questionId, null, notes);
    }

    // Tags
    if (tags) {
      let tagArray = [];
      try {
        tagArray = JSON.parse(tags);
      } catch (e) {
         tagArray = tags.split(',').map(t => t.trim());
      }
      
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
      const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
      const linkTag = db.prepare('INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)');

      for (const tagName of tagArray) {
         if(!tagName) continue;
         insertTag.run(tagName);
         const tagData = getTag.get(tagName);
         if (tagData) {
             linkTag.run(questionId, tagData.id);
         }
      }
    }
    return questionId;
  });

  try {
    const questionId = insertQuestion();
    logger.info(`Question created: ${questionId}`);
    res.json({ id: questionId, success: true });
  } catch (err) {
    logger.error("Error creating question:", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/questions/:id', upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, notes, references_text, difficulty, year, tags, type, question_number } = req.body;
  
  const updateQuestion = db.transaction(() => {
    const params = [title, notes, references_text, difficulty || 0, year, type, question_number, id];

    db.prepare(`
      UPDATE questions 
      SET title = ?, notes = ?, references_text = ?, difficulty = ?, year = ?, type = ?, question_number = ?
      WHERE id = ?
    `).run(...params);

    // Update Tags
    if (tags) {
      db.prepare('DELETE FROM question_tags WHERE question_id = ?').run(id);
      
      let tagArray = [];
      try { tagArray = JSON.parse(tags); } catch (e) { tagArray = tags.split(',').map(t => t.trim()); }

      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
      const getTag = db.prepare('SELECT id FROM tags WHERE name = ?');
      const linkTag = db.prepare('INSERT INTO question_tags (question_id, tag_id) VALUES (?, ?)');

      for (const tagName of tagArray) {
         if(!tagName) continue;
         insertTag.run(tagName);
         const tagId = getTag.get(tagName).id;
         linkTag.run(id, tagId);
      }
    }
  });

  try {
    updateQuestion();
    logger.info(`Question updated: ${id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Error updating question ${id}`, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/questions/:id', (req, res) => {
  const { id } = req.params;
  try {
    const question = db.prepare('SELECT image_path FROM questions WHERE id = ?').get(id);
    const solutions = db.prepare('SELECT image_path FROM solutions WHERE question_id = ?').all(id);
    const pages = db.prepare('SELECT image_path FROM question_pages WHERE question_id = ?').all(id);
    
    if (question && question.image_path) deleteFile(question.image_path);
    solutions.forEach(s => { if (s.image_path) deleteFile(s.image_path); });
    pages.forEach(p => { if (p.image_path) deleteFile(p.image_path); });

    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    logger.info(`Question deleted: ${id}`);
    res.json({ success: true });
  } catch (err) {
    logger.error(`Error deleting question ${id}`, { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// --- Question Pages Endpoints ---

app.post('/api/questions/:id/pages', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  
    try {
      const stmt = db.prepare('INSERT INTO question_pages (question_id, image_path, content, page_order) VALUES (?, ?, ?, (SELECT COUNT(*) FROM question_pages WHERE question_id = ?))');
      const info = stmt.run(id, image_path, content, id);
      logger.info(`Page added to question ${id}`);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (err) {
      logger.error(`Error adding page to question ${id}`, { error: err.message });
      res.status(500).json({ error: err.message });
    }
});

app.put('/api/pages/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    const new_image_path = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
      const existing = db.prepare('SELECT image_path FROM question_pages WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Page not found' });

      if (new_image_path && existing.image_path) {
        deleteFile(existing.image_path);
      }

      const imageUpdate = new_image_path ? ', image_path = ?' : '';
      const params = [content];
      if (new_image_path) params.push(new_image_path);
      params.push(id);

      db.prepare(`UPDATE question_pages SET content = ? ${imageUpdate} WHERE id = ?`).run(...params);
      logger.info(`Page updated: ${id}`);
      res.json({ success: true });
    } catch (err) {
      logger.error(`Error updating page ${id}`, { error: err.message });
      res.status(500).json({ error: err.message });
    }
});

app.delete('/api/pages/:id', (req, res) => {
    const { id } = req.params;
    try {
      const page = db.prepare('SELECT image_path FROM question_pages WHERE id = ?').get(id);
      if (page && page.image_path) deleteFile(page.image_path);
      
      db.prepare('DELETE FROM question_pages WHERE id = ?').run(id);
      logger.info(`Page deleted: ${id}`);
      res.json({ success: true });
    } catch (err) {
      logger.error(`Error deleting page ${id}`, { error: err.message });
      res.status(500).json({ error: err.message });
    }
});


// 3. Solutions

app.post('/api/questions/:id/solutions', upload.array('images'), (req, res) => {
    const { id } = req.params;
    const { content, title } = req.body;
    const files = req.files || [];
    const groupId = Date.now().toString() + Math.random().toString(36).substring(2, 9);

    try {
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM solutions WHERE question_id = ?');
        const insertStmt = db.prepare('INSERT INTO solutions (question_id, image_path, content, title, group_id, page_order) VALUES (?, ?, ?, ?, ?, ?)');

        const insertTransaction = db.transaction((questionId, solutionTitle, solutionContent, uploadedFiles, sid) => {
            const result = countStmt.get(questionId);
            const nextOrder = result ? result.count : 0;

            if (uploadedFiles.length > 0) {
                uploadedFiles.forEach((file, index) => {
                    const partContent = index === 0 ? (solutionContent || '') : '';
                    const imagePath = `/uploads/${file.filename}`;
                    insertStmt.run(questionId, imagePath, partContent, solutionTitle || null, sid, nextOrder + index);
                });
            } else {
                insertStmt.run(questionId, null, solutionContent || '', solutionTitle || null, sid, nextOrder);
            }
        });

        insertTransaction(id, title, content, files, groupId);
        logger.info(`Solution added to question ${id}`);
        res.json({ success: true });
    } catch (err) {
        logger.error(`Error adding solution to question ${id}`, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});


app.put('/api/solutions/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { content, title } = req.body;
    const new_image_path = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
      const existing = db.prepare('SELECT image_path FROM solutions WHERE id = ?').get(id);
      if (!existing) return res.status(404).json({ error: 'Solution not found' });

      if (new_image_path && existing.image_path) {
        deleteFile(existing.image_path);
      }

      const imageUpdate = new_image_path ? ', image_path = ?' : '';
      const params = [content, title];
      if (new_image_path) params.push(new_image_path);
      params.push(id);

      db.prepare(`UPDATE solutions SET content = ?, title = ? ${imageUpdate} WHERE id = ?`).run(...params);
      logger.info(`Solution updated: ${id}`);
      res.json({ success: true });
    } catch (err) {
      logger.error(`Error updating solution ${id}`, { error: err.message });
      res.status(500).json({ error: err.message });
    }
});

app.delete('/api/solutions/:id', (req, res) => {
    const { id } = req.params;
    try {
      const solution = db.prepare('SELECT image_path FROM solutions WHERE id = ?').get(id);
      if (solution && solution.image_path) deleteFile(solution.image_path);
      
      db.prepare('DELETE FROM solutions WHERE id = ?').run(id);
      logger.info(`Solution deleted: ${id}`);
      res.json({ success: true });
    } catch (err) {
      logger.error(`Error deleting solution ${id}`, { error: err.message });
      res.status(500).json({ error: err.message });
    }
});

app.get('/api/questions/:id', (req, res) => {
    const { id } = req.params;
    try {
        const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        const solutions = db.prepare('SELECT * FROM solutions WHERE question_id = ? ORDER BY page_order, created_at').all(id);
        const tags = db.prepare(`
            SELECT t.* FROM tags t
            JOIN question_tags qt ON qt.tag_id = t.id
            WHERE qt.question_id = ?
        `).all(id);
        
        let pages = db.prepare('SELECT * FROM question_pages WHERE question_id = ? ORDER BY page_order').all(id);
        
        // Fallback/Migration for legacy questions without pages
        if (pages.length === 0 && (question.image_path || question.notes)) {
            pages = [{
                id: 'legacy', // virtual id
                image_path: question.image_path,
                content: question.notes
            }];
        }

        res.json({ ...question, solutions, tags, pages });
    } catch (err) {
        logger.error(`Error fetching question ${id}`, { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// 4. Tags
app.get('/api/tags', (req, res) => {
    try {
        const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
        res.json(tags);
    } catch (err) {
        logger.error("Error fetching tags", { error: err.message });
        res.status(500).json({ error: err.message });
    }
});

// 5. Dashboard / Stats
app.get('/api/stats', (req, res) => {
    try {
        const courses = db.prepare('SELECT COUNT(*) as count FROM courses').get();
        const questions = db.prepare('SELECT COUNT(*) as count FROM questions').get();
        const solved = db.prepare('SELECT COUNT(DISTINCT question_id) as count FROM solutions').get();
        
        const stats = {
            courses: courses ? courses.count : 0,
            questions: questions ? questions.count : 0,
            solved: solved ? solved.count : 0
        };
        
        stats.unsolved = Math.max(0, stats.questions - stats.solved);
        
        res.json(stats);
    } catch (err) {
        logger.error("Stats error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;