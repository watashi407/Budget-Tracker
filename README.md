# Budget Tracker - Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)

## Database Setup

### 1. Create Supabase Project
1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be provisioned

### 2. Run Database Schema
1. In your Supabase dashboard, go to **SQL Editor**
2. Open the `supabase-schema.sql` file from the project root
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the schema

This will create:
- `budgets` table with RLS policies
- `transactions` table with RLS policies
- Necessary indexes for performance
- Triggers for automatic timestamp updates

### 3. Environment Variables
Copy the `.env.example` file to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required variables:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_GEMINI_API_KEY` - (Optional) Gemini API key for AI features

> ⚠️ **Security Note**: Never commit `.env` files or API keys to version control.


## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Project Structure (Clean Architecture)

```
src/
├── domain/              # Domain Layer (Business Logic)
│   ├── entities/        # Domain entities (User, Budget, Transaction)
│   └── repositories/    # Repository interfaces
├── data/                # Data Layer (External Data Sources)
│   └── repositories/    # Supabase repository implementations
├── presentation/        # Presentation Layer (UI)
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   └── context/         # React context providers
├── routes/              # TanStack Router route definitions
└── lib/                 # Utilities and configurations
```

## Tech Stack
- **Frontend**: React 19+ with TypeScript
- **Bundler**: Vite
- **Routing**: TanStack Router
- **State Management**: TanStack Query
- **UI**: Tailwind CSS + Shadcn UI
- **Backend**: Supabase (Auth + Database)
- **Architecture**: Clean Architecture pattern

## Features
- ✅ User Authentication (Sign up, Login, Password Reset)
- ✅ Protected Routes
- 🚧 Budget Management (CRUD)
- 🚧 Transaction Management (CRUD)
- 🚧 Dashboard with Analytics
- 🚧 Gemini AI Integration for Budget Insights

## Development
```bash
npm run dev          # Start dev server
## Deployment

### Vercel (Recommended)
This project is configured for Vercel deployment.
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add your Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`).
4. Deploy!

The `vercel.json` file ensures that client-side routing works correctly.

### Netlify / Other
Ensure your build command is `npm run build` and the publish directory is `dist`.
For SPA routing, you may need a `_redirects` file (Netlify) or similar configuration to redirect all traffic to `/index.html`.
