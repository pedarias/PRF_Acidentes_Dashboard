from fastapi import APIRouter, Depends, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from backend.app.services.mapa_service import MapaService
from backend.app.models.ponto_mapa import PontoMapa, ClusterMapa, TrechoPerigoso
from backend.app.db.database import get_db

router = APIRouter()

@router.get("/pontos", response_model=List[PontoMapa])
async def obter_pontos_acidentes(
    db: Session = Depends(get_db),
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    ano: Optional[int] = Query(None, description="Ano dos acidentes"),
    br: Optional[str] = Query(None, description="Rodovia BR"),
    tipo_acidente: Optional[str] = Query(None, description="Tipo de acidente"),
    classificacao: Optional[str] = Query(None, description="Classificação do acidente"),
    limit: int = Query(1000, description="Limite de resultados"),
):
    """
    Retorna pontos de acidentes para visualização no mapa.
    """
    return await MapaService.get_pontos_acidentes(db, uf, ano, br, tipo_acidente, classificacao, limit)

@router.get("/clusters", response_model=List[ClusterMapa])
async def obter_clusters_acidentes(
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    ano: Optional[int] = Query(None, description="Ano dos acidentes"),
    zoom_level: int = Query(10, description="Nível de zoom do mapa (1-18)"),
):
    """
    Retorna clusters de acidentes para visualização no mapa em diferentes níveis de zoom.
    """
    return await mapa_service.get_clusters_acidentes(uf, ano, zoom_level)

@router.get("/trechos-perigosos", response_model=List[TrechoPerigoso])
async def obter_trechos_perigosos(
    db: Session = Depends(get_db),
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    ano: Optional[int] = Query(None, description="Ano dos acidentes"),
    br: Optional[str] = Query(None, description="Rodovia BR"),
    top: int = Query(10, description="Número de trechos perigosos a retornar"),
):
    """
    Retorna os trechos mais perigosos com base na concentração de acidentes.
    """
    return await MapaService.get_trechos_perigosos(db, uf, ano, br, top)

@router.get("/heatmap", response_model=Dict[str, Any])
async def obter_dados_heatmap(
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    ano: Optional[int] = Query(None, description="Ano dos acidentes"),
    tipo_acidente: Optional[str] = Query(None, description="Tipo de acidente"),
):
    """
    Retorna dados para geração de mapa de calor de concentração de acidentes.
    """
    return await mapa_service.get_heatmap_data(uf, ano, tipo_acidente)

@router.get("/ufs-geojson", response_model=Dict[str, Any])
async def obter_geojson_ufs():
    """
    Retorna o GeoJSON com os limites dos estados brasileiros.
    """
    return await MapaService.get_ufs_geojson()

@router.get("/rodovias-geojson", response_model=Dict[str, Any])
async def obter_geojson_rodovias(
    uf: Optional[str] = Query(None, description="Estado (UF)")
):
    """
    Retorna o GeoJSON com as rodovias federais.
    """
    return await MapaService.get_rodovias_geojson(uf)