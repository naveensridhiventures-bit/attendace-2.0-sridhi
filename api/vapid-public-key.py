"""
GET /api/vapid-public-key

Returns the VAPID public key the frontend needs to register for web push.
Generate a key pair once (e.g. `npx web-push generate-vapid-keys`) and set
VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY in your Vercel env vars.
"""

import os
from http.server import BaseHTTPRequestHandler

from _lib.http import json_handler, options_response


def get(handler, body):
    key = os.environ.get("VAPID_PUBLIC_KEY", "")
    if not key:
        return 200, {"key": "", "warning": "VAPID_PUBLIC_KEY not set — push notifications are disabled"}
    return 200, {"key": key}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        json_handler(self, get)

    def do_OPTIONS(self):
        options_response(self)
