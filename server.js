const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HOST = '127.0.0.1';

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    console.log(`[REQ] ${req.url}`);

    let filePath = '.' + req.url;
    let contentType = 'text/html';

    // Handle virtual routes
    if (req.url.startsWith('/app/') || req.url === '/' || req.url === '/index.html') {
        filePath = './index.html';
    } else {
        // Prevent directory traversal for actual files
        filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
        const extname = String(path.extname(filePath)).toLowerCase();
        contentType = MIME_TYPES[extname] || 'application/octet-stream';
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Error: ' + error.code + '\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Server running perfectly!`);
    console.log(`👉 Open this URL in your browser:`);
    console.log(`   http://${HOST}:${PORT}`);
    console.log(`========================================\n`);
});
