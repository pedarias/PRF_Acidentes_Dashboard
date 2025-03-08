# Imagem base
FROM python:3.10-slim

# Define diretório de trabalho
WORKDIR /app

# Instala dependências necessárias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia arquivos de dependências
COPY requirements.txt .

# Instala dependências Python
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Expõe a porta do backend
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["python", "backend/app/main.py"]