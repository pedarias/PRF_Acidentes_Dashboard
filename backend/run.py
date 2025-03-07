import uvicorn
import argparse
import logging
from app.db.init_db import init_db

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Inicia o servidor backend com inicialização opcional do banco de dados')
    parser.add_argument('--init-db', action='store_true', help='Inicializar o banco de dados antes de iniciar o servidor')
    args = parser.parse_args()
    
    if args.init_db:
        logger.info("Inicializando o banco de dados...")
        init_db()
        logger.info("Banco de dados inicializado com sucesso!")
    
    logger.info("Iniciando o servidor API...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)