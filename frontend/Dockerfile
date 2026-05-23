FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dependances
COPY package.json package-lock.json* ./

# Installer les dependances
RUN npm install

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Commande de demarrage (mode developpement)
CMD ["npm", "run", "dev", "--", "--host"]
