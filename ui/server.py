"""
server.py — Lightweight HTTP server for the Myna config UI.

Serves static UI files and exposes a REST API for reading/writing
Myna YAML config files. All data stays local.

Usage:
    python3 ui/server.py
    python3 ui/server.py --manifest-path /path/to/install-manifest.json
"""

import sys
import os
import json
import threading
import time
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))
import yaml_parser

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MANIFEST_PATH = Path.home() / ".myna" / "install-manifest.json"
IMPORTS_DIR = Path.home() / ".myna" / "imports"
IMPORTS_ARCHIVED_DIR = IMPORTS_DIR / "archived"
PENDING_IMPORTS_FILE = Path.home() / ".myna" / "pending-imports.json"

PORT_RANGE_START = 3000
PORT_RANGE_END = 3010

INACTIVITY_TIMEOUT = 1800  # 30 minutes
INACTIVITY_CHECK_INTERVAL = 60  # 1 minute

STATIC_DIR = Path(__file__).parent

CONFIG_NAMES = ["workspace", "projects", "people", "communication-style", "meetings", "tags"]

CONFIG_DEFAULTS = {
    "workspace": {
        "user": {"name": "", "email": "", "role": ""},
        "vault": {"path": "", "subfolder": "myna"},
        "timezone": "",
        "work_hours": {"start": "09:00", "end": "17:00"},
        "mcp_servers": {"email": "", "slack": "", "calendar": ""},
        "features": {},
    },
    "projects": {
        "projects": [],
        "triage": {
            "inbox_source": "INBOX",
            "folders": [],
            "draft_replies_folder": "DraftReplies",
        },
    },
    "people": {"people": []},
    "communication-style": {
        "default_preset": "professional",
        "presets_per_tier": {"upward": "", "peer": "", "direct": "", "cross-team": ""},
        "sign_off": "",
        "email_preferences": {"max_length": "", "greeting_style": ""},
        "messaging_preferences": {"formality": "", "emoji_usage": ""},
    },
    "meetings": {"meetings": []},
    "tags": {"tags": []},
}

# ---------------------------------------------------------------------------
# Module-level state
# ---------------------------------------------------------------------------

config_dir: Path = None
last_request_time: float = time.time()

# ---------------------------------------------------------------------------
# Startup helpers
# ---------------------------------------------------------------------------

def load_manifest(manifest_path: Path) -> dict:
    if not manifest_path.exists():
        print(f"ERROR: Manifest not found at {manifest_path}", file=sys.stderr)
        print("Run the Myna install script first, or pass --manifest-path.", file=sys.stderr)
        sys.exit(1)
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_available_port() -> int:
    for port in range(PORT_RANGE_START, PORT_RANGE_END + 1):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(("localhost", port))
                return port
        except OSError:
            continue
    print(f"ERROR: No available port in range {PORT_RANGE_START}-{PORT_RANGE_END}", file=sys.stderr)
    sys.exit(1)


def ensure_dirs():
    IMPORTS_DIR.mkdir(parents=True, exist_ok=True)
    IMPORTS_ARCHIVED_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Deep merge
# ---------------------------------------------------------------------------

def deep_merge(base: dict, incoming: dict) -> dict:
    """
    Recursively merge incoming into base.
    - Scalars: incoming wins
    - Dicts: recursive merge (keys in base but not in incoming are preserved)
    - Lists: incoming replaces base entirely
    """
    result = dict(base)
    for key, inc_val in incoming.items():
        base_val = result.get(key)
        if isinstance(base_val, dict) and isinstance(inc_val, dict):
            result[key] = deep_merge(base_val, inc_val)
        else:
            result[key] = inc_val
    return result


# ---------------------------------------------------------------------------
# CORS helpers
# ---------------------------------------------------------------------------

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


# ---------------------------------------------------------------------------
# Multipart parser
# ---------------------------------------------------------------------------

