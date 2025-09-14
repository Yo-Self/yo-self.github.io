# GEMINI.md

## Project Overview

This is a modern digital menu application built with Next.js 14, React 18, and TypeScript. It features an intelligent chatbot powered by Google's Gemma 3 language model. The application is designed to be responsive, accessible, and performant, with a focus on user experience.

**Main Technologies:**

*   **Frontend:** Next.js 14, React 18, TypeScript
*   **Styling:** Tailwind CSS 4
*   **IA:** Google Generative AI (Gemma 3 SuperTo)
*   **Backend:** Supabase Edge Functions
*   **Analytics:** PostHog, OpenReplay
*   **Deploy:** GitHub Pages

**Architecture:**

The project follows a standard Next.js App Router structure.

*   `src/app`: Contains the application's pages and layouts.
*   `src/components`: Contains reusable React components.
*   `src/hooks`: Contains custom React hooks.
*   `src/lib`: Contains libraries and configurations.
*   `src/services`: Contains services for interacting with external APIs (e.g., Supabase).
*   `src/types`: Contains TypeScript type definitions.
*   `supabase-functions`: Contains Supabase Edge Functions.
*   `public`: Contains static assets.

## Building and Running

**Prerequisites:**

*   Node.js 18+
*   Supabase account
*   Google AI API key

**Installation:**

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd web-version
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    ```bash
    cp env.example .env.local
    ```
    Edit `.env.local` with your Supabase and Google AI API keys.

**Running the project:**

```bash
npm run dev
```

**Testing:**

*   **Gemma 3 SuperTo:**
    ```bash
    node test-gemma3.js
    ```

*   **Voice Functionality:**
    ```bash
    node test-voice.js
    ```

**Deployment:**

The project is configured for deployment to GitHub Pages.

```bash
npm run build
npm run deploy
```

## Development Conventions

*   **Coding Style:** The project uses ESLint to enforce a consistent coding style.
*   **Testing:** The project has some basic tests for the Gemma 3 and voice functionalities.
*   **Contribution:** The `README.md` file provides instructions for contributing to the project.
