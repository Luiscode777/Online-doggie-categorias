# Usamos una versión ligera de Node
FROM node:20-alpine

# Creamos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalamos la herramienta 'serve' de forma global
RUN npm install -g serve

# Copiamos todos los archivos del frontend al contenedor
COPY . .

# Le avisamos a Railway que use el puerto 3000
EXPOSE 3000

# Arrancamos el servidor apuntando al puerto 3000
CMD ["serve", "-l", "3000", "frontend"]