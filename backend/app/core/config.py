import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env se existir
load_dotenv()

class Settings(BaseSettings):
    # Configurações gerais
    PROJECT_NAME: str = "Painel de Acidentes de Trânsito no Brasil"
    API_V1_STR: str = "/api/v1"
    
    # Configurações de CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend Next.js
        "http://localhost:8501",  # Streamlit (para desenvolvimento)
        "http://localhost:8000",  # Backend FastAPI
    ]
    
    # Configurações de banco de dados
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/acidentes")
    
    # Configurações do OpenAPI
    OPENAPI_URL: str = "/api/v1/openapi.json"
    
    # Configurações de segurança
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sua_chave_secreta_padrao")  # Deve ser substituída em produção
    
    # Configurações de caching
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Configurações de pasta de dados
    DATA_DIR: str = os.getenv("DATA_DIR", "/home/hub/Desktop/ccode/PRF_Acidentes_Dashboard/data/raw")

    class Config:
        case_sensitive = True


settings = Settings()