# Make It Yourself: Building PQM from Scratch

This guide walks you through the architecture and logic required to recreate the **Past Question Manager**.

## 1. Project Initialization
The project is a monorepo. Create a root directory and two subdirectories: `client` and `server`.

```bash
mkdir past-question-manager && cd past-question-manager
mkdir server client
```

## 2. The Backend (Node.js + SQLite)
We use **Express** for the API and **better-sqlite3** for a fast, file-based database.

### Setup
1. Initialize npm in `server/`.
2. Install: `express`, `cors`, `multer` (for uploads), `better-sqlite3`, `fs-extra`, `morgan`.

### Core Logic: Database (`db.js`)
Define your schema early. The most important tables are:
*   `courses`: Basic metadata.
*   `questions`: Metadata (title, year).
*   `question_pages`: The "hybrid" content. A question can have many pages, each with an image and text.
*   `solutions`: Similar to pages, but linked to questions.

### Core Logic: Multi-Image Upload
Use `multer` to handle `multipart/form-data`.
```javascript
const upload = multer({ storage: multer.diskStorage(...) });
app.post('/api/questions', upload.array('images'), (req, res) => {
    // req.files contains the uploaded images
    // req.body contains text fields
    // Use a transaction to insert the question first, then each image as a 'page'
});
```

## 3. The Frontend (React + Vite + Tailwind)
Use **Vite** for a modern development experience and **Tailwind CSS** for rapid UI building.

### Setup
1. Scaffold with Vite: `npm create vite@latest client -- --template react`
2. Install: `axios`, `lucide-react` (icons), `react-router-dom`, `react-markdown`.

### Key Component: The Hybrid Uploader
Creating a component that handles both **Drag & Drop** and **Clipboard Paste** is the secret sauce.
*   Listen for `onPaste` events.
*   Access `event.clipboardData.files`.
*   Convert them to `URL.createObjectURL(file)` for instant previews.

### Key Page: Question View
*   Fetch the question data including all its pages and solutions.
*   Render pages in a vertical list to create a "continuous" document feel.
*   Use `react-markdown` to render the notes.
*   Hide the solution section behind a state variable (`showSolution`) for active recall.

## 4. Advanced Features to Implement
1.  **Reordering:** Implement a `sort_order` column in the database. Use HTML5 Drag & Drop API (`onDragStart`, `onDrop`) to allow users to move items. Send the new order to an `/api/courses/reorder` endpoint that updates the database using a transaction.
2.  **Multi-Solution Tabs:** 
    *   Store a `title` and `group_id` for each solution entry.
    *   On the backend, when multiple files are uploaded together, generate a unique `group_id` and assign it to all created rows.
    *   On the frontend, use a grouping function (e.g., `useMemo` or a utility) to organize the flat list of solution parts into an array of groups before rendering.
    *   Render a list of buttons (tabs) that update an `activeSolutionIdx` state variable to switch the displayed group.
3.  **Dynamic Thumbnails:** Use a subquery in your main SQL `SELECT` to fetch the first available image from `question_pages` to display as a thumbnail in lists.
4.  **Active Recall:** Always ensure solutions are hidden by default to help the student test themselves.
5.  **Categorization:** Implement fields for **Difficulty** and **Question Type**. Use `<select>` dropdowns in your modals to ensure consistent data entry.
6.  **Difficulty Levels:** Use a numeric mapping (e.g., 0: Undefined, 1: Easy, 3: Medium, 5: Hard) to store difficulty in the database. This allows for easier sorting logic while displaying human-readable labels in the UI.
7.  **Dynamic Filtering:** Compute the set of available years, types, and tags directly from the loaded questions of a course. This ensures the filter lists are always relevant and updated without needing separate API calls or complex state syncing.

## 5. Deployment / Portability
*   **Relative Paths:** Use relative paths (e.g., `/api` instead of `localhost:5000/api`) so the app works on LAN/WiFi without configuration.
*   **Static Export (Server-Side):** Write a script that iterates through your SQLite database and writes every API response to a `.json` file in the frontend's build folder. This allows the app to be hosted as a static site (e.g., on GitHub Pages).
*   **Static Mode (Client-Side):** Implement a "Read-Only" mode. When a specific environment variable is detected during build, intercept API calls to append `.json` to URLs and hide all modification buttons (Add/Edit/Delete) in the UI.

## 6. Cross-Platform Automation
*   **Installers:** Create `.sh` (Unix) or `.bat` (Windows) scripts that automate `npm install` in both directories to lower the barrier for non-technical users.
*   **Startup Scripts:** Use background processing (e.g., `&` in bash or `start` in Windows) to launch both the backend and frontend with a single command. 
*   **LAN Detection:** Implement logic to detect and display the computer's local IP address so users can easily find the URL to open on their mobile devices.

---

### Tips for Success
*   **Transactions:** Use SQLite transactions when saving multi-part questions to ensure you don't end up with "half-saved" data if an upload fails.
*   **Cleanup:** When deleting a course or question, always use `fs.unlink` to remove the actual image files from the `uploads/` folder.
*   **Logging:** Use a structured logger from the start to make debugging backend errors much easier.
