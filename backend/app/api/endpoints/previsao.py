from fastapi import APIRouter, Query, Body
from typing import List, Optional, Dict, Any
from backend.app.services.previsao_service import PrevisaoService
from backend.app.models.previsao import PrevisaoRisco, CalculadoraRiscoInput, PrevisaoTendencia

router = APIRouter()
previsao_service = PrevisaoService()

@router.get("/risco-rodovia", response_model=List[PrevisaoRisco])
async def obter_previsao_risco_rodovia(
    uf: str = Query(..., description="Estado (UF)"),
    br: str = Query(..., description="Rodovia BR"),
    dia_semana: Optional[str] = Query(None, description="Dia da semana"),
    periodo_dia: Optional[str] = Query(None, description="Período do dia"),
    condicao_metereologica: Optional[str] = Query(None, description="Condição meteorológica")
):
    """
    Retorna a previsão de risco para uma rodovia específica.
    """
    return await previsao_service.prever_risco_rodovia(uf, br, dia_semana, periodo_dia, condicao_metereologica)

@router.post("/calculadora-risco", response_model=Dict[str, Any])
async def calcular_risco_personalizado(
    dados: CalculadoraRiscoInput = Body(...)
):
    """
    Calcula o risco personalizado com base nos dados fornecidos pelo usuário.
    """
    return await previsao_service.calcular_risco_personalizado(dados)

@router.get("/tendencias", response_model=List[PrevisaoTendencia])
async def obter_tendencias_acidentes(
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    br: Optional[str] = Query(None, description="Rodovia BR"),
    tipo_acidente: Optional[str] = Query(None, description="Tipo de acidente"),
    meses_futuros: int = Query(12, description="Número de meses para previsão futura")
):
    """
    Retorna a previsão de tendências de acidentes para os próximos meses.
    """
    return await previsao_service.prever_tendencias(uf, br, tipo_acidente, meses_futuros)

@router.get("/fatores-risco", response_model=Dict[str, Any])
async def obter_fatores_risco():
    """
    Retorna informações sobre os principais fatores de risco analisados pelo modelo.
    """
    return await previsao_service.get_fatores_risco()

@router.get("/recomendacoes", response_model=Dict[str, List[str]])
async def obter_recomendacoes_seguranca(
    perfil: Optional[str] = Query(None, description="Perfil do usuário: motorista, motociclista, pedestre")
):
    """
    Retorna recomendações de segurança com base no perfil e análise de dados.
    """
    return await previsao_service.get_recomendacoes_seguranca(perfil)