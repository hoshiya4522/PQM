# Developer Guide

## Project Structure
The project is a monorepo containing both the Client and Server.

```
past-question-manager/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/     # Modals (Add/Edit), GalleryUploader
│   │   ├── pages/          # Dashboard, CourseView, QuestionView
│   │   ├── api.js          # Axios API client
│   │   └── setupTests.js   # Vitest setup
│   ├── App.test.jsx        # Smoke tests
│   └── package.json
├── server/                 # Node.js Backend (Express)
│   ├── uploads/            # Stored image files
│   ├── logs/               # JSON application logs
│   ├── tests/              # Jest/Supertest API tests
│   ├── db.js               # SQLite database & migrations
│   ├── app.js              # Express app initialization (testable)
│   ├── logger.js           # Structured logging logic
│   ├── index.js            # Server entry point
│   └── package.json
├── wiki/                   # Documentation
├── README.md
├── start.sh                # Unix startup script
├── start-windows.bat       # Windows startup script
├── install-linux.sh        # Linux installer
├── install-mac.sh          # macOS installer
└── install.bat             # Windows installer
```

## Database Schema (SQLite)

### `courses`
*   `id` (PK), `code`, `title`, `description`, `sort_order`

### `questions`
*   `id` (PK), `course_id` (FK), `title`, `difficulty`, `year`, `type`, `notes`, `references_text`

### `question_pages`
*   `id` (PK), `question_id` (FK), `image_path`, `content`, `page_order`

### `solutions`
*   `id` (PK), `question_id` (FK), `image_path`, `content`, `title`, `group_id`, `page_order`

### `tags` & `question_tags`
*   Standard Many-to-Many relationship for tagging.

## Running Locally for Development

1.  **Install Dependencies:**
    ```bash
    cd server && npm install
    cd ../client && npm install
    ```

2.  **Start Server (Port 5000):**
    ```bash
    cd server
    npm start
    ```

3.  **Start Client (Port 5173):**
    ```bash
    cd client
    npm run dev
    ```

## Static Site Export (Read-Only)
You can export the entire database as static JSON for hosting on GitHub Pages.

1.  **Export Script:** `server/export.js` queries SQLite and generates JSON files in `client/dist/api/`.
2.  **Build Workflow:** Use the root `build.sh` to automate the build, export, and asset bundling.
    ```bash
    ./build.sh --base /repo-name/
    ```
3.  **Static Mode:** The frontend uses `VITE_STATIC_MODE=true` to switch to the static API and hide all "Add", "Edit", and "Delete" actions.

## Logging & Debugging

The backend uses a structured JSON logger located in `server/logger.js`.
- Logs are printed to the console in development.
- Persisted logs can be found at `server/logs/app.log`.

## Testing

Comprehensive testing is implemented for both tiers.
- **Backend:** `Jest` + `Supertest` located in `server/tests/`.
- **Frontend:** `Vitest` + `React Testing Library`.
- Run tests with `npm test` in the respective directories.
