# 🚀 Campus Class Finder - Project Documentation

Campus Class Finder is a full-stack web application designed to help university students navigate their campus, manage their weekly class schedules, and find directions to their venues in real-time.

---

## 🛠️ Tech Stack

### Frontend
- **React (Vite) + TypeScript**: Core framework for a fast, type-safe development experience.
- **Tailwind CSS (v4)**: Modern styling for a premium, responsive look.
- **Zustand**: Lightweight state management for authentication and user sessions.
- **React Query**: Efficient server-state management for fetching and caching data.
- **Lucide React**: Clean, modern iconography.
- **Google Maps API**: Interactive maps and directions.

### Backend
- **Django + Django REST Framework**: Robust API framework.
- **SQLite (Development)**: Local persistent storage for ease of setup.
- **JWT (SimpleJWT)**: Secure authentication via tokens.
- **Django Admin**: Native administrative interface for data management.

---

## 🏗️ Project Architecture

### Data Models
- **Building**: Stores campus building codes, names, coordinates (Lat/Lng), and images.
- **Room**: Represents specific rooms within a building.
- **Course**: Stores course codes (e.g., CS101) and full names.
- **TimetableEntry**: Bridges users with specific courses and rooms at set times.

### User Flow
The application follows a logical flow designed for speed and clarity:

1.  **Authentication**:
    - User lands on the **Login/Register** page.
    - User registers a new account or logs in with existing credentials.
    - Session is persisted via JWT tokens stored in the browser.

2.  **Dashboard (Home)**:
    - Upon login, the user sees a **Search Bar** to lookup classes, rooms, or buildings.
    - An **"Up Next" Card** dynamically calculates and shows the user's nearest upcoming class based on the current time and day.
    - Quick actions like "Get Directions" are available immediately.

3.  **Timetable Management**:
    - Users can view their weekly schedule in a grid/column format.
    - **Add Class**: A modal allows searching for existing courses or **creating a new course dynamically** on the fly.
    - **Delete Class**: Quick removal of specific schedule slots.
    - **Venue Clicking**: Clicking a room/building code in the timetable navigates the user directly to its location on the Map.

4.  **Interactive Map**:
    - Displays university buildings with custom markers.
    - Center on the user's current location via browser Geolocation.
    - Selecting a building shows an **Info Panel** with details and an image.
    - **Directions**: Provides estimated walking times and uses the Google Maps Directions API.
    - **Mobile Navigation**: Includes a primary link to open the route in the native Google Maps app for real-time mobile GPS guidance.

---

## 📱 Mobile Responsiveness
The application is built with a **Mobile-First** approach:
- **Bottom Navigation Bar**: Fixed at the bottom of the screen on mobile devices for easy thumb access.
- **Responsive Panels**: Dashboard cards and Map info panels adapt their layout (e.g., Map details anchor at the bottom on mobile instead of top-left).
- **Adaptive Padding**: Layout padding scales down for smaller screens to maximize usable space.

---

## 🔐 Administrative Interface
The application leverages the **Django Admin Panel** for global entity management:
- **URL**: `http://localhost:8000/admin`
- **Capabilities**:
    - Manage Buildings and Rooms.
    - Register or ban user accounts.
    - Edit course details globally.
    - Reset or modify user timetable entries.

---

## 🚀 Setup & Running Locally

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `.\venv\Scripts\Activate.ps1` (Windows) or `source venv/bin/activate` (Mac/Linux)
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py seed` (Populates TTU buildings and test users)
7. `python manage.py runserver`

### Frontend
1. `cd frontend`
2. `npm install`
3. Create `.env` file and add `VITE_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE`
4. `npm run dev`

---

## 🌟 Vision
This tool aims to reduce "new semester anxiety" for students by providing a seamless, reliable digital companion precisely mapped to the school's physical infrastructure.
