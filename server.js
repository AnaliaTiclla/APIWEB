const express = require('express');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;
const springBootHost = process.env.SPRING_BOOT_HOST || '127.0.0.1';
const springBootPort = process.env.SPRING_BOOT_PORT || 8080;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'UP' });
});

app.get('/test', (req, res) => {
    res.json({ message: 'Servidor Node.js funcionando' });
});

app.all('*', (req, res) => {
    const filteredHeaders = { ...req.headers };
    delete filteredHeaders['host'];
    delete filteredHeaders['connection'];
    delete filteredHeaders['content-length'];

    const options = {
        hostname: springBootHost,
        port: springBootPort,
        path: req.url,
        method: req.method,
        headers: {
            ...filteredHeaders,
            'Content-Type': 'application/json'
        }
    };

    console.log(`Proxy request to: ${springBootHost}:${springBootPort}${req.url}`);

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
        console.error('Error en la proxy:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: `No se pudo conectar a Spring Boot en ${springBootHost}:${springBootPort}` 
        });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.write(bodyData);
    }

    proxyReq.end();
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor Node.js corriendo en http://0.0.0.0:${port}`);
}); 