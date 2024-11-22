FROM maven:3.8-openjdk-11-slim

# Instalar Node.js y herramientas necesarias
RUN apt-get update && \
    apt-get install -y curl netcat procps && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias de Node.js
RUN npm install

# Compilar el proyecto Maven
RUN mvn clean package -DskipTests

# Exponer puertos
EXPOSE 8080
EXPOSE 3000

# Copiar y configurar script de inicio
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Comando para iniciar
CMD ["/app/start.sh"]