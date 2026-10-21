# CodeSphere — AI Code Editor

A browser-based code playground with a built-in AI assistant. Pick a starter template (React, Next.js, Vue, Angular, Express, Hono), edit it in a VS Code–style Monaco editor, run it **entirely in the browser** with WebContainers, and get inline AI code completions plus an AI chat panel — powered by [Groq](https://groq.com/) (`openai/gpt-oss-20b`) and/or a local [Ollama](https://ollama.com/) model.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-MongoDB-2D3748?logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
  - [Authentication Flow](#authentication-flow)
  - [Creating & Opening a Playground](#creating--opening-a-playground)
  - [Running Code in the Browser](#running-code-in-the-browser)
  - [AI Provider Selection](#ai-provider-selection)
  - [AI Code Completion](#ai-code-completion)
  - [AI Chat Assistant](#ai-chat-assistant)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Available Scripts](#available-scripts)
- [Roadmap](#roadmap)

---

## Features

- **OAuth sign-in** with GitHub and Google (Auth.js / NextAuth v5, JWT sessions)
- **Dashboard** to create, edit, duplicate, delete and star playgrounds
- **6 starter templates** — React (TS), Next.js, Vue, Angular, Express, Hono
- **Monaco editor** with tabs, file explorer, create/rename/delete files and folders
- **In-browser runtime** — `npm install` and `npm run start` execute inside a [WebContainer](https://webcontainers.io/), with a live preview iframe
- **Integrated terminal** powered by xterm.js
- **AI inline suggestions** — context-aware completions shown as ghost text; Tab to accept, Esc to reject
- **AI chat side panel** — chat with a coding assistant (chat / review / fix / optimize modes), attach code files, one-click prompt enhancement, Markdown + KaTeX rendering and copyable code blocks
- **Pluggable AI provider** — Groq (`openai/gpt-oss-20b`), local Ollama (`qwen2.5-coder:3b`), or `auto` (Groq first, Ollama fallback), selected via `AI_PROVIDER`
- **Auto-persisted code** — the file tree is saved to MongoDB per playground
- **Light / dark theme** via `next-themes` and shadcn/ui components

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling / UI | Tailwind CSS 4, shadcn/ui, Radix UI, Base UI, lucide-react |
| Editor | Monaco Editor (`@monaco-editor/react`) |
| Runtime | `@webcontainer/api` (Node.js in the browser) |
| Terminal | xterm.js (+ fit, search, web-links addons) |
| State | Zustand, React hooks |
| Auth | Auth.js / NextAuth v5 (GitHub, Google) |
| Database | MongoDB via Prisma ORM |
| AI | Groq API (`openai/gpt-oss-20b`) and/or Ollama (`qwen2.5-coder:3b`) behind a single provider layer ([lib/ai-provider.ts](lib/ai-provider.ts)) |
| Chat rendering | react-markdown, remark-gfm, remark-math, rehype-katex, react-syntax-highlighter |

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser["🌐 Browser"]
        UI["Next.js UI<br/>(Dashboard, Playground)"]
        Monaco["Monaco Editor"]
        WC["WebContainer<br/>(Node.js runtime)"]
        Term["xterm.js Terminal"]
        Preview["Preview iframe"]
        UI --> Monaco
        UI --> Term
        Monaco -- "write files" --> WC
        Term <-- "shell I/O" --> WC
        WC -- "server-ready URL" --> Preview
    end

    subgraph Server["⚙️ Next.js Server"]
        Proxy["proxy.ts<br/>(route guard)"]
        AuthAPI["/api/auth/*<br/>NextAuth"]
        TplAPI["/api/template/[id]"]
        AIAPI["/api/code-completion"]
        ChatAPI["/api/chat"]
        Provider["lib/ai-provider.ts<br/>(Groq / Ollama / auto)"]
        Actions["Server Actions<br/>(dashboard, playground)"]
        Starters[("codesphere-starters/<br/>template folders")]
    end

    subgraph External["☁️ External Services"]
        OAuth["GitHub / Google OAuth"]
        Mongo[("MongoDB")]
        Groq["Groq API<br/>gpt-oss-20b"]
        Ollama["Ollama<br/>qwen2.5-coder:3b"]
    end

    UI --> Proxy
    UI --> AuthAPI
    UI --> TplAPI
    Monaco --> AIAPI
    UI --> ChatAPI
    UI --> Actions

    AuthAPI <--> OAuth
    AuthAPI --> Mongo
    Actions <--> Mongo
    TplAPI --> Mongo
    TplAPI --> Starters
    AIAPI --> Provider
    ChatAPI --> Provider
    Provider --> Groq
    Provider -. "fallback" .-> Ollama
```

> **Note:** WebContainers need cross-origin isolation, so [next.config.ts](next.config.ts) sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` on every route.

---

## How It Works

### Authentication Flow

All routes except `/api/auth/*` require a session. [proxy.ts](proxy.ts) (Next.js 16's replacement for `middleware.ts`) redirects anonymous users to `/auth/sign-in`, and signed-in users away from it.

```mermaid
sequenceDiagram
    actor U as User
    participant P as proxy.ts
    participant A as NextAuth (/api/auth)
    participant O as GitHub / Google
    participant DB as MongoDB

    U->>P: GET /dashboard
    P-->>U: 302 → /auth/sign-in (no session)
    U->>A: Sign in with provider
    A->>O: OAuth redirect
    O-->>A: Profile + tokens
    A->>DB: signIn callback: find user by email
    alt New user
        A->>DB: create User + Account
    else Existing user, new provider
        A->>DB: create Account (link provider)
    end
    A->>DB: jwt callback: load id & role
    A-->>U: Set JWT session cookie
    U->>P: GET /dashboard
    P-->>U: 200 OK
```

### Creating & Opening a Playground

```mermaid
sequenceDiagram
    actor U as User
    participant D as Dashboard
    participant SA as Server Actions
    participant PG as Playground page
    participant T as /api/template/[id]
    participant FS as codesphere-starters/
    participant DB as MongoDB

    U->>D: "Add New" → choose template
    D->>SA: createPlayground({title, template})
    SA->>DB: insert Playground
    D-->>U: redirect /playground/:id
    PG->>SA: getPlaygroundById(id)
    SA->>DB: Playground + TemplateFile
    alt Saved files exist
        DB-->>PG: stored file tree (JSON)
    else First open
        PG->>T: GET /api/template/:id
        T->>FS: read starter folder
        T-->>PG: file tree as JSON
    end
    U->>PG: edit + Ctrl+S
    PG->>SA: SaveUpdatedCode(id, tree)
    SA->>DB: upsert TemplateFile
```

### Running Code in the Browser

```mermaid
flowchart TD
    A["Playground opens"] --> B["WebContainer.boot()"]
    B --> C["Transform file tree<br/>→ WebContainer FS format"]
    C --> D["instance.mount(files)"]
    D --> E["spawn: npm install"]
    E -->|output streamed| T["xterm.js terminal"]
    E --> F["spawn: npm run start"]
    F -->|output streamed| T
    F --> G{{"server-ready event"}}
    G --> H["Load URL in preview iframe"]
    I["User saves a file"] --> J["writeFileSync(path, content)"]
    J --> H
```

### AI Provider Selection

Every AI route calls `generateAIText()` in [lib/ai-provider.ts](lib/ai-provider.ts) (server-only), which picks a backend based on `AI_PROVIDER`:

| `AI_PROVIDER` | Behavior |
|---|---|
| `groq` | Always use Groq (`GROQ_API_KEY` required) |
| `ollama` | Always use the local Ollama server |
| `auto` *(default)* | Use Groq if `GROQ_API_KEY` is set, and fall back to Ollama on retryable errors (timeout, 408/429/5xx, unreachable, empty reply). Without a key, go straight to Ollama |

Requests have per-call timeouts and one automatic retry. For `gpt-oss` models the provider sets `reasoning_effort: "low"` and a minimum 1024-token budget, since hidden reasoning tokens count against the limit.

### AI Code Completion

Suggestions are requested automatically after you pause typing, or on demand with <kbd>Alt</kbd>+<kbd>\\</kbd>. The server builds a context-rich prompt and sends it through the AI provider layer.

```mermaid
sequenceDiagram
    participant E as Monaco Editor
    participant H as useAISuggestion hook
    participant API as /api/code-completion
    participant P as lib/ai-provider.ts
    participant M as Groq / Ollama

    E->>H: typing pause / Alt+\
    H->>API: POST {fileContent, cursorLine, cursorColumn, suggestionType}
    API->>API: analyzeCodeContext()<br/>language, framework, ±10 lines,<br/>in function/class, incomplete patterns
    API->>API: buildPrompt()
    API->>P: generateAIText(prompt)
    P->>M: chat completion / generate
    M-->>P: completion text
    P-->>API: completion text
    API->>API: strip ``` fences & cursor markers
    API-->>H: {suggestion, context, metadata}
    H->>E: render ghost-text decoration
    alt Tab
        E->>E: insert suggestion
    else Esc / cursor moves
        E->>E: clear suggestion
    end
```

### AI Chat Assistant

Open it from the AI dropdown in the playground toolbar (**Open Chat**). The panel ([modules/ai-chat/](modules/ai-chat/)) posts to `/api/chat`, which supports two actions:

- **Chat** — `{ message, history }`: the last 10 history messages plus the new message are sent with a coding-assistant system prompt. Returns `{ response, timestamp }`.
- **Enhance** — `{ action: "enhance", prompt, context }`: rewrites a short prompt into a more specific one; falls back to the original prompt on error.

```mermaid
sequenceDiagram
    actor U as User
    participant C as AIChatSidePanel
    participant API as /api/chat
    participant P as lib/ai-provider.ts
    participant M as Groq / Ollama

    U->>C: message (+ optional file attachments, mode)
    C->>API: POST {message, history, mode}
    API->>P: generateAIText(system + history + message)
    P->>M: request (Groq, Ollama fallback in auto mode)
    M-->>P: reply
    API-->>C: {response, timestamp}
    C-->>U: Markdown / KaTeX / highlighted code blocks
```

`GET /api/chat` returns a status JSON, and `POST /api/ai-test` sends a one-line prompt to verify your provider configuration.

---

## Data Model

Defined in [prisma/schema.prisma](prisma/schema.prisma) (MongoDB provider).

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Playground : "owns"
    User ||--o{ StarMark : "stars"
    Playground ||--o{ StarMark : "starred by"
    Playground ||--o| TemplateFile : "stores code in"

    User {
        String id PK
        String name
        String email UK
        String image
        UserRole role "ADMIN | USER | PREMIUM_USER"
        DateTime createdAt
    }
    Account {
        String id PK
        String userId FK
        String provider
        String providerAccountId
        String accessToken
        String refreshToken
    }
    Playground {
        String id PK
        String userId FK
        String title
        String description
        Templates template "REACT | NEXTJS | EXPRESS | VUE | HONO | ANGULAR"
        DateTime updatedAt
    }
    StarMark {
        String id PK
        String userId FK
        String playgroundId FK
        Boolean isMarked
    }
    TemplateFile {
        String id PK
        String playgroundId FK "unique"
        Json content "serialized file tree"
    }
```

---

## Project Structure

```
codesphere-ai-code-editor/
├── app/                          # Next.js App Router
│   ├── (auth)/auth/sign-in/      # Sign-in page
│   ├── (root)/                   # Landing page
│   ├── dashboard/                # Project dashboard
│   ├── playground/[id]/          # Editor + preview + terminal
│   └── api/
│       ├── ai-test/              # Provider connectivity check
│       ├── auth/[...nextauth]/   # NextAuth handlers
│       ├── chat/                 # AI chat + prompt enhancement endpoint
│       ├── code-completion/      # AI suggestion endpoint
│       └── template/[id]/        # Starter template → JSON
├── modules/                      # Feature modules
│   ├── ai-chat/                  # Chat side panel, code blocks, file preview
│   ├── auth/                     # Actions, sign-in form, user button
│   ├── dashboard/                # Project table, template picker, actions
│   ├── home/                     # Header / footer
│   ├── playground/               # Editor, explorer, dialogs, AI hook
│   └── webcontainers/            # WebContainer hook, preview, terminal
├── components/                   # shadcn/ui + providers
├── lib/                          # Prisma client, AI provider, template paths, utils
├── prisma/schema.prisma          # Database schema
├── codesphere-starters/          # Starter project templates
├── auth.ts / auth.config.ts      # NextAuth configuration
├── proxy.ts                      # Route protection
└── routes.ts                     # Public / auth / protected route lists
```

The template → folder mapping lives in [lib/template.ts](lib/template.ts):

| Template | Folder |
|---|---|
| `REACT` | `codesphere-starters/react-ts` |
| `NEXTJS` | `codesphere-starters/nextjs` |
| `VUE` | `codesphere-starters/vue` |
| `ANGULAR` | `codesphere-starters/angular` |
| `EXPRESS` | `codesphere-starters/express-simple` |
| `HONO` | `codesphere-starters/hono-nodejs-starter` |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **MongoDB** — a local instance or a MongoDB Atlas cluster (must be a replica set for Prisma)
- **An AI backend** (optional) — a [Groq API key](https://console.groq.com/keys) and/or [Ollama](https://ollama.com/download) running locally
- OAuth apps on **GitHub** and/or **Google**
- A Chromium-based browser or Firefox (WebContainers requirement)

### 1. Clone and install

```bash
git clone https://github.com/yash9359/CodeSphere-AI-Code-Editor.git
cd CodeSphere-AI-Code-Editor
npm install
```

### 2. Configure environment

Copy [.env.example](.env.example) to `.env` and fill in the values (see [Environment Variables](#environment-variables)).

### 3. Set up the database

```bash
npx prisma generate
npx prisma db push
```

### 4. Set up an AI provider

**Option A — Groq (hosted):** set `GROQ_API_KEY` in `.env` and use `AI_PROVIDER=groq` (or `auto`).

**Option B — Ollama (local):**

```bash
ollama pull qwen2.5-coder:3b
ollama serve          # listens on http://localhost:11434
```

Then set `AI_PROVIDER=ollama` (or leave `auto` with no Groq key).

> AI is optional — the editor, terminal and preview work without a provider. Once the app is running, `POST /api/ai-test` verifies your setup.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MongoDB connection string |
| `AUTH_SECRET` | Random secret for signing JWTs (`npx auth secret`) |
| `AUTH_GITHUB_ID` | GitHub OAuth app client ID |
| `AUTH_GITHUB_SECRET` | GitHub OAuth app client secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AI_PROVIDER` | `groq`, `ollama` or `auto` (default `auto`) |
| `GROQ_API_KEY` | Groq API key (required for `groq`; enables Groq in `auto`) |
| `GROQ_MODEL` | Groq model (default `openai/gpt-oss-20b`) |
| `OLLAMA_BASE_URL` | Ollama server URL (default `http://localhost:11434`) |
| `OLLAMA_MODEL` | Ollama model (default `qwen2.5-coder:3b`) |

```env
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/codesphere"
AUTH_SECRET="your-generated-secret"

AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

AI_PROVIDER="auto"
GROQ_API_KEY="your_groq_api_key"
GROQ_MODEL="openai/gpt-oss-20b"
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5-coder:3b"
```

OAuth callback URLs for local development:

- GitHub: `http://localhost:3000/api/auth/callback/github`
- Google: `http://localhost:3000/api/auth/callback/google`

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> | Save current file |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Save all files |
| <kbd>Alt</kbd> + <kbd>\\</kbd> | Request an AI suggestion |
| <kbd>Tab</kbd> | Accept AI suggestion (while shown) |
| <kbd>Esc</kbd> | Reject AI suggestion / close the AI chat panel |

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |

---

## Roadmap

- [ ] Copy template files when duplicating a playground
- [x] Configurable AI provider / model (Groq, Ollama, auto-fallback)
- [ ] Wire the chat panel to the editor (active file context, insert/run code — props exist but are not connected yet)
- [ ] Streaming chat responses
- [ ] GitHub repository import (UI stub exists in `add-repo.tsx`)
- [ ] Role-based features for `PREMIUM_USER`
