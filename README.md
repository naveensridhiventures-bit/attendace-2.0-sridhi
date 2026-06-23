# Sridhi — Attendance, Salary & Permission System

A React (Vite) frontend + Python serverless API, deployed as a single
Vercel project. All data lives in one Google Sheet — no separate database.

## How it's structured

```
/src        React frontend (pages, components, styles)
/api        Python serverless functions (one file = one endpoint)
/api/_lib   Shared helpers: Google Sheets access, salary formula, HTTP glue
```

## Google Sheet setup (one-time)

1. Create a Google Sheet. Copy its ID from the URL:
   `https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_ID/edit`
2. Create a Google Cloud service account, enable the **Google Sheets API**
   and **Google Drive API**, and download its JSON key.
3. Share the Sheet with the service account's `client_email` (found inside
   the JSON key) — give it **Editor** access.
4. That's it — the backend auto-creates everything else:
   - An `Employees` tab (Name, Role, Monthly Salary, Active) — **add your
     employees here**. This is the master list the whole app reads from.
   - An `HR` tab with a PIN in cell B1 (defaults to `1234` — **change this
     immediately** after first deploy).
   - Every month, `{Month}-{Year} Attendance`, `{Month}-{Year} Salary`,
     `{Month}-{Year} Permission`, and `{Month}-{Year} Leave` tabs are
     created automatically the first time anyone touches that month.

### Editing employees / attendance / advances
Everything is editable directly in the sheet:
- **Add/remove employees** → edit the `Employees` tab. Set `Active` to
  `FALSE` to hide someone from the dropdown without deleting their history.
- **Fix a wrong attendance mark** → edit the cell in the month's
  Attendance tab directly.
- **Add an advance** → edit the `Advance` column in the month's Salary
  tab; it's picked up next time anyone opens the Salary page.

## Salary formula

```
Paid Days = P×1 + WO×1 + WOP×2 + A×0 + NA×0
Per Day   = Monthly Salary ÷ 30        (always 30, regardless of month length)
Gross     = Per Day × Paid Days
Net       = Gross − Advance
```

| Code | Meaning | Days counted |
|------|---------|--------------|
| P    | Present | 1 |
| WO   | Week off (paid rest day) | 1 |
| WOP  | Worked on holiday (double pay) | 2 |
| A    | Absent | 0 |
| NA   | Not marked / relieved | 0 |

This logic lives in exactly one place: `api/_lib/salary.py`. Change it
there if the rule ever changes.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel.
3. In **Project Settings → Environment Variables**, add:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the full service-account JSON as one
     line (e.g. `cat key.json | tr -d '\n'` then paste the result)
   - `SHEET_ID` — your spreadsheet ID
   - (optional) `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` for web push
4. Deploy. Frontend and API both serve from the same domain — no separate
   backend URL needed (`VITE_API_URL` can stay unset).

## API reference

All endpoints live under `/api`. PIN-protected ones share the PIN stored
in the `HR` sheet tab, cell B1.

| Endpoint | Method | Protected | Purpose |
|---|---|---|---|
| `/api/employees` | GET | – | Live employee list for dropdowns |
| `/api/mark_attendance` | POST | – | Mark one employee's status for today |
| `/api/mark_attendance_bulk` | POST | – | Mark several employees at once |
| `/api/today_status` | GET | – | Everyone marked today |
| `/api/submit_leave` | POST | – | File a leave request |
| `/api/my_requests` | POST | – | One employee's leave history (last 6 months) |
| `/api/submit_permission` | POST | – | File a permission request |
| `/api/dashboard/unlock` | POST | PIN | Check PIN for Salary/HR access |
| `/api/salary_data` | POST | PIN | Computed salary for a given month |
| `/api/hr/pending_requests` | POST | PIN | Pending leaves + permissions this month |
| `/api/hr/decide` | POST | PIN | Approve/reject a leave or permission |
| `/api/vapid-public-key` | GET | – | Public key for web push registration |
| `/api/push/subscribe` | POST | – | Store a push subscription |
| `/api/notifications/check` | POST | – | Poll for decided requests |

## Local development

```bash
npm install
npm run dev          # frontend only, talks to your deployed API by default
```

To run the Python API locally too, use the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```
