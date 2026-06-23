"""
Tiny helper so every Vercel Python function (BaseHTTPRequestHandler style)
doesn't have to repeat CORS headers / JSON parsing / error formatting.

Usage in an api/*.py file:

    from http.server import BaseHTTPRequestHandler
    from _lib.http import json_handler

    class handler(BaseHTTPRequestHandler):
        def do_POST(self):
            json_handler(self, post)
        def do_OPTIONS(self):
            json_handler(self, lambda h, body: (200, {}))

    def post(handler, body):
        ... return (status_code, response_dict)
"""

import json
import traceback

from .sheets import SheetsError


def _send(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.end_headers()
    handler.wfile.write(body)


def read_json_body(handler) -> dict:
    length = int(handler.headers.get("Content-Length", 0) or 0)
    if length == 0:
        return {}
    raw = handler.rfile.read(length)
    if not raw:
        return {}
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def json_handler(handler, fn):
    """
    fn(handler, body_dict) -> (status_code, response_dict)
    Catches SheetsError and any other exception, returning a clean JSON
    error instead of a raw 500 with a stack trace.
    """
    try:
        body = read_json_body(handler) if handler.command in ("POST", "PUT", "PATCH") else {}
        status, payload = fn(handler, body)
        _send(handler, status, payload)
    except SheetsError as e:
        _send(handler, 500, {"error": str(e)})
    except Exception as e:
        traceback.print_exc()
        _send(handler, 500, {"error": f"Server error: {e}"})


def options_response(handler):
    _send(handler, 200, {})
