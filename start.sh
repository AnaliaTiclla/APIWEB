#!/bin/bash

echo "Iniciando Spring Boot..."
export SPRING_BOOT_HOST=127.0.0.1
export SPRING_BOOT_PORT=8080

java -Dserver.address=127.0.0.1 -Dserver.port=8080 -jar target/api-productos-1.0-SNAPSHOT.jar > spring.log 2>&1 &
SPRING_PID=$!

echo "Esperando a que Spring Boot inicie..."
COUNTER=0
MAX_TRIES=60

while [ $COUNTER -lt $MAX_TRIES ]
do
    if curl -s http://127.0.0.1:8080/actuator/health > /dev/null; then
        echo "Spring Boot está listo!"
        break
    fi
    echo "Esperando que Spring Boot esté listo... ($COUNTER/$MAX_TRIES)"
    COUNTER=$((COUNTER+1))
    sleep 2
done

if [ $COUNTER -eq $MAX_TRIES ]; then
    echo "Spring Boot no pudo iniciar. Mostrando logs:"
    cat spring.log
    exit 1
fi

echo "Spring Boot está listo. Iniciando Node.js..."
exec node server.js 