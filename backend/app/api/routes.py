from fastapi import APIRouter
from app.api.endpoints import acidentes, estatisticas, mapas, previsao

api_router = APIRouter()

api_router.include_router(acidentes.router, prefix="/acidentes", tags=["acidentes"])
api_router.include_router(estatisticas.router, prefix="/estatisticas", tags=["estatisticas"])
api_router.include_router(mapas.router, prefix="/mapas", tags=["mapas"])
api_router.include_router(previsao.router, prefix="/previsao", tags=["previsao"])