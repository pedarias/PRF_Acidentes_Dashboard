from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Tuple

class PontoMapa(BaseModel):
    """Modelo para um ponto no mapa (acidente)."""
    id: int = Field(..., description="ID do acidente")
    latitude: float = Field(..., description="Latitude do ponto")
    longitude: float = Field(..., description="Longitude do ponto")
    data: str = Field(..., description="Data do acidente")
    hora: str = Field(..., description="Hora do acidente")
    br: str = Field(..., description="Rodovia BR")
    km: float = Field(..., description="Quilômetro da rodovia")
    uf: str = Field(..., description="Estado (UF)")
    municipio: str = Field(..., description="Município")
    tipo_acidente: str = Field(..., description="Tipo de acidente")
    causa_acidente: str = Field(..., description="Causa do acidente")
    mortos: int = Field(..., description="Número de mortos")
    feridos: int = Field(..., description="Número total de feridos")
    classificacao_acidente: str = Field(..., description="Classificação do acidente")
    condicao_metereologica: str = Field(..., description="Condição meteorológica")

class ClusterMapa(BaseModel):
    """Modelo para um cluster de pontos no mapa."""
    latitude: float = Field(..., description="Latitude central do cluster")
    longitude: float = Field(..., description="Longitude central do cluster")
    total_acidentes: int = Field(..., description="Total de acidentes no cluster")
    total_mortos: int = Field(..., description="Total de mortos nos acidentes do cluster")
    raio_km: float = Field(..., description="Raio aproximado do cluster em km")
    zoom_level: int = Field(..., description="Nível de zoom indicado para visualização")
    nivel_risco: str = Field(..., description="Nível de risco do cluster (baixo, médio, alto, muito alto)")

class TrechoPerigoso(BaseModel):
    """Modelo para um trecho perigoso de rodovia."""
    uf: str = Field(..., description="Estado (UF)")
    br: str = Field(..., description="Rodovia BR")
    km_inicial: float = Field(..., description="Quilômetro inicial do trecho")
    km_final: float = Field(..., description="Quilômetro final do trecho")
    total_acidentes: int = Field(..., description="Total de acidentes no trecho")
    total_mortos: int = Field(..., description="Total de mortos nos acidentes do trecho")
    indice_periculosidade: float = Field(..., description="Índice de periculosidade do trecho")
    principais_causas: List[str] = Field(..., description="Principais causas de acidentes no trecho")
    municipios: List[str] = Field(..., description="Municípios que o trecho atravessa")
    horarios_criticos: List[str] = Field(..., description="Horários com maior incidência de acidentes")
    nivel_risco: str = Field(..., description="Nível de risco do trecho (baixo, médio, alto, muito alto)")
    coordenadas: List[Tuple[float, float]] = Field(..., description="Lista de coordenadas que formam o trecho")