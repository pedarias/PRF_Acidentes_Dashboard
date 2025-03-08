import uvicorn
import argparse
import logging
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.db.init_db import init_db

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Inicia o servidor backend com inicialização opcional do banco de dados')
    parser.add_argument('--init-db', action='store_true', help='Inicializar o banco de dados antes de iniciar o servidor')
    args = parser.parse_args()
    
    try:
        # Sempre inicializar o banco de dados no ambiente Docker
        logger.info("Inicializando o banco de dados...")
        init_db()
        logger.info("Banco de dados inicializado com sucesso!")
    except Exception as e:
        logger.error(f"Erro ao inicializar o banco de dados: {e}")
        logger.info("Continuando inicialização do servidor...")
    
    logger.info("Iniciando o servidor API...")
    # Desativar hot reload no ambiente de produção
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=False)