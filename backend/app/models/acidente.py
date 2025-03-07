from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class AcidenteFilter(BaseModel):
    """Modelo para os filtros de acidente."""
    uf: Optional[str] = None
    ano: Optional[int] = None
    br: Optional[str] = None
    municipio: Optional[str] = None
    causa_acidente: Optional[str] = None
    tipo_acidente: Optional[str] = None
    classificacao_acidente: Optional[str] = None
    condicao_metereologica: Optional[str] = None
    tipo_pista: Optional[str] = None
    tracado_via: Optional[str] = None
    uso_solo: Optional[str] = None

class Acidente(BaseModel):
    """Modelo completo de um acidente."""
    id: Optional[int] = None
    data_inversa: datetime
    dia_semana: str
    horario: str
    uf: str
    br: str
    km: float
    municipio: str
    causa_acidente: str
    tipo_acidente: str
    classificacao_acidente: str
    sentido_via: str
    condicao_metereologica: str
    tipo_pista: str
    tracado_via: str
    uso_solo: str
    pessoas: int
    mortos: int
    feridos_leves: int
    feridos_graves: int
    ilesos: int
    ignorados: int
    feridos: int
    veiculos: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        from_attributes = True

class AcidenteResponse(BaseModel):
    """Modelo de resposta para um acidente (versão simplificada)."""
    id: Optional[int] = None
    data: str = Field(..., description="Data do acidente no formato YYYY-MM-DD")
    dia_semana: str = Field(..., description="Dia da semana do acidente")
    hora: str = Field(..., description="Hora do acidente no formato HH:MM")
    uf: str = Field(..., description="UF onde ocorreu o acidente")
    br: str = Field(..., description="Rodovia BR onde ocorreu o acidente")
    km: float = Field(..., description="Quilômetro da rodovia")
    municipio: str = Field(..., description="Município onde ocorreu o acidente")
    causa_acidente: str = Field(..., description="Causa do acidente")
    tipo_acidente: str = Field(..., description="Tipo de acidente")
    classificacao_acidente: str = Field(..., description="Classificação do acidente")
    condicao_metereologica: str = Field(..., description="Condição meteorológica no momento do acidente")
    mortos: int = Field(..., description="Número de mortos no acidente")
    feridos: int = Field(..., description="Número total de feridos no acidente")
    veiculos: int = Field(..., description="Número de veículos envolvidos")
    latitude: Optional[float] = Field(None, description="Latitude do local do acidente")
    longitude: Optional[float] = Field(None, description="Longitude do local do acidente")
    
    class Config:
        from_attributes = True