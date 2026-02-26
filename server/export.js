const fs = require('fs-extra');
const path = require('path');
const { db } = require('./db');

const EXPORT_DIR = path.join(__dirname, '../client/dist/api');

async function exportToStatic() {
  console.log('🚀 Exporting database to static JSON...');
  await fs.ensureDir(EXPORT_DIR);

  // Helper: Write JSON file
  const writeJson = (filePath, data) => {
    const fullPath = path.join(EXPORT_DIR, filePath + '.json');
    fs.ensureDirSync(path.dirname(fullPath));
    fs.writeJsonSync(fullPath, data);
    console.log(`✅ Exported ${filePath}.json`);
  };

  // 1. Stats
  const coursesCount = db.prepare('SELECT COUNT(*) as count FROM courses').get();
  const questionsCount = db.prepare('SELECT COUNT(*) as count FROM questions').get();
  const solvedCount = db.prepare('SELECT COUNT(DISTINCT question_id) as count FROM solutions').get();
  const stats = {
    courses: coursesCount ? coursesCount.count : 0,
    questions: questionsCount ? questionsCount.count : 0,
    solved: solvedCount ? solvedCount.count : 0
  };
  stats.unsolved = Math.max(0, stats.questions - stats.solved);
  writeJson('stats', stats);

  // 2. Recent & Unsolved Questions
  const recent = db.prepare(`
    SELECT q.*, c.code as course_code 
    FROM questions q
    JOIN courses c ON q.course_id = c.id
    ORDER BY q.created_at DESC, q.id DESC 
    LIMIT 5
  `).all();
  writeJson('questions/recent', recent);

  const unsolved = db.prepare(`
    SELECT q.*, c.code as course_code
    FROM questions q
    JOIN courses c ON q.course_id = c.id
    WHERE q.id NOT IN (SELECT question_id FROM solutions)
    ORDER BY q.created_at DESC, q.id DESC
    LIMIT 5
  `).all();
  writeJson('questions/unsolved', unsolved);

  // 3. Tags
  const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
  writeJson('tags', tags);

  // 4. Courses
  const courses = db.prepare('SELECT * FROM courses ORDER BY sort_order, title').all();
  writeJson('courses', courses);

  for (const course of courses) {
    // 5. Course Questions
    const questions = db.prepare(`
      SELECT q.*, 
          (SELECT COUNT(*) FROM solutions s WHERE s.question_id = q.id) as solution_count,
          (SELECT image_path FROM question_pages qp WHERE qp.question_id = q.id AND qp.image_path IS NOT NULL ORDER BY qp.page_order ASC LIMIT 1) as thumbnail_path
      FROM questions q 
      WHERE q.course_id = ?
      ORDER BY q.question_number ASC, q.created_at DESC
    `).all(course.id);

    const questionsWithTags = questions.map(q => {
      const qTags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN question_tags qt ON qt.tag_id = t.id
        WHERE qt.question_id = ?
      `).all(q.id);
      return { ...q, tags: qTags };
    });

    writeJson(`courses/${course.id}/questions`, questionsWithTags);
  }

  // 6. Question Details
  const allQuestions = db.prepare('SELECT id FROM questions').all();
  for (const qInfo of allQuestions) {
    const id = qInfo.id;
    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    const solutions = db.prepare('SELECT * FROM solutions WHERE question_id = ? ORDER BY page_order, created_at').all(id);
    const qTags = db.prepare(`
        SELECT t.* FROM tags t
        JOIN question_tags qt ON qt.tag_id = t.id
        WHERE qt.question_id = ?
    `).all(id);
    
    let pages = db.prepare('SELECT * FROM question_pages WHERE question_id = ? ORDER BY page_order').all(id);
    
    if (pages.length === 0 && (question.image_path || question.notes)) {
        pages = [{
            id: 'legacy',
            image_path: question.image_path,
            content: question.notes
        }];
    }

    writeJson(`questions/${id}`, { ...question, solutions, tags: qTags, pages });
  }

  console.log('✨ Database export completed!');
}

exportToStatic().catch(err => {
  console.error('❌ Error exporting database:', err);
  process.exit(1);
});
