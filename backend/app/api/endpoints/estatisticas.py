import numpy as np
from decimal import Decimal
from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from backend.app.services.estatistica_service import EstatisticaService
from backend.app.models.estatistica import (
    EstatisticaAnual, 
    EstatisticaCausa,
    EstatisticaTipo,
    EstatisticaHora,
    EstatisticaUF
)

router = APIRouter()
estatistica_service = EstatisticaService()

# Adicione esta função de helper
def convert_to_serializable(obj):
    """Converte tipos não serializáveis para tipos nativos do Python."""
    if isinstance(obj, np.number):
        return float(obj)
    elif isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: convert_to_serializable(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_serializable(i) for i in obj]
    elif isinstance(obj, np.ndarray):
        return convert_to_serializable(obj.tolist())
    elif hasattr(obj, "__dict__"):
        return convert_to_serializable(obj.__dict__)
    else:
        return obj

@router.get("/resumo", response_model=Dict[str, Any])
async def obter_resumo_estatisticas(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar"),
    uf: Optional[str] = Query(None, description="UF específica para filtrar")
):
    """
    Retorna um resumo com as principais estatísticas dos acidentes.
    """
    # Obter os dados do serviço
    data = await estatistica_service.get_resumo(ano, uf)
    
    # Converter para tipos serializáveis
    serializable_data = convert_to_serializable(data)
    
    return serializable_data

@router.get("/anuais", response_model=List[EstatisticaAnual])
async def obter_estatisticas_anuais(
    uf: Optional[str] = Query(None, description="UF específica para filtrar")
):
    """
    Retorna estatísticas agrupadas por ano.
    """
    return await estatistica_service.get_estatisticas_anuais(uf)

@router.get("/por-causas", response_model=List[EstatisticaCausa])
async def obter_estatisticas_por_causa(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar"),
    uf: Optional[str] = Query(None, description="UF específica para filtrar"),
    top: int = Query(10, description="Número de principais causas a retornar")
):
    """
    Retorna estatísticas agrupadas por causa de acidente.
    """
    return await estatistica_service.get_estatisticas_por_causa(ano, uf, top)

@router.get("/por-tipos", response_model=List[EstatisticaTipo])
async def obter_estatisticas_por_tipo(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar"),
    uf: Optional[str] = Query(None, description="UF específica para filtrar"),
    top: int = Query(10, description="Número de principais tipos a retornar")
):
    """
    Retorna estatísticas agrupadas por tipo de acidente.
    """
    return await estatistica_service.get_estatisticas_por_tipo(ano, uf, top)

@router.get("/por-horas", response_model=List[EstatisticaHora])
async def obter_estatisticas_por_hora(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar"),
    uf: Optional[str] = Query(None, description="UF específica para filtrar"),
    condicao_metereologica: Optional[str] = Query(None, description="Condição meteorológica específica")
):
    """
    Retorna estatísticas agrupadas por hora do dia.
    """
    return await estatistica_service.get_estatisticas_por_hora(ano, uf, condicao_metereologica)

@router.get("/por-ufs", response_model=List[EstatisticaUF])
async def obter_estatisticas_por_uf(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar")
):
    """
    Retorna estatísticas agrupadas por UF.
    """
    return await estatistica_service.get_estatisticas_por_uf(ano)

@router.get("/periodos-dia", response_model=Dict[str, Any])
async def obter_estatisticas_por_periodo_dia(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar"),
    uf: Optional[str] = Query(None, description="UF específica para filtrar")
):
    """
    Retorna estatísticas agrupadas por período do dia (manhã, tarde, noite, madrugada).
    """
    return await estatistica_service.get_estatisticas_por_periodo_dia(ano, uf)

@router.get("/dias-semana", response_model=Dict[str, Any])
async def obter_estatisticas_por_dia_semana(
    ano: Optional[int] = Query(None, description="Ano específico para filtrar"),
    uf: Optional[str] = Query(None, description="UF específica para filtrar")
):
    """
    Retorna estatísticas agrupadas por dia da semana.
    """
    return await estatistica_service.get_estatisticas_por_dia_semana(ano, uf)