from sqlalchemy import Column, Integer, String, Float, Date, Time, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.database import Base
from datetime import date, time

class Acidente(Base):
    """
    Modelo SQLAlchemy para a tabela de acidentes.
    Representa os dados de um acidente de trânsito.
    """
    __tablename__ = "acidentes"

    id = Column(Integer, primary_key=True, index=True)
    data_inversa = Column(Date, index=True)
    dia_semana = Column(String, index=True)
    horario = Column(Time)
    uf = Column(String(2), index=True)
    br = Column(String(3), index=True)
    km = Column(Float)
    municipio = Column(String, index=True)
    causa_acidente = Column(String, index=True)
    tipo_acidente = Column(String, index=True)
    classificacao_acidente = Column(String, index=True)
    fase_dia = Column(String)
    sentido_via = Column(String)
    condicao_metereologica = Column(String)
    tipo_pista = Column(String)
    tracado_via = Column(String)
    uso_solo = Column(String)
    
    # Dados de ano
    ano = Column(Integer, index=True)
    
    # Dados de pessoas e veículos
    pessoas = Column(Integer)
    mortos = Column(Integer)
    feridos_leves = Column(Integer)
    feridos_graves = Column(Integer)
    ilesos = Column(Integer)
    ignorados = Column(Integer)
    feridos = Column(Integer)
    veiculos = Column(Integer)
    
    # Dados de geolocalização
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Campos administrativos
    regional = Column(String)
    delegacia = Column(String)
    uop = Column(String)

class TrechoPerigoso(Base):
    """
    Modelo SQLAlchemy para a tabela de trechos perigosos.
    Representa um segmento de rodovia identificado como perigoso com base em análises.
    """
    __tablename__ = "trechos_perigosos"

    id = Column(Integer, primary_key=True, index=True)
    uf = Column(String(2), index=True)
    br = Column(String(3), index=True)
    km_inicial = Column(Float)
    km_final = Column(Float)
    total_acidentes = Column(Integer)
    total_mortos = Column(Integer)
    indice_periculosidade = Column(Float)
    nivel_risco = Column(String) # muito alto, alto, médio, baixo
    ano = Column(Integer, index=True)
    
    # Armazenados como JSON na implementação real
    principais_causas = Column(JSON) 
    municipios = Column(JSON)
    horarios_criticos = Column(JSON)
    coordenadas = Column(JSON)  # JSON array de coordenadas para o polyline