"""
Core Google Sheets helper for the Sridhi backend.

Handles:
  - Service-account auth (creds come from env vars, see README for setup)
  - Opening the spreadsheet
  - Auto-creating this month's Attendance / Salary / Permission / Leave tabs
  - Generic row read/append/update helpers used by every API route

Sheet/tab naming convention (matches what the frontend already expects,
e.g. "June-2026 Permission" mentioned in PermissionPage.jsx):
    "{Month}-{Year} Attendance"
    "{Month}-{Year} Salary"
    "{Month}-{Year} Permission"
    "{Month}-{Year} Leave"

Plus two tabs that are NOT month-scoped:
    "Employees"   -> master list: name, role, monthly_salary, pin (optional per-employee), active
    "HR"          -> just used to hold the unlock PIN in cell B1 (see get_hr_pin)
"""

import os
import json
import datetime
from functools import lru_cache

import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

ATTENDANCE_HEADERS = ["Date", "Employee", "Status", "Time", "Latitude", "Longitude"]
SALARY_HEADERS = [
    "Name", "Role", "Monthly Salary", "P", "WO", "WOP", "A", "NA",
    "Advance", "Paid Days", "Per Day", "Gross", "Net", "Warning",
]
PERMISSION_HEADERS = ["SNo", "Employee", "Date", "Hours", "Reason", "Status", "HR Comments", "Submitted At"]
LEAVE_HEADERS = ["SNo", "Employee", "Type", "From", "To", "Days", "Reason", "Status", "HR Comments", "Submitted At"]
EMPLOYEES_HEADERS = ["Name", "Role", "Monthly Salary", "Active"]


class SheetsError(Exception):
    pass


@lru_cache(maxsize=1)
def _get_client():
    """
    Build an authorized gspread client from env vars.

    Expected env vars (set these in Vercel project settings):
      GOOGLE_SERVICE_ACCOUNT_JSON  -> the full service-account JSON, as a single-line string
      SHEET_ID                     -> the spreadsheet ID (from its URL)

    The service account's client_email must be shared on the target
    Google Sheet with Editor access, or every call below will fail
    with a 403 PERMISSION_DENIED.
    """
    raw = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise SheetsError(
            "GOOGLE_SERVICE_ACCOUNT_JSON env var is not set. "
            "Paste the full service account JSON (one line) into your Vercel env vars."
        )
    try:
        info = json.loads(raw)
    except json.JSONDecodeError as e:
        raise SheetsError(f"GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON: {e}")

    creds = Credentials.from_service_account_info(info, scopes=SCOPES)
    return gspread.authorize(creds)


@lru_cache(maxsize=1)
def _get_spreadsheet():
    sheet_id = os.environ.get("SHEET_ID")
    if not sheet_id:
        raise SheetsError("SHEET_ID env var is not set.")
    client = _get_client()
    try:
        return client.open_by_key(sheet_id)
    except gspread.exceptions.APIError as e:
        raise SheetsError(f"Could not open spreadsheet: {e}")


def india_now():
    # Vercel's Python runtime has no tzdata bundled by default, so we
    # apply the fixed +5:30 offset directly rather than depending on a
    # timezone database being present.
    return datetime.datetime.utcnow() + datetime.timedelta(hours=5, minutes=30)


def month_tab_name(kind: str, month: int = None, year: int = None) -> str:
    """kind is one of: Attendance, Salary, Permission, Leave"""
    now = india_now()
    month = month or now.month
    year = year or now.year
    return f"{MONTH_NAMES[month - 1]}-{year} {kind}"


def ensure_tab(name: str, headers: list[str]):
    """Public alias — get-or-create a tab by exact name with the given headers."""
    return _ensure_tab(name, headers)


def _ensure_tab(name: str, headers: list[str]):
    ss = _get_spreadsheet()
    try:
        ws = ss.worksheet(name)
    except gspread.exceptions.WorksheetNotFound:
        ws = ss.add_worksheet(title=name, rows=200, cols=max(len(headers), 10))
        ws.append_row(headers, value_input_option="USER_ENTERED")
        ws.format(f"A1:{gspread.utils.rowcol_to_a1(1, len(headers))}", {"textFormat": {"bold": True}})
    return ws


def get_or_create_month_tab(kind: str, month: int = None, year: int = None):
    """
    Auto-creates this month's tab the first time it's touched, with the
    right header row, so the sheet structure self-builds every month
    without anyone having to set it up by hand.
    """
    headers = {
        "Attendance": ATTENDANCE_HEADERS,
        "Salary": SALARY_HEADERS,
        "Permission": PERMISSION_HEADERS,
        "Leave": LEAVE_HEADERS,
    }[kind]
    name = month_tab_name(kind, month, year)
    return _ensure_tab(name, headers)


def get_employees_tab():
    return _ensure_tab("Employees", EMPLOYEES_HEADERS)


def get_hr_tab():
    """A simple settings tab. Cell B1 holds the HR/Salary PIN."""
    ss = _get_spreadsheet()
    try:
        ws = ss.worksheet("HR")
    except gspread.exceptions.WorksheetNotFound:
        ws = ss.add_worksheet(title="HR", rows=10, cols=2)
        ws.update("A1", "PIN")
        ws.update("B1", "1234")  # default — change this in the sheet immediately
    return ws


def get_hr_pin() -> str:
    ws = get_hr_tab()
    val = ws.acell("B1").value
    return str(val).strip() if val else "1234"


def rows_as_dicts(ws) -> list[dict]:
    """Read all rows as a list of dicts keyed by the header row."""
    records = ws.get_all_records(default_blank="")
    return records


def find_row_index(ws, header: str, value, headers: list[str] = None) -> int | None:
    """
    Returns the 1-based sheet row number of the first row where `header`
    column equals `value`, or None. Row 1 is the header row so data starts
    at row 2.
    """
    headers = headers or ws.row_values(1)
    try:
        col = headers.index(header) + 1
    except ValueError:
        return None
    col_values = ws.col_values(col)
    for i, v in enumerate(col_values[1:], start=2):
        if str(v).strip() == str(value).strip():
            return i
    return None


def next_sno(ws) -> int:
    vals = ws.col_values(1)[1:]  # skip header
    nums = [int(v) for v in vals if str(v).strip().isdigit()]
    return (max(nums) + 1) if nums else 1
