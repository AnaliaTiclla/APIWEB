const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const app = express();
const port = process.env.NODE_PORT || 3000;
const springBootPort = process.env.SPRING_PORT || 8080;

const MAX_RETRIES = 5;
const RETRY_DELAY = 2000;

app.use(express.json());

function waitForSpringBoot(retries = 0) {
    return new Promise((resolve, reject) => {
        const checkConnection = http.request({
            hostname: 'localhost',
            port: springBootPort,
            path: '/actuator/health',
            method: 'GET'
        }, (res) => {
            resolve(true);
        });

        checkConnection.on('error', (err) => {
            if (retries < MAX_RETRIES) {
                console.log(`Esperando a que Spring Boot inicie... (intento ${retries + 1})`);
                setTimeout(() => {
                    waitForSpringBoot(retries + 1).then(resolve).catch(reject);
                }, RETRY_DELAY);
            } else {
                reject(new Error('No se pudo conectar a Spring Boot'));
            }
        });

        checkConnection.end();
    });
}

async function startSpringBoot() {
    try {
        console.log('Verificando Maven...');
        
        // Verificar si el JAR existe antes de compilar
        if (!fs.existsSync('target/api-productos-1.0-SNAPSHOT.jar')) {
            console.log('Compilando proyecto con Maven...');
            await new Promise((resolve, reject) => {
                exec('mvn clean package -DskipTests', { cwd: process.cwd() }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error al compilar con Maven:', error);
                        reject(error);
                        return;
                    }
                    console.log('Compilación Maven exitosa');
                    resolve();
                });
            });
        }

        // Iniciar Spring Boot con más logs
        console.log('Iniciando aplicación Spring Boot...');
        const springProcess = spawn('java', [
            '-jar',
            'target/api-productos-1.0-SNAPSHOT.jar',
            '--debug'  // Agregar modo debug
        ], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        springProcess.stdout.on('data', (data) => {
            console.log(`Spring Boot: ${data}`);
        });

        springProcess.stderr.on('data', (data) => {
            console.error(`Spring Boot Error: ${data}`);
        });

        springProcess.on('error', (error) => {
            console.error('Error al iniciar Spring Boot:', error);
        });

        springProcess.on('exit', (code) => {
            console.log(`Spring Boot proceso terminó con código: ${code}`);
        });

        // Aumentar el tiempo de espera y los reintentos
        const RETRY_DELAY = 5000; // 5 segundos
        const MAX_RETRIES = 10;   // 10 intentos

        await waitForSpringBoot();
        console.log('Spring Boot está listo');
        
    } catch (error) {
        console.error('Error crítico al iniciar Spring Boot:', error);
        process.exit(1);  // Terminar el proceso si hay un error crítico
    }
}

startSpringBoot();

app.get('/test', (req, res) => {
    res.json({ message: 'Servidor Node.js funcionando' });
});

app.all('*', (req, res) => {
    const options = {
        hostname: 'localhost',
        port: springBootPort,
        path: req.url,
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
            ...req.headers
        }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
        console.error('Error en la proxy:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            details: error.message 
        });
    });

    if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(JSON.stringify(req.body));
    }

    proxyReq.end();
});

app.listen(port, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${port}`);
}); 