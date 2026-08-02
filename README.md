# Pharmacy Management System

A full-stack pharmacy management platform — customer ordering, prescription verification, staff/inventory management, and an AI support assistant, built for a real pharmacy's online operations.

## Features

- **Customer storefront** — browse medicines, cart, checkout with delivery or pickup, online (Razorpay) or cash on delivery payment
- **Prescription (Rx) verification** — customers upload prescriptions for restricted medicines; staff review, approve, or reject before an order is fulfilled
- **Staff dashboard** — order queue, prescription review, inventory management, restocking, low-stock alerts
- **Admin panel** — staff account management, sales/revenue summary
- **Loyalty points & coupons** — customers earn points on purchases and can redeem discount codes at checkout
- **AI support assistant** — a scoped chatbot for order/site questions; explicitly does not give medical advice
- **Notifications** — SMS (Twilio) and email (SMTP) alerts for order status changes and low-stock warnings
- **PWA support** — installable on mobile home screens, works with an offline fallback page

## Tech Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy, Alembic, JWT auth
**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
**Payments:** Razorpay
**File storage:** AWS S3 (prescription uploads)
**AI:** Google Gemini 2.5 Flash (support assistant)
**Deployment:** Render (backend + database), Vercel (frontend)

## Project Structure

```
├── app/                    # FastAPI backend
│   ├── routers/            # API endpoints (auth, orders, staff, admin, loyalty, support, payments)
│   ├── schemas/             # Pydantic request/response models
│   ├── models.py             # SQLAlchemy database models
│   ├── config.py            # Environment/settings management
│   └── main.py               # App entrypoint
├── frontend/               # Next.js frontend
│   ├── app/(customer)/       # Customer-facing pages
│   ├── app/(staff)/           # Staff/admin pages
│   └── components/            # Shared UI components
├── migrations/              # Alembic database migrations
├── tests/                     # Backend test suite (pytest)
├── scripts/                   # Utility scripts (e.g. database backup)
├── SOP.md                      # Staff standard operating procedure
└── .env.example                # Template for required environment variables
```

## Getting Started (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL running locally (or via Docker)

### Backend setup
```bash
# from repo root
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt

# copy and fill in your local values
cp .env.example .env

# run migrations
alembic upgrade head

# start the server
uvicorn app.main:app --reload
```
Backend runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### Frontend setup
```bash
cd frontend
npm install

# copy and fill in your local values
cp .env.example .env.local

npm run dev
```
Frontend runs at `http://localhost:3000`.

### Running tests
```bash
pytest
```

## Environment Variables

See `.env.example` for the full list. At minimum, local development needs:
- `DATABASE_URL` — your local PostgreSQL connection string
- `SECRET_KEY` — any random string for JWT signing
- `ADMIN_BOOTSTRAP_PASSWORD` — password for the auto-created default admin account

Production/staging requires additional keys for Razorpay, AWS S3, Twilio, SMTP, and Gemini — see `.env.example` for the complete list and `SOP.md` / deployment notes for setup guidance.

## Deployment

Backend and database are deployed on Render; frontend on Vercel. Both auto-deploy from the `main` branch. See the deployment checklist (kept outside version control — ask the project maintainer) for the full environment variable list and step-by-step setup.

## Staff Documentation

See [`SOP.md`](./SOP.md) for the staff-facing standard operating procedure — how to log in, process orders, verify prescriptions, and manage inventory.

## License

Private project — not licensed for external use or distribution.
