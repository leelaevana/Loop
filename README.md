# LOOP — AI Customer Feedback Intelligence Platform

LOOP is a multi-tenant AI-powered customer-feedback intelligence platform that helps companies collect, organize, analyze, and understand customer feedback from multiple sources.

The platform uses AI to classify feedback by sentiment, feature area, and theme, generate analytics, perform semantic search, answer natural-language questions, and create Voice-of-Customer reports.

## Features

* 🔐 Authentication with secure credential-based login
* 👥 Role-based access control

  * ADMIN
  * ANALYST
  * VIEWER
* 🏢 Multi-tenant workspace isolation
* 📝 Single customer-feedback entry
* 📥 CSV bulk feedback import
* 📊 Dashboard analytics
* 📈 Sentiment and feedback trends
* 🏷️ Feedback themes
* 🤖 AI-powered feedback classification
* 🔎 Semantic feedback search
* 💬 Ask LOOP natural-language insights
* 📄 AI-generated Voice-of-Customer reports
* 🔒 Server-side API key protection
* 📱 Responsive web interface

## Technology Stack

### Frontend

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* Recharts

### Backend

* Next.js App Router API Routes
* NextAuth.js
* Prisma ORM
* PostgreSQL

### AI

* Google Gemini API
* Gemini Flash for classification and report generation
* Gemini Embedding API for semantic search
* Zod for structured AI-response validation

### Development Tools

* Node.js
* npm
* Git
* VS Code

## System Architecture

```text
User
 │
 ▼
Next.js Frontend
 │
 ├── Dashboard
 ├── Feedback Inbox
 ├── Trends
 ├── Ask LOOP
 ├── Reports
 └── Settings
 │
 ▼
Next.js API Routes
 │
 ├── Authentication
 ├── Feedback APIs
 ├── Analytics APIs
 ├── Theme APIs
 ├── Semantic Search
 └── Report Generation
 │
 ├───────────────┐
 ▼               ▼
PostgreSQL     Gemini API
 │               │
 ▼               ▼
Prisma ORM     AI Analysis
```

## Multi-Tenant Security

LOOP is designed as a multi-tenant application.

Every authenticated user belongs to a workspace. Tenant-owned database queries use the authenticated user's `workspaceId`.

```text
Authenticated User
        ↓
Session
        ↓
workspaceId
        ↓
Database Query
        ↓
Only that workspace's data
```

The application does not trust a workspace ID supplied by the browser.

For example, changing:

```text
/api/feedback?workspaceId=another-workspace
```

does not allow a user to access another company's feedback.

Workspace isolation was also tested using a separate test workspace.

## Role-Based Access Control

| Feature              | ADMIN | ANALYST | VIEWER |
| -------------------- | :---: | :-----: | :----: |
| View dashboard       |   ✅   |    ✅    |    ✅   |
| View feedback        |   ✅   |    ✅    |    ✅   |
| Analyze feedback     |   ✅   |    ✅    |    ✅   |
| Generate reports     |   ✅   |    ✅    |    ❌   |
| View reports         |   ✅   |    ✅    |    ✅   |
| Workspace management |   ✅   |    ❌    |    ❌   |

Unauthorized API operations return appropriate HTTP status codes such as:

```text
401 Unauthorized
403 Forbidden
```

## AI Feedback Classification

LOOP sends feedback to Gemini for structured classification.

The AI identifies:

* Sentiment
* Sentiment score
* Feature area
* Theme
* Theme description

Example:

```json
{
  "sentiment": "NEG",
  "sentimentScore": 0.91,
  "featureArea": "Checkout",
  "theme": "Payment Failure",
  "themeDescription": "Customers are experiencing payment failures during checkout."
}
```

AI responses are validated with Zod before being used by the application.

## Semantic Search

Feedback can be converted into embeddings using Gemini's embedding API.

The embedding is used to find feedback that is semantically related to a user's question.

Example:

