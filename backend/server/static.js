const fs = require('fs');
const path = require('path');

//url prefix -> folder on disk, first match wins
const MOUNTS = [
  {
    prefix: '/framework/',
    root: path.resolve(__dirname, '../../frontend/mini-framework/framework'),
  },
  {
    prefix: '/',
    root: path.resolve(__dirname, '../../frontend'),
  },
];

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

//map a request path onto a file inside one of the mounted folders, null when it escapes
function resolveFile(urlPath) {
  const pathname = decodeURIComponent(urlPath.split('?')[0]);

  for (const mount of MOUNTS) {
    if (!pathname.startsWith(mount.prefix)) continue;

    const relative = pathname.slice(mount.prefix.length) || 'index.html';
    const filePath = path.resolve(mount.root, relative);

    if (filePath !== mount.root && !filePath.startsWith(mount.root + path.sep)) {
      return null;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }

    return null;
  }

  return null;
}

//serve the frontend (and the mini-framework it imports) on the same http server
//the websocket upgrade uses
function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();

    return true;
  }

  const filePath = resolveFile(req.url || '/');

  if (!filePath) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');

    return true;
  }

  const body = fs.readFileSync(filePath);

  res.writeHead(200, {
    'Content-Type': CONTENT_TYPES[path.extname(filePath)] || 'application/octet-stream',
    'Content-Length': body.length,
  });
  res.end(req.method === 'HEAD' ? undefined : body);

  return true;
}

module.exports = {
  serveStatic,
};
