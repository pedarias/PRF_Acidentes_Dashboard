#!/bin/bash

# Script para implantação do PRF Acidentes Dashboard
# Uso: ./deploy.sh [dev|prod] [--init-db]

# Verificar argumentos
ENV=${1:-dev}
INIT_DB=false

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
  echo "Uso: ./deploy.sh [dev|prod] [--init-db]"
  exit 1
fi

# Verificar se há argumento para inicializar o banco de dados
if [ "$2" = "--init-db" ]; then
  INIT_DB=true
fi

echo "Iniciando implantação para ambiente: $ENV"
if [ "$INIT_DB" = true ]; then
  echo "Com inicialização do banco de dados"
fi

# Configurar variáveis de ambiente com base no ambiente selecionado
if [ "$ENV" = "prod" ]; then
  export ENVIRONMENT=production
  export NEXT_PUBLIC_API_URL=http://api.prf-acidentes.com/api/v1
else
  export ENVIRONMENT=development
  export NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
fi

# Parar e remover contêineres antigos, se existirem
echo "Parando contêineres antigos..."
docker-compose down

# Construir novas imagens
echo "Construindo novas imagens..."
docker-compose build

# Iniciar os serviços
echo "Iniciando os serviços..."
if [ "$INIT_DB" = true ]; then
  # Se --init-db foi especificado, execute o comando com a inicialização do banco
  docker-compose up -d
  
  echo "Inicializando o banco de dados..."
  # Aguardar o banco de dados estar pronto
  sleep 10
  docker-compose exec backend python run.py --init-db
else
  docker-compose up -d
fi

# Verificar status dos serviços
echo "Verificando status dos serviços..."
docker-compose ps

# Exibir logs iniciais
echo "Logs do backend:"
docker-compose logs --tail=20 backend

echo "Logs do frontend:"
docker-compose logs --tail=20 frontend

echo "Implantação concluída! Acesse:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"

# Informações adicionais
if [ "$ENV" = "dev" ]; then
  echo ""
  echo "Para desenvolvimento:"
  echo "- Arquivo de log do backend: docker-compose logs -f backend"
  echo "- Arquivo de log do frontend: docker-compose logs -f frontend"
  echo "- Para reiniciar os serviços: docker-compose restart"
  echo "- Para parar os serviços: docker-compose down"
fi