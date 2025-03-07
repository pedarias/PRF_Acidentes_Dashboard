# Estágio de build
FROM node:18-alpine AS build

# Define diretório de trabalho
WORKDIR /app

# Copia package.json e package-lock.json (ou yarn.lock)
COPY package*.json ./

# Instala dependências
RUN npm ci

# Copia o restante dos arquivos do projeto
COPY . .

# Constrói a aplicação para produção
RUN npm run build

# Estágio de produção
FROM node:18-alpine AS production

# Define diretório de trabalho
WORKDIR /app

# Define variáveis de ambiente para produção
ENV NODE_ENV=production

# Copia package.json e package-lock.json (ou yarn.lock)
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --only=production

# Copia os arquivos de build do estágio anterior
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./

# Expõe a porta 3000
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["npm", "start"]