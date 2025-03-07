from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class EstatisticaAnual(BaseModel):
    """Modelo para estatísticas anuais."""
    ano: int = Field(..., description="Ano de referência")
    total_acidentes: int = Field(..., description="Total de acidentes no ano")
    total_mortos: int = Field(..., description="Total de mortos no ano")
    total_feridos: int = Field(..., description="Total de feridos no ano")
    media_mortos_por_acidente: float = Field(..., description="Média de mortos por acidente")
    variacao_percentual: Optional[float] = Field(None, description="Variação percentual em relação ao ano anterior")

class EstatisticaCausa(BaseModel):
    """Modelo para estatísticas por causa de acidente."""
    causa: str = Field(..., description="Causa do acidente")
    total_acidentes: int = Field(..., description="Total de acidentes por esta causa")
    total_mortos: int = Field(..., description="Total de mortos em acidentes por esta causa")
    media_mortos: float = Field(..., description="Média de mortos por acidente desta causa")
    percentual: float = Field(..., description="Percentual de acidentes por esta causa")

class EstatisticaTipo(BaseModel):
    """Modelo para estatísticas por tipo de acidente."""
    tipo: str = Field(..., description="Tipo de acidente")
    total_acidentes: int = Field(..., description="Total de acidentes deste tipo")
    total_mortos: int = Field(..., description="Total de mortos em acidentes deste tipo")
    media_mortos: float = Field(..., description="Média de mortos por acidente deste tipo")
    percentual: float = Field(..., description="Percentual de acidentes deste tipo")

class EstatisticaHora(BaseModel):
    """Modelo para estatísticas por hora do dia."""
    hora: int = Field(..., description="Hora do dia (0-23)")
    total_acidentes: int = Field(..., description="Total de acidentes nesta hora")
    total_mortos: int = Field(..., description="Total de mortos em acidentes nesta hora")
    condicao_metereologica: Optional[str] = Field(None, description="Condição meteorológica")
    percentual: float = Field(..., description="Percentual de acidentes nesta hora")

class EstatisticaUF(BaseModel):
    """Modelo para estatísticas por UF."""
    uf: str = Field(..., description="Sigla do estado")
    total_acidentes: int = Field(..., description="Total de acidentes neste estado")
    total_mortos: int = Field(..., description="Total de mortos em acidentes neste estado")
    media_mortos: float = Field(..., description="Média de mortos por acidente neste estado")
    rodovia_mais_perigosa: str = Field(..., description="Rodovia com mais acidentes/mortes no estado")
    acidentes_por_100k_habitantes: Optional[float] = Field(None, description="Taxa de acidentes por 100 mil habitantes")

class EstatisticaPeriodoDia(BaseModel):
    """Modelo para estatísticas por período do dia."""
    periodo: str = Field(..., description="Período do dia (manhã, tarde, noite, madrugada)")
    total_acidentes: int = Field(..., description="Total de acidentes neste período")
    total_mortos: int = Field(..., description="Total de mortos em acidentes neste período")
    media_mortos: float = Field(..., description="Média de mortos por acidente neste período")
    percentual: float = Field(..., description="Percentual de acidentes neste período")

class EstatisticaDiaSemana(BaseModel):
    """Modelo para estatísticas por dia da semana."""
    dia: str = Field(..., description="Dia da semana")
    total_acidentes: int = Field(..., description="Total de acidentes neste dia")
    total_mortos: int = Field(..., description="Total de mortos em acidentes neste dia")
    media_mortos: float = Field(..., description="Média de mortos por acidente neste dia")
    percentual: float = Field(..., description="Percentual de acidentes neste dia")
    tipo_dia: str = Field(..., description="Tipo de dia (útil ou fim de semana)")