python3 - <<'PY'
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = os.getcwd()
PORT = 3000

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        # real file? serve it like python -m http.server does
        if not os.path.exists(self.translate_path(self.path)):
            name = os.path.basename(urlsplit(self.path).path.rstrip('/'))
            # unknown page path (no file extension):
            # 204 makes the browser discard the path change and keep the page
            if '.' not in name:
                self.send_response(204)
                self.end_headers()
                return None
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

print('Frontend with path-trap on http://localhost:3000')
ThreadingHTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
PY
