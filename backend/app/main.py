from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
# Fix import paths for local running
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from backend.app.api.routes import api_router
from backend.app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API para o Painel de Acidentes de Trânsito no Brasil",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir as rotas da API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Montar arquivos estáticos (se necessário)
import os
static_directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
app.mount("/static", StaticFiles(directory=static_directory), name="static")

@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do Painel de Acidentes de Trânsito no Brasil"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)