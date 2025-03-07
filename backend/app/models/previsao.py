from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date

class PrevisaoRisco(BaseModel):
    """Modelo para previsão de risco por trecho de rodovia."""
    uf: str = Field(..., description="Estado (UF)")
    br: str = Field(..., description="Rodovia BR")
    km_inicial: float = Field(..., description="Quilômetro inicial do trecho")
    km_final: float = Field(..., description="Quilômetro final do trecho")
    nivel_risco: str = Field(..., description="Nível de risco (baixo, médio, alto, muito alto)")
    probabilidade_acidente: float = Field(..., description="Probabilidade de ocorrência de acidente (%)")
    probabilidade_acidente_fatal: float = Field(..., description="Probabilidade de acidente fatal (%)")
    fatores_risco: List[str] = Field(..., description="Principais fatores de risco neste trecho")
    recomendacoes: List[str] = Field(..., description="Recomendações para reduzir o risco")

class CalculadoraRiscoInput(BaseModel):
    """Modelo para entrada de dados na calculadora de risco personalizado."""
    rodovia_br: str = Field(..., description="Rodovia BR planejada")
    uf: str = Field(..., description="Estado (UF) da viagem")
    dia_semana: str = Field(..., description="Dia da semana planejado")
    horario: str = Field(..., description="Horário planejado (formato HH:MM)")
    periodo_viagem: str = Field(..., description="Período da viagem (diurno/noturno)")
    duracao_estimada: float = Field(..., description="Duração estimada em horas")
    condicao_metereologica: Optional[str] = Field(None, description="Condição meteorológica prevista")
    perfil_condutor: Optional[str] = Field(None, description="Perfil do condutor (experiente, iniciante, etc.)")
    tipo_veiculo: Optional[str] = Field(None, description="Tipo de veículo")
    carga: Optional[bool] = Field(None, description="Transportará carga?")
    velocidade_media: Optional[int] = Field(None, description="Velocidade média planejada (km/h)")
    passageiros: Optional[int] = Field(None, description="Número de passageiros")
    km_inicial: Optional[float] = Field(None, description="Quilômetro inicial")
    km_final: Optional[float] = Field(None, description="Quilômetro final")

class PrevisaoTendencia(BaseModel):
    """Modelo para previsão de tendências de acidentes."""
    data_referencia: date = Field(..., description="Data de referência da previsão")
    valor_previsto: float = Field(..., description="Valor previsto (acidentes ou mortes)")
    intervalo_confianca_inferior: float = Field(..., description="Limite inferior do intervalo de confiança")
    intervalo_confianca_superior: float = Field(..., description="Limite superior do intervalo de confiança")
    tipo_previsao: str = Field(..., description="Tipo de previsão (acidentes, mortes)")
    unidade_geografica: str = Field(..., description="Unidade geográfica da previsão (Brasil, UF, etc.)")
    fatores_considerados: List[str] = Field(..., description="Fatores considerados na previsão")

class FatorRisco(BaseModel):
    """Modelo para um fator de risco."""
    nome: str = Field(..., description="Nome do fator de risco")
    descricao: str = Field(..., description="Descrição do fator de risco")
    impacto: float = Field(..., description="Impacto do fator na probabilidade de acidente (0-1)")
    recomendacoes: List[str] = Field(..., description="Recomendações para mitigar o risco")