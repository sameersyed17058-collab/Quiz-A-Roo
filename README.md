# Quiz-A-Roo

Minimal fullstack scaffold: Express backend + React frontend.

Quick start

1. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
2. Install dependencies:

```bash
npm run install-all
```

3. Run backend in dev:

```bash
npm run dev
```

4. In another terminal run the client:

```bash
npm run client
```

API
- POST `/api/generate-quiz` { topic, difficulty, numQuestions }
