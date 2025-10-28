# Nivodiya Farms Frontend

React frontend for the Nivodiya Farms KPI Dashboard.

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your API URL:

```
VITE_API_URL=http://localhost:8000
```

### 3. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

### Login Page
- Clean and modern login interface
- JWT token-based authentication
- Test credentials provided

### Dashboard
- KPI cards showing:
  - Active crop cycles
  - Total fields
  - Total crop cycles
  - Completed cycles
- Recent crop cycles list

### Incident Management
- List view of all crop cycles with:
  - Crop and field information
  - Stage badges (color-coded)
  - Status badges (Open/Closed)
  - Supervisor information
- Create new crop cycles
- Edit existing crop cycles
- Delete crop cycles
- Modal form with validation

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/         # Reusable components
│   └── Layout.jsx     # Main layout with sidebar
├── contexts/          # React contexts
│   └── AuthContext.jsx # Authentication context
├── pages/             # Page components
│   ├── Login.jsx      # Login page
│   ├── Dashboard.jsx  # Dashboard page
│   └── Incident.jsx   # Incident management page
├── services/          # API services
│   └── api.js         # Axios configuration and API calls
├── utils/             # Utility functions
│   └── PrivateRoute.jsx # Protected route wrapper
├── App.jsx            # Main app component
├── main.jsx           # Entry point
└── index.css          # Global styles
```

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## Preview Production Build

```bash
npm run preview
```