```text
Question:
"Why are customers unhappy with payments?"

        ↓

Query embedding

        ↓

Semantic similarity search

        ↓

Relevant customer feedback

        ↓

Gemini-generated answer
```

The Ask LOOP feature uses workspace-scoped feedback as its context.

## Dashboard

The analytics dashboard provides:

* Total feedback
* Positive feedback
* Neutral feedback
* Negative feedback
* Feedback status
* Theme distribution
* Sentiment distribution
* Feedback volume over time

Charts are implemented using Recharts.

## Reports

ADMIN and ANALYST users can generate AI-powered Voice-of-Customer reports.

Reports contain:

* Executive summary
* Top themes
* Sentiment summary
* Recommendations

Generated reports are stored in PostgreSQL and remain associated with their workspace.

## Project Structure

```text
loop/
│
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── feedback/
│   │   ├── insights/
│   │   ├── reports/
│   │   └── themes/
│   │
│   ├── ask/
│   ├── dashboard/
│   ├── inbox/
│   ├── login/
│   ├── reports/
│   ├── settings/
│   ├── signup/
│   └── trends/
│
├── components/
│   └── Navbar.tsx
│
├── lib/
│   ├── ai.ts
│   ├── auth.ts
│   ├── authorization.ts
│   ├── current-user.ts
│   ├── db.ts
│   ├── permissions.ts
│   ├── search.ts
│   └── tenant.ts
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── types/
│   └── next-auth.d.ts
│
├── .env.example
├── package.json
└── README.md
```

## Database

The application uses PostgreSQL with Prisma ORM.

Main models include:

* Workspace
* User
* Feedback
* Theme
* FeedbackTheme
* Embedding
* Report

Relationships are scoped to workspaces where appropriate to maintain tenant isolation.

## Getting Started

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd loop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL="your-postgresql-connection-string"

NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-auth-secret"

GEMINI_API_KEY="your-gemini-api-key"
```

Never commit the `.env` file.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Seed demo data

```bash
npx prisma db seed
```

### 7. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Demo Accounts

For local development, the seeded demo accounts use:

```text
ADMIN
Email: admin@loop-demo.com
Password: Demo@123456

ANALYST
Email: analyst@loop-demo.com
Password: Demo@123456

VIEWER
Email: viewer@loop-demo.com
Password: Demo@123456
```

Do not use these credentials in production.

## Environment Variables

| Variable         | Purpose                        |
| ---------------- | ------------------------------ |
| `DATABASE_URL`   | PostgreSQL database connection |
| `NEXTAUTH_URL`   | Application URL                |
| `AUTH_SECRET`    | Session/authentication secret  |
| `GEMINI_API_KEY` | Gemini API authentication      |

API keys and database credentials are kept server-side.

## Security Considerations

* Passwords are hashed using bcrypt.
* Authentication is handled by NextAuth.js.
* Sessions use JWT strategy.
* Role-based authorization is enforced server-side.
* Workspace ownership is derived from the authenticated session.
* Tenant-owned database queries are workspace-scoped.
* Gemini API credentials are never exposed to the browser.
* `.env` is excluded from Git.
* Unauthorized API requests are rejected.

## Development Status

### Completed

* [x] Next.js project setup
* [x] PostgreSQL + Prisma
* [x] Authentication
* [x] Signup/login
* [x] Role-based access control
* [x] Multi-tenant workspace isolation
* [x] Feedback API
* [x] CSV import
* [x] AI classification
* [x] Embeddings
* [x] Semantic search
* [x] Ask LOOP
* [x] Dashboard analytics
* [x] Trends
* [x] AI reports
* [x] Settings
* [x] Navigation
* [x] Security testing
* [x] Git repository setup

### Future Improvements

* PostgreSQL pgvector integration for production-scale vector search
* Automated theme clustering
* Additional feedback source integrations
* Advanced workspace administration
* Production deployment
* Automated testing
* Monitoring and logging

## License

This project was developed as part of the Zidio Development project/internship work.
