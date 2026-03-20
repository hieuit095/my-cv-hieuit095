# Portfolio & Blog Generator

A modern, highly customizable personal portfolio and blog site generator built with React, Vite, TypeScript, and Supabase.

This project allows developers to quickly launch their own professional portfolio featuring a dynamic dashboard for content management, a blog, and beautifully designed sections to showcase their skills, experience, and projects.

## Features

- **Dynamic Portfolio Sections:** Showcase your skills, stats, services, timeline (experience & education), projects, and contact info.
- **Integrated Blog System:** Write and publish blog posts with rich formatting, tags, and cover images.
- **Admin Dashboard:** A secure dashboard to manage your profile, skills, timeline, projects, services, and blog content.
- **Authentication:** Secure login for content management powered by Supabase Auth.
- **Modern UI:** Built with Tailwind CSS and shadcn-ui for a clean, responsive, and accessible design.
- **Animations:** Smooth entry animations and transitions using Framer Motion.
- **Dark Mode Support:** Seamless theme switching with next-themes.

## Technologies Used

- **Frontend Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **UI Components:** shadcn-ui, Radix UI
- **Icons:** Lucide React
- **Animations:** Framer Motion, tailwindcss-animate
- **Routing:** React Router DOM
- **State Management & Data Fetching:** React Query (@tanstack/react-query)
- **Backend & Database:** Supabase (Auth, Database, Storage)
- **Forms & Validation:** React Hook Form, Zod
- **Markdown Rendering:** React Markdown, remark-gfm

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v18 or higher recommended) - [Download Node.js](https://nodejs.org/)
- npm (comes with Node.js)
- A [Supabase](https://supabase.com/) account for database and authentication.

## Installation Instructions

Follow these steps to set up the project locally.

### 1. Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Supabase

This project relies on Supabase for the backend. You need to create a new project on Supabase and configure it.

1.  **Create a Supabase Project:** Go to the [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2.  **Database Schema:** You will need to set up the necessary tables for the application (e.g., profiles, skills, timeline_events, projects, services, blog_posts). *(Note: If you have a `supabase/migrations` folder, you can run those, or check the application logic for required table schemas).*
3.  **Authentication:** Enable Email authentication in your Supabase project settings.
4.  **Storage:** Create a new storage bucket (e.g., `portfolio-images`) and configure the necessary access policies for public reading and authenticated uploading if required.

### 4. Configure Environment Variables

Create a `.env` file in the root directory of your project (or copy from `.env.example` if it exists) and add your Supabase credentials.

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the actual values found in your Supabase project settings under **Project Settings > API**.

### 5. Start the development server

```bash
npm run dev
```

The application will now be running on `http://localhost:8080` (or another port if 8080 is in use).

## Available Scripts

In the project directory, you can run:

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run lint`: Runs ESLint to find and fix problems in your code.
- `npm run preview`: Bootstraps a local web server to preview the production build.

## Project Structure

```
├── src/
│   ├── components/      # Reusable UI components (including shadcn-ui)
│   ├── hooks/           # Custom React hooks (e.g., data fetching, theme)
│   ├── integrations/    # External integrations (e.g., Supabase client setup)
│   ├── lib/             # Utility functions and configurations
│   ├── pages/           # Application route components (Index, Dashboard, Blog, etc.)
│   ├── App.tsx          # Main application component and routing setup
│   ├── index.css        # Global CSS and Tailwind directives
│   └── main.tsx         # Application entry point
├── supabase/            # Supabase configuration and migrations (if applicable)
├── public/              # Static assets
└── ...configuration files (vite.config.ts, tailwind.config.ts, tsconfig.json, etc.)
```

## Contributing

Contributions are welcome! If you'd like to improve this project, please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes and commit them (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request.

## License

This project is open-source and available under the [MIT License](LICENSE).
