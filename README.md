# Cloud Cafe PH

A Django website for Cloud Café, a neighborhood coffee shop in Makati City, Philippines. The site includes a Home page, Menu page, and About Us page — plus an AI-powered chat assistant that answers questions about the café.

## Live Features

- **Home** — hero section, café highlights, featured menu items
- **Menu** — full drink menu with regular and large size pricing
- **About Us** — café story, amenities, location, and hours
- **AI Chat Widget** — floating chat assistant (Brew) powered by Amazon Bedrock Nova Lite via the [enterprise-ai-agent](https://github.com/Xeunt/enterprise-ai-agent) backend

---

## AI Integration

This project integrates with **[Xeunt/enterprise-ai-agent](https://github.com/Xeunt/enterprise-ai-agent)** — an AWS serverless backend built with Lambda, API Gateway, S3, and Amazon Bedrock Nova Lite.

### How it works

```
Browser (chat widget)
        │
        │  POST /chat/  { "question": "..." }
        │  + X-CSRFToken header
        ▼
Django proxy view (cafe/views.py)
        │
        │  POST /ask  { "question": "..." }
        │  + x-api-key header  ← added server-side, never exposed to browser
        ▼
API Gateway  →  AWS Lambda  →  Amazon Bedrock Nova Lite
                                        │
                                        │  classifies question
                                        ▼
                                   S3 documents
                               (menu / company / policies)
                                        │
                                        ▼
                              AI-generated answer
        │
        ▼
Browser receives  { "answer": "..." }
```

The API key for the enterprise-ai-agent is kept server-side in Django — it is never sent to or visible in the browser.

### What the AI can answer

The assistant reads from three S3 documents in the enterprise-ai-agent bucket:

| Document | Topics |
|---|---|
| `menu` | Drinks, prices, sizes |
| `company` | Location, hours, Wi-Fi, seating |
| `policies` | Refunds, order changes, customer policies |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web framework | Django 6.1 |
| Database | SQLite (local) / PostgreSQL (production) |
| Static files | WhiteNoise |
| WSGI server | Gunicorn |
| AI backend | [enterprise-ai-agent](https://github.com/Xeunt/enterprise-ai-agent) |
| AI model | Amazon Bedrock Nova Lite (`apac.amazon.nova-lite-v1:0`) |
| Deployment | Railway (zero-cost) |

---

## Project Structure

```
CloudCafePH/
├── cafe/                   # Main Django app
│   ├── models.py           # MenuCategory, MenuItem
│   ├── views.py            # home, menu, about, chat (AI proxy)
│   ├── urls.py             # URL routing
│   └── admin.py            # Admin panel config
├── cloudcafe/              # Django project config
│   ├── settings.py         # Environment-driven settings
│   └── urls.py             # Root URL config
├── templates/
│   ├── base.html           # Shared layout, navbar, footer, chat widget
│   └── cafe/
│       ├── home.html
│       ├── menu.html
│       └── about.html
├── static/
│   ├── css/style.css       # Full custom stylesheet
│   └── js/chat.js          # Chat widget (vanilla JS)
├── .env.example            # Environment variable template
├── Procfile                # Railway / Gunicorn start command
├── railway.json            # Railway deployment config
├── nixpacks.toml           # Build config
├── requirements.txt        # Pinned Python dependencies
└── seed_data.py            # Loads the official menu into the database
```

---

## Local Development

### Prerequisites

- Python 3.12+
- The [enterprise-ai-agent](https://github.com/Xeunt/enterprise-ai-agent) deployed on AWS (for the chat widget)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/Xeunt/CloudCafePH.git
cd CloudCafePH

# 2. Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
cp .env.example .env
# Edit .env and fill in your values (see Environment Variables below)

# 5. Run database migrations
python manage.py migrate

# 6. Seed the menu
python seed_data.py

# 7. Start the development server
python manage.py runserver
```

Open `http://127.0.0.1:8000` in your browser.

### Create an admin user (optional)

```bash
python manage.py createsuperuser
```

Then visit `http://127.0.0.1:8000/admin` to manage menu items.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key — generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DEBUG` | `True` for local development, `False` in production |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hostnames |
| `DATABASE_URL` | PostgreSQL URL (optional — defaults to SQLite locally) |
| `AI_AGENT_URL` | API Gateway invoke URL from `terraform output -raw api_url` |
| `AI_AGENT_API_KEY` | API key from `terraform output -raw api_key` |

> **Note:** `AI_AGENT_URL` and `AI_AGENT_API_KEY` change every time you run `terraform destroy` + `terraform apply` in the enterprise-ai-agent repo. Update `.env` (local) or Railway environment variables (production) after each redeploy.

---

## Deployment (Railway)

This project is configured for zero-cost deployment on [Railway](https://railway.app).

1. Create a new Railway project and connect the `Xeunt/CloudCafePH` GitHub repo
2. Add a PostgreSQL database plugin
3. Set the environment variables in the Railway Variables tab:
   - `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`, `AI_AGENT_URL`, `AI_AGENT_API_KEY`
4. Deploy — Railway runs `migrate` and `collectstatic` automatically via the `Procfile` release step
5. Generate a domain under **Settings → Networking**

---

## Related Repository

**[Xeunt/enterprise-ai-agent](https://github.com/Xeunt/enterprise-ai-agent)** — the AWS serverless AI backend this project integrates with. Built with Terraform, AWS Lambda, API Gateway, S3, and Amazon Bedrock Nova Lite.
