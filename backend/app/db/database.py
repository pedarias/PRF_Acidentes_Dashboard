from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Criar engine do SQLAlchemy conectando com PostgreSQL
engine = create_engine(settings.DATABASE_URL)

# Criar uma classe de sessão local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Criar base para modelos declarativos
Base = declarative_base()

# Dependência para obter a sessão de banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()