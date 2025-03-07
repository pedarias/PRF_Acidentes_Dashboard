# Imagem base para Python
FROM python:3.12-slim

# Define diretório de trabalho
WORKDIR /app

# Instala dependências necessárias para compilação
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copia arquivos de dependências para o container
COPY requirements.txt .

# Instala dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação para o container
COPY . .

# Expõe a porta do backend
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]