# API Reference

Base URL: `http://localhost:5000/api`

## Courses

*   `GET /courses` - List all courses (sorted by `sort_order`).
*   `POST /courses` - Create a new course.
    *   Body: `{ code: "CS101", title: "Intro to CS" }`
*   `PUT /courses/:id` - Update course metadata.
*   `DELETE /courses/:id` - Delete course and all related data.
*   `POST /courses/reorder` - Set custom order.
    *   Body: `{ orders: [{id: 1, sort_order: 0}, ...] }`

## Questions

*   `GET /courses/:courseId/questions` - List questions for a course.
    *   Query Params: `search`, `sortBy` (year, type, difficulty, created_at, title, tags), `order` (asc, desc).
*   `GET /questions/:id` - Get details of a single question (includes pages & solutions).
*   `POST /questions` - Create a new question.
    *   Form Data: `title`, `year`, `type`, `images` (array), `notes` (text), `tags` (JSON array).
*   `PUT /questions/:id` - Update question metadata.
    *   Form Data: `title`, `year`, `type`, `difficulty`, `notes`, `references_text`, `tags` (JSON array).
*   `DELETE /questions/:id` - Delete a question and all associated files.

## Question Pages (Content)

*   `POST /questions/:id/pages` - Add a new page to a question.
    *   Form Data: `content`, `image` (file).
*   `PUT /pages/:id` - Update a specific page.
*   `DELETE /pages/:id` - Remove a page.

## Solutions

*   `POST /questions/:id/solutions` - Add a new solution (supports multiple images).
    *   Form Data: `title`, `content`, `images` (array).
*   `PUT /solutions/:id` - Update a solution part.
*   `DELETE /solutions/:id` - Delete a solution part.


## Tags

*   `GET /tags` - List all unique tags used in the system.
