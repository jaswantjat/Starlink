# AI Results Page — Setup Guide

## What Was Built

```
starlink/results-page/
├── index.html            ← The GitHub Pages Results Page
├── n8n_poll_workflow.json ← Import this into n8n
└── SETUP.md              ← This file
```

---

## Step 1 — Create GitHub Repo for the Results Page

1. Go to [github.com/new](https://github.com/new)
2. Name the repo: `starlink-results` (or `results`)
3. Set it to **Public**
4. Push the `results-page/` folder:
   ```bash
   cd /Users/masterjaswant/starlink/results-page
   git init
   git add .
   git commit -m "Add results page"
   git remote add origin https://github.com/jaswantjat/starlink-results.git
   git push -u origin main
   ```
5. In the repo Settings → **Pages** → Source: `main` branch → `/` (root)
6. Your Results Page will be live at: `https://jaswantjat.github.io/starlink-results/`

---

## Step 2 — Import the Polling Webhook into n8n

1. Open your n8n instance: `https://primary-production-903a.up.railway.app`
2. Click **+ New Workflow** → **Import from file**
3. Select `n8n_poll_workflow.json`
4. The workflow has one webhook node: `GET /webhook/poll-ai-result`
5. **Activate** the workflow (toggle top right)
6. The polling URL will be:
   ```
   https://primary-production-903a.up.railway.app/webhook/poll-ai-result?row_id=XXXX
   ```

> **Test it:** Open your browser and visit:
> `https://primary-production-903a.up.railway.app/webhook/poll-ai-result?row_id=1279`
> You should get a JSON response with `"status": "complete"` and the AI result for that row.

---

## Step 3 — Fix the AI Sub-Workflow (Prevent Duplicate Rows)

In n8n, open the **`techincian pdf ai review`** workflow and change the **"Save to Baserow"** node:

| Setting | Current Value | Change To |
|---|---|---|
| Operation | `create` | `update` (if row exists) |
| Logic | Always creates | Check first, then create or update |

**Practical fix — add a "Check if row exists" node before saving:**

1. Add a **Baserow → List Rows** node before "Save to Baserow":
   - Database: 170, Table: 814
   - Filter: `field_8388` (link to order) **has** `{{ $json.metadata.row_id }}`
   - Limit: 1
2. Add an **If** node:
   - Condition: `{{ $json.id }}` exists → True = Update, False = Create
3. Wire accordingly.

> For now, the duplicate risk is low (technicians rarely re-submit), so this is a low-priority fix if you want to ship quickly.

---

## Step 4 — Configure Fillout Redirect

1. In Fillout, open the **8RpNqwgyxwus** form (Starlink × Eltex installer form)
2. Go to **Settings** → **After Submission**
3. Set action to: **Redirect to URL**
4. Set URL to:
   ```
   https://jaswantjat.github.io/starlink-results/?row_id=@{row_id}&customer_name=@{customer_name}
   ```
   Where `@{row_id}` and `@{customer_name}` are Fillout's merge variables for those hidden fields.

> **Important:** The `row_id` is already a hidden field in the form (it's in the webhook body `body.row_id`). Verify it appears in Fillout's merge variable picker.

---

## Step 5 — Test End-to-End

1. Submit a real test form on a mobile phone.
2. Verify the redirect lands on the Results Page with `?row_id=XXXX` in the URL.
3. Watch the spinner animate through the 4 steps.
4. Within 10–30 seconds, the result card should appear.
5. If the result is Rechazado — verify the "Corregir y Reenviar" button links to the Fillout edit URL.

---

## CORS Test (If the page can't fetch from n8n)

Open browser DevTools → Console. If you see a CORS error:
```
Access to fetch 'https://primary-production-...up.railway.app/...' has been blocked
```

Add this to your n8n **environment variables** on Railway:
```
N8N_CORS_ENABLE=true
N8N_CORS_ALLOW_ORIGIN=*
```
Restart the Railway service and test again.