def parse_multipart(body_bytes: bytes, boundary: str):
    """
    Parse a multipart/form-data body.
    Returns a list of (filename, file_bytes) tuples.
    """
    delimiter = ("--" + boundary).encode("utf-8")
    closing = ("--" + boundary + "--").encode("utf-8")

    parts = []
    # Split on the delimiter
    segments = body_bytes.split(delimiter)

    for segment in segments:
        # Skip empty segments and the closing boundary
        segment = segment.strip(b"\r\n")
        if not segment or segment == b"--" or segment.startswith(b"--"):
            continue

        # Split headers from body at the double CRLF
        if b"\r\n\r\n" in segment:
            raw_headers, file_body = segment.split(b"\r\n\r\n", 1)
        elif b"\n\n" in segment:
            raw_headers, file_body = segment.split(b"\n\n", 1)
        else:
            continue

        # Strip trailing CRLF from file body
        if file_body.endswith(b"\r\n"):
            file_body = file_body[:-2]
        elif file_body.endswith(b"\n"):
            file_body = file_body[:-1]

        # Parse headers
        headers_text = raw_headers.decode("utf-8", errors="replace")
        filename = None
        for header_line in headers_text.split("\r\n"):
            if not header_line:
                continue
            header_lower = header_line.lower()
            if "content-disposition" in header_lower:
                # Extract filename="..."
                for token in header_line.split(";"):
                    token = token.strip()
                    if token.lower().startswith("filename="):
                        raw_name = token[len("filename="):].strip().strip('"').strip("'")
                        filename = raw_name
                        break

        if filename:
            parts.append((filename, file_body))

    return parts


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------

class MynaHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        # Suppress default access log to keep stdout clean
        pass

    def _update_activity(self):
        global last_request_time
        last_request_time = time.time()

    def _send_json(self, status: int, data, extra_headers: dict = None):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, status: int, message: str):
        self._send_json(status, {"error": message})

    def _send_file(self, file_path: Path, content_type: str):
        if not file_path.exists():
            self._send_error(404, f"File not found: {file_path.name}")
            return
        body = file_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    # ------------------------------------------------------------------
    # OPTIONS preflight
    # ------------------------------------------------------------------

    def do_OPTIONS(self):
        self._update_activity()
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()

    # ------------------------------------------------------------------
    # GET
    # ------------------------------------------------------------------

    def do_GET(self):
        self._update_activity()
        path = self.path.split("?")[0]  # strip query string

        if path == "/api/config":
            self._handle_get_all_config()
        elif path.startswith("/api/config/"):
            name = path[len("/api/config/"):]
            self._handle_get_config(name)
        elif path == "/api/imports":
            self._handle_get_imports()
        elif path == "/api/manifest":
            self._handle_get_manifest()
        elif path == "/" or path == "/index.html":
            self._send_file(STATIC_DIR / "index.html", "text/html; charset=utf-8")
        elif path == "/styles.css":
            self._send_file(STATIC_DIR / "styles.css", "text/css; charset=utf-8")
        elif path == "/app.js":
            self._send_file(STATIC_DIR / "app.js", "application/javascript; charset=utf-8")
        else:
            self._send_error(404, f"Not found: {path}")

    def _read_config(self, name: str) -> dict:
        """Read one config file. Returns empty default if file doesn't exist."""
        file_path = config_dir / f"{name}.yaml"
        if not file_path.exists():
            return CONFIG_DEFAULTS.get(name, {})
        try:
            return yaml_parser.load(str(file_path))
        except Exception:
            return CONFIG_DEFAULTS.get(name, {})

    def _handle_get_all_config(self):
        result = {}
        for name in CONFIG_NAMES:
            result[name] = self._read_config(name)
        self._send_json(200, result)

    def _handle_get_config(self, name: str):
        if name not in CONFIG_NAMES:
            self._send_error(404, f"Unknown config: {name}")
            return
        self._send_json(200, self._read_config(name))

    def _handle_get_imports(self):
        if not PENDING_IMPORTS_FILE.exists():
            self._send_json(200, {"files": []})
            return
        try:
            with open(PENDING_IMPORTS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._send_json(200, data)
        except Exception as e:
            self._send_error(500, f"Failed to read imports: {e}")

    def _handle_get_manifest(self):
        if not MANIFEST_PATH.exists():
            self._send_error(404, "Manifest not found")
            return
        try:
            with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            self._send_json(200, data)
        except Exception as e:
            self._send_error(500, f"Failed to read manifest: {e}")

    # ------------------------------------------------------------------
    # PUT
    # ------------------------------------------------------------------

    def do_PUT(self):
        self._update_activity()
        path = self.path.split("?")[0]

        if path.startswith("/api/config/"):
            name = path[len("/api/config/"):]
            self._handle_put_config(name)
        else:
            self._send_error(404, f"Not found: {path}")

    def _handle_put_config(self, name: str):
        if name not in CONFIG_NAMES:
            self._send_error(404, f"Unknown config: {name}")
            return

        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        try:
            incoming = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            self._send_error(400, f"Invalid JSON body: {e}")
            return

        if not isinstance(incoming, dict):
            self._send_error(400, "Request body must be a JSON object")
            return

        file_path = config_dir / f"{name}.yaml"
        existing = self._read_config(name)
        merged = deep_merge(existing, incoming)

        try:
            yaml_parser.dump(merged, str(file_path))
        except Exception as e:
            self._send_error(500, f"Failed to write config: {e}")
            return

        self._send_json(200, merged)

    # ------------------------------------------------------------------
    # POST
    # ------------------------------------------------------------------

    def do_POST(self):
        self._update_activity()
        path = self.path.split("?")[0]

        if path == "/api/upload":
            self._handle_upload()
        else:
            self._send_error(404, f"Not found: {path}")

    def _handle_upload(self):
        content_type = self.headers.get("Content-Type", "")
        if "multipart/form-data" not in content_type:
            self._send_error(400, "Expected multipart/form-data")
            return

        # Extract boundary
        boundary = None
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part[len("boundary="):].strip().strip('"')
                break

        if not boundary:
            self._send_error(400, "Missing multipart boundary")
            return

        length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(length)

        try:
            parts = parse_multipart(body_bytes, boundary)
        except Exception as e:
            self._send_error(400, f"Failed to parse multipart body: {e}")
            return

        saved = []
        for filename, file_bytes in parts:
            dest = IMPORTS_DIR / filename
            try:
                dest.write_bytes(file_bytes)
                saved.append({"name": filename, "path": str(dest)})
            except Exception as e:
                self._send_error(500, f"Failed to save {filename}: {e}")
                return

        # Update pending-imports.json
        try:
            if PENDING_IMPORTS_FILE.exists():
                with open(PENDING_IMPORTS_FILE, "r", encoding="utf-8") as f:
                    pending = json.load(f)
            else:
                pending = {"files": []}

            for item in saved:
                pending["files"].append(item["path"])

            with open(PENDING_IMPORTS_FILE, "w", encoding="utf-8") as f:
                json.dump(pending, f, indent=2)
        except Exception as e:
            self._send_error(500, f"Failed to update pending imports: {e}")
            return

        self._send_json(200, {"saved": saved})


# ---------------------------------------------------------------------------
# Inactivity watchdog
# ---------------------------------------------------------------------------

def _inactivity_watchdog():
    while True:
        time.sleep(INACTIVITY_CHECK_INTERVAL)
        idle = time.time() - last_request_time
        if idle >= INACTIVITY_TIMEOUT:
            print("Config UI stopped after 30 minutes of inactivity.")
            sys.stdout.flush()
            os._exit(0)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    global config_dir

    # Parse --manifest-path argument if provided
    manifest_path = MANIFEST_PATH
    args = sys.argv[1:]
    for i, arg in enumerate(args):
        if arg == "--manifest-path" and i + 1 < len(args):
            manifest_path = Path(args[i + 1])

    manifest = load_manifest(manifest_path)
    vault_path = manifest.get("vault_path", "")
    subfolder = manifest.get("subfolder", "myna")
    config_dir = Path(vault_path) / subfolder / "_system" / "config"

    ensure_dirs()

    port = find_available_port()
    pid = os.getpid()

    # Start inactivity watchdog
    watchdog = threading.Thread(target=_inactivity_watchdog, daemon=True)
    watchdog.start()

    server = HTTPServer(("localhost", port), MynaHandler)

    # Required startup lines — skill captures these
    print(f"PID:{pid}")
    print(f"URL:http://localhost:{port}")
    sys.stdout.flush()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
