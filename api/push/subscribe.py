"""
POST /api/push/subscribe
Body: { employee_name, subscription: { endpoint, keys: { p256dh, auth } } }

Stores the browser's push subscription so a future job (not included here)
can send notifications to it. Persisted to a "Subscriptions" tab rather
than a database, keeping everything in the one Google Sheet.
"""

import json
from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response
from _lib.sheets import ensure_tab, find_row_index

SUB_HEADERS = ["Employee", "Endpoint", "Subscription JSON"]


def post(handler, body):
    employee_name = (body.get("employee_name") or "").strip()
    subscription = body.get("subscription")
    if not employee_name or not subscription:
        return 400, {"error": "employee_name and subscription are required"}

    endpoint = subscription.get("endpoint", "")
    ws = ensure_tab("Subscriptions", SUB_HEADERS)
    headers = ws.row_values(1)
    existing_row = find_row_index(ws, "Endpoint", endpoint, headers)

    row = [employee_name, endpoint, json.dumps(subscription)]
    if existing_row:
        ws.update(f"A{existing_row}:C{existing_row}", [row], value_input_option="USER_ENTERED")
    else:
        ws.append_row(row, value_input_option="USER_ENTERED")

    return 200, {"ok": True}


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        json_handler(self, post)

    def do_OPTIONS(self):
        options_response(self)
