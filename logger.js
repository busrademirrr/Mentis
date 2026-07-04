const http = require('http');

const server = http.createServer((req, res) => {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            console.log('\n--- BROWSER LOG INTERCEPTED ---');
            console.log(body);
            console.log('-------------------------------\n');
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(9999, () => {
    console.log('Logger listening on http://localhost:9999');
});
