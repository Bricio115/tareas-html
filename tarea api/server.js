// Servidor Node sin dependencias: sirve /public y hace de proxy hacia la API NHTSA vPIC
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3456;
const API = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const PUBLIC = path.join(__dirname, 'public');
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // /api/<ruta> -> https://vpic.nhtsa.dot.gov/api/vehicles/<ruta>?format=json
  if (url.pathname.startsWith('/api/')) {
    try {
      const r = await fetch(`${API}/${url.pathname.slice(5)}?format=json`);
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(await r.text());
    } catch {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No se pudo consultar la API' }));
    }
    return;
  }

  const nombre = url.pathname === '/' ? 'index.html' : url.pathname;
  const archivo = path.join(PUBLIC, path.normalize(nombre));
  if (!archivo.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(archivo, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('No encontrado');
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  const direccion = `http://localhost:${PORT}`;
  console.log(`Portal listo en ${direccion}`);
  // Abre el portal en Google Chrome (Windows)
  exec(`start chrome ${direccion}`);
});
