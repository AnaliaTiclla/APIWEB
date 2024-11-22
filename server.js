const express = require('express');
const { exec, spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

const app = express();
const port = process.env.NODE_PORT || 3000;
const springBootPort = process.env.SPRING_PORT || 8080;

const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

app.use(express.json());

function waitForSpringBoot(retries = 0) {
    return new Promise((resolve, reject) => {
        console.log(`Intento ${retries + 1} de ${MAX_RETRIES} para conectar con Spring Boot...`);
        
        // Probar múltiples endpoints
        const endpoints = ['/', '/health', '/productos'];
        let successfulEndpoint = false;

        Promise.all(endpoints.map(endpoint => {
            return new Promise((endpointResolve) => {
                const checkConnection = http.request({
                    hostname: 'localhost',
                    port: springBootPort,
                    path: endpoint,
                    method: 'GET',
                    timeout: 5000
                }, (res) => {
                    console.log(`Spring Boot respondió en ${endpoint} con status: ${res.statusCode}`);
                    if (res.statusCode === 200) {
                        successfulEndpoint = true;
                    }
                    endpointResolve();
                });

                checkConnection.on('error', () => {
                    console.log(`Error al intentar conectar con ${endpoint}`);
                    endpointResolve();
                });

                checkConnection.end();
            });
        })).then(() => {
            if (successfulEndpoint) {
                resolve(true);
            } else if (retries < MAX_RETRIES) {
                setTimeout(() => {
                    waitForSpringBoot(retries + 1).then(resolve).catch(reject);
                }, RETRY_DELAY);
            } else {
                reject(new Error('No se pudo conectar a Spring Boot después de múltiples intentos'));
            }
        });
    });
}

async function startSpringBoot() {
    try {
        // Encontrar la ruta de Java
        const javaHome = process.env.JAVA_HOME;
        const javaPath = javaHome 
            ? path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')
            : process.platform === 'win32' ? 'java.exe' : '/usr/bin/java';

        console.log(`Usando Java en: ${javaPath}`);

        // Verificar que Java existe
        if (!fs.existsSync(javaPath)) {
            throw new Error(`No se encontró Java en: ${javaPath}`);
        }

        console.log('Verificando Maven y el archivo JAR...');
        const jarPath = 'target/api-productos-1.0-SNAPSHOT.jar';
        
        // Verificar si el JAR existe
        if (!fs.existsSync(jarPath)) {
            console.log('El archivo JAR no existe, compilando con Maven...');
            await new Promise((resolve, reject) => {
                const mvn = exec('mvn clean package', { 
                    cwd: process.cwd(),
                    stdio: 'inherit'
                });

                mvn.stdout?.pipe(process.stdout);
                mvn.stderr?.pipe(process.stderr);

                mvn.on('exit', (code) => {
                    if (code === 0) {
                        console.log('Compilación Maven exitosa');
                        resolve();
                    } else {
                        reject(new Error(`Maven falló con código: ${code}`));
                    }
                });
            });
        }

        // Verificar que el JAR existe después de compilar
        if (!fs.existsSync(jarPath)) {
            throw new Error(`No se encontró el archivo JAR en: ${jarPath}`);
        }

        console.log('Iniciando Spring Boot...');
        const springProcess = spawn(javaPath, [
            '-jar',
            jarPath
        ], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Capturar salida
        springProcess.stdout.on('data', (data) => {
            console.log(`Spring Boot: ${data.toString()}`);
        });

        springProcess.stderr.on('data', (data) => {
            console.error(`Spring Boot Error: ${data.toString()}`);
        });

        // Esperar a que Spring Boot inicie
        await new Promise((resolve) => setTimeout(resolve, 15000));

        await waitForSpringBoot();
        console.log('Spring Boot está listo y respondiendo');
        
    } catch (error) {
        console.error('Error crítico al iniciar Spring Boot:', error);
        process.exit(1);
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