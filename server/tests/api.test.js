const request = require('supertest');
const app = require('../app');
const { db } = require('../db');

// Mock better-sqlite3 to avoid using the real DB during tests
// For a real integration test, we would use an in-memory DB or a test file.
// Since 'db' is exported from '../db', we can't easily mock it without dependency injection or
// setting up a test environment variable that '../db' reads.

// For now, let's assume we are running against the dev DB or a test copy.
// A better approach is to have 'initDb' accept a filename.

describe('GET /api/courses', () => {
    it('should return 200 and an array of courses', async () => {
        const res = await request(app).get('/api/courses');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });
});

describe('POST /api/courses', () => {
    it('should create a new course', async () => {
        const newCourse = {
            code: 'TEST101',
            title: 'Test Course',
            description: 'A course for testing'
        };
        const res = await request(app).post('/api/courses').send(newCourse);
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('id');
        expect(res.body.code).toEqual(newCourse.code);
        
        // Cleanup
        db.prepare('DELETE FROM courses WHERE id = ?').run(res.body.id);
    });

    it('should fail if code is missing', async () => {
        const res = await request(app).post('/api/courses').send({ title: 'No Code' });
        expect(res.statusCode).toEqual(400);
    });
});