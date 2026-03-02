# Athena Justice

Athena Justice is a modern, secure web application designed for law enforcement and justice system professionals. Built with Next.js and Firebase, it provides a robust dashboard and management system to stream-line operations.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms & Validation**: React Hook Form & Zod
- **Data Visualization**: Recharts
- **Backend/Services**: Firebase

## Getting Started

First, install the dependencies if you haven't already:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the application. You can log in with the default credentials provided on the login screen.

## Project Structure

- `src/app`: Contains the Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (including Radix UI standard components).
- `src/lib`: Utility functions and shared logic.

## Deployment

To deploy this project to Vercel, follow these steps:

1. Push your code to a Git repository (e.g., GitHub, GitLab, Bitbucket).
2. Go to the [Vercel dashboard](https://vercel.com/new) and import your repository.
3. Vercel will automatically detect that this is a Next.js project and configure the build settings.
4. **Environment Variables**: You will need to add your necessary environment variables (e.g., Firebase config or `GEMINI_API_KEY`) to the environment variables in your Vercel project settings.
5. Click "Deploy". Your application will be built and deployed.
