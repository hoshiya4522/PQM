# Testing Guide

This project maintains high code quality through automated testing on both the frontend and backend.

## 🖥️ Backend Testing (Jest & Supertest)

The backend tests focus on API endpoint integrity and database interactions.

### Running Tests
Navigate to the `server` directory and use npm:
```bash
cd server
npm test
```

### Structure
- **Location:** `server/tests/`
- **Configuration:** Handled in `package.json`.
- **Framework:** `Jest` for the runner and `Supertest` for HTTP assertions.

### Writing a New Test
Create a file ending in `.test.js` in the `server/tests/` directory.
```javascript
const request = require('supertest');
const app = require('../app');

describe('GET /api/tags', () => {
    it('should return 200', async () => {
        const res = await request(app).get('/api/tags');
        expect(res.statusCode).toEqual(200);
    });
});
```

---

## 🎨 Frontend Testing (Vitest & RTL)

The frontend tests ensure components render correctly and handle user interactions.

### Running Tests
Navigate to the `client` directory:
```bash
cd client
npm test
```

### Structure
- **Location:** Co-located with components (e.g., `src/App.test.jsx`).
- **Framework:** `Vitest` (Vite-native testing) and `React Testing Library`.
- **Environment:** `jsdom` (simulates a browser environment).

### Writing a New Test
```javascript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
// ... import your component

describe('MyComponent', () => {
    it('shows the correct title', () => {
        render(<MyComponent title="Hello" />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
});
```

---

## 🛠️ Continuous Integration (CI)
When adding features, always ensure both test suites pass before merging. Tests are designed to run in a "clean" environment where `process.env.NODE_ENV === 'test'`.