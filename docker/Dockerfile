FROM mongo:latest
 
# Configuración de directorio de datos
RUN mkdir -p /data/db
 
# Copiar script de inicialización
COPY init-mongo.js /docker-entrypoint-initdb.d/
 
# Exponer el puerto estándar de MongoDB
EXPOSE 27017
 
# Comando para iniciar MongoDB
CMD ["mongod"]