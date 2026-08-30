# Used Motorcycle Marketplace

A web application for listing, searching for, and trading used motorcycles. The project includes user/admin interfaces and a server-side API.

## Key features

- Registration, login, OTP verification, Google sign-in, and session management.
- Create, edit, review, hide, and save motorcycle listings.
- Search and filter vehicles by category, brand, and listing criteria.
- Real-time messaging, notifications, browsing history, and content reports.
- Profile, address, two-factor security, and identity-verification management.
- Professional seller plans, listing boosts, and payments through VNPay, MoMo, or bank transfer.
- An administration area for users, listings, reports, transactions, revenue, and staff.

## Technology stack

| Area           | Technology                                                             |
| -------------- | ---------------------------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query |
| Backend        | NestJS 11, TypeScript, TypeORM, PostgreSQL                             |
| Real-time      | Socket.IO                                                              |
| Authentication | JWT, Passport, bcrypt, Google OAuth                                    |
| Integrations   | Cloudinary, SendGrid/Nodemailer, Google Gemini, VNPay, MoMo            |

## Project structure

```text
.
├── frontend/                 # React/Vite application
│   └── src/
│       ├── pages/            # User and administration screens
│       ├── components/       # Reusable UI components
│       ├── apis/             # API requests
│       └── layouts/          # Page layouts
└── backend/                  # NestJS REST API
    └── src/
        ├── modules/          # Business domains
        ├── database/         # TypeORM migrations
        └── configs/          # Application configuration
```

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- PostgreSQL, either local or cloud-hosted

## Installation and local development

### 1. Install dependencies

Open two terminals from the project root:

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

### 2. Configure the backend

Create `backend/.env`. At minimum, provide a PostgreSQL connection string:

```env
DIRECT_URL=postgresql://<user>:<password>@<host>:<port>/<database>
PORT=8080
```

Depending on the features you need, add configuration for email, Cloudinary, Google OAuth, Gemini, and JWT using the environment variables required by their respective modules. OTP and payment configuration templates are available at:

- `backend/.env.otp.example`
- `backend/.env.payment.example`

Do not commit secrets from `.env` files to Git.

### 3. Set up the database

From the `backend` directory, run migrations:

```bash
npm run migration:run
```

### 4. Start the backend

```bash
cd backend
npm run start:dev
```

The API runs by default at `http://localhost:8080` with the `/api/v1` prefix.

Swagger documentation: `http://localhost:8080/api-docs`

### 5. Start the frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The frontend runs by default at `http://localhost:5173` and currently targets the backend at `http://localhost:8080/`.

## Useful commands

| Location   | Command                    | Purpose                                  |
| ---------- | -------------------------- | ---------------------------------------- |
| `frontend` | `npm run dev`              | Start the development server             |
| `frontend` | `npm run build`            | Type-check and create a production build |
| `frontend` | `npm run lint`             | Run lint checks                          |
| `backend`  | `npm run start:dev`        | Start NestJS in watch mode               |
| `backend`  | `npm run build`            | Compile the backend                      |
| `backend`  | `npm run test`             | Run unit tests                           |
| `backend`  | `npm run test:e2e`         | Run end-to-end tests                     |
| `backend`  | `npm run migration:show`   | Show migration status                    |
| `backend`  | `npm run migration:revert` | Revert the latest migration              |

## Development notes

- The backend enables CORS for `http://localhost:5173`. Update `backend/src/main.ts` when using another domain.
- Apply migrations with the TypeORM commands because database synchronization is disabled.
- The API uses cookies and authentication, so the frontend must run from an origin allowed by CORS during local development.
