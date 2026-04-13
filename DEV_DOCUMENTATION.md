# 🛠️ Developer Documentation - Campus Class Finder

Welcome to the internal documentation for the Campus Class Finder project. This guide is designed to help new developers understand the codebase structure and the purpose of key files.

---

## 📂 Backend Structure (`/backend`)
The backend is a Django project organized into several apps, each with a specific domain.

### `core/`
- **`settings.py`**: Global project settings, database configuration, and installed apps.
- **`urls.py`**: Main routing file that routes traffic to specific apps.

### `users/`
- **`models.py`**: Defines the `User` model (Standard email-based login).
- **`serializers.py`**: Transforms user data to/from JSON.
- **`views.py`**: Handles authentication logic (Login, Registration, Profiles).

### `campus/`
- **`models.py`**: Core campus data: `Building`, `Room`, and `Course`.
- **`views.py`**: Provides API endpoints for searching and retrieving campus data.
- **`management/commands/seed.py`**: A utility script to populate the database with initial campus data.

### `timetable/`
- **`models.py`**: Defines `Schedule` (Global class times) and `TimetableEntry` (Personalized user schedules).
- **`views.py`**: Logic for users to manage their personal timetables.

---

## 📂 Frontend Structure (`/frontend`)
The frontend is a React application built with Vite and Tailwind CSS.

### `src/api/`
- **`client.ts`**: The centralized Axios instance. It handles automatic headers (like JWT token injection) and defines the base URL for the backend API.

### `src/components/`
- **`Layout.tsx`**: The main wrapper for the app. It manages the Sidebar (Desktop) and Bottom Navigation Bar (Mobile).
- **`AddClassModal.tsx`**: A complex component that allows users to pick existing courses or create new ones dynamically.

### `src/pages/`
These are full-page components mapped to specific routes in `App.tsx`:
- **`Dashboard.tsx`**: The main landing page with search and the "Up Next" class card.
- **`Login.tsx`**: Handles both the Login and Sign-up UI states.
- **`Map.tsx`**: The Google Maps integration, search markers, and navigation logic.
- **`Timetable.tsx`**: Displays the user's weekly schedule in a responsive grid.

### `src/store/`
- **`useAuthStore.ts`**: A Zustand store that manages the user's authentication state, tokens, and profile data across the entire application.

### `src/App.tsx`
The "brain" of the frontend routing. It defines which paths are protected (require login) and maps URLs to their respective page components.

---

## 🔄 Development Workflow

### API Integration
When adding a new feature that requires backend data:
1.  Define the model in the appropriate backend app.
2.  Create a serializer.
3.  Add an endpoint in `views.py` and register it in `urls.py`.
4.  Fetch the data in the frontend using **React Query** (see `Dashboard.tsx` for examples).

### Component Styling
We use **Tailwind CSS v4**. Avoid writing custom CSS in `.css` files unless absolutely necessary. Instead, use utility classes directly in the TSX files to maintain consistency and responsiveness (using `md:`, `lg:`, etc., for breakpoints).

---

## 🚦 Common Commands
- **Backend**: `python manage.py runserver`
- **Frontend**: `npm run dev`
- **Database Reset**: `python manage.py flush && python manage.py seed`
