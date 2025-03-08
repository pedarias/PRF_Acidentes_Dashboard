"""
Aplicação FastAPI para o Dashboard de Acidentes de Trânsito - Versão SQLite
"""
from fastapi import FastAPI, Query, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import sys
from typing import List, Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import logging
from datetime import datetime
import json

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('api')

# Carregar variáveis de ambiente
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

# Criar engine do SQLAlchemy
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Criar aplicação FastAPI
app = FastAPI(
    title="PRF Acidentes Dashboard",
    description="API para o Painel de Acidentes de Trânsito no Brasil",
    version="1.0.0",
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todas as origens para simplificar
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependência para obter sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Criar rotas API
@app.get("/")
async def root():
    return {"message": "Bem-vindo à API do Painel de Acidentes de Trânsito no Brasil"}

@app.get("/api/v1/acidentes")
async def get_acidentes(
    uf: Optional[str] = None, 
    br: Optional[str] = None,
    ano: Optional[int] = None,
    causa: Optional[str] = None, 
    tipo: Optional[str] = None,
    limit: int = 1000,
    db = Depends(get_db)
):
    try:
        # Construir consulta dinâmica com filtros
        query = """
        SELECT 
            id, uf, br, km, data, horario, tipo_acidente, causa_acidente, 
            mortos, feridos, veiculos, latitude, longitude, municipio,
            periodo_dia, dia_semana
        FROM acidentes 
        WHERE 1=1
        """
        params = {}
        
        if uf:
            query += " AND uf = :uf"
            params['uf'] = uf
        
        if br:
            query += " AND br = :br"
            params['br'] = br
            
        if ano:
            query += " AND strftime('%Y', data) = :ano"
            params['ano'] = str(ano)
        
        if causa:
            query += " AND causa_acidente = :causa"
            params['causa'] = causa
            
        if tipo:
            query += " AND tipo_acidente = :tipo"
            params['tipo'] = tipo
        
        query += " ORDER BY data DESC LIMIT :limit"
        params['limit'] = limit
        
        # Executar consulta
        result = db.execute(text(query), params).fetchall()
        
        # Converter para lista de dicionários
        acidentes = []
        for row in result:
            acidente = dict(row._mapping)
            
            # Adicionar horário como hora
            if 'horario' in acidente and acidente['horario']:
                acidente['hora'] = acidente['horario']
                
            acidentes.append(acidente)
            
        return acidentes
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar acidentes: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/estatisticas")
async def get_estatisticas(
    uf: Optional[str] = None,
    ano: Optional[int] = None,
    db = Depends(get_db)
):
    try:
        # Construir consulta base
        query_base = "FROM acidentes WHERE 1=1"
        params = {}
        
        if uf:
            query_base += " AND uf = :uf"
            params['uf'] = uf
            
        if ano:
            query_base += " AND strftime('%Y', data) = :ano"
            params['ano'] = str(ano)
        
        # Total de acidentes
        query_acidentes = f"SELECT COUNT(*) AS total {query_base}"
        total_acidentes = db.execute(text(query_acidentes), params).scalar()
        
        # Total de feridos
        query_feridos = f"SELECT COALESCE(SUM(feridos), 0) AS total {query_base}"
        total_feridos = db.execute(text(query_feridos), params).scalar()
        
        # Total de mortos
        query_mortos = f"SELECT COALESCE(SUM(mortos), 0) AS total {query_base}"
        total_mortos = db.execute(text(query_mortos), params).scalar()
        
        # Acidentes por causa
        query_causas = f"""
        SELECT 
            causa_acidente AS causa, 
            COUNT(*) AS total 
        {query_base}
        GROUP BY causa_acidente 
        ORDER BY total DESC 
        LIMIT 10
        """
        result_causas = db.execute(text(query_causas), params).fetchall()
        acidentes_por_causa = [{'causa': row.causa, 'total': row.total} for row in result_causas]
        
        # Acidentes por tipo
        query_tipos = f"""
        SELECT 
            tipo_acidente AS tipo, 
            COUNT(*) AS total 
        {query_base}
        GROUP BY tipo_acidente 
        ORDER BY total DESC 
        LIMIT 10
        """
        result_tipos = db.execute(text(query_tipos), params).fetchall()
        acidentes_por_tipo = [{'tipo': row.tipo, 'total': row.total} for row in result_tipos]
        
        return {
            "total_acidentes": total_acidentes,
            "total_feridos": total_feridos,
            "total_mortos": total_mortos,
            "acidentes_por_causa": acidentes_por_causa,
            "acidentes_por_tipo": acidentes_por_tipo
        }
        
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar estatísticas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/mapas/trechos-perigosos")
async def get_trechos_perigosos(
    uf: Optional[str] = None,
    br: Optional[str] = None,
    ano: Optional[int] = None,
    nivel_risco: Optional[str] = None,
    limit: int = 20,
    db = Depends(get_db)
):
    try:
        # Construir consulta dinâmica com filtros
        query = """
        SELECT 
            id, uf, br, km_inicial, km_final, total_acidentes, 
            total_mortos, indice_periculosidade, nivel_risco, 
            principais_causas, municipios, horarios_criticos, coordenadas
        FROM trechos_perigosos 
        WHERE 1=1
        """
        params = {}
        
        if uf:
            query += " AND uf = :uf"
            params['uf'] = uf
        
        if br:
            query += " AND br = :br"
            params['br'] = br
            
        if ano:
            query += " AND ano = :ano"
            params['ano'] = ano
            
        if nivel_risco:
            query += " AND nivel_risco = :nivel_risco"
            params['nivel_risco'] = nivel_risco
        
        query += " ORDER BY indice_periculosidade DESC LIMIT :limit"
        params['limit'] = limit
        
        # Executar consulta
        result = db.execute(text(query), params).fetchall()
        
        # Converter para lista de dicionários
        trechos = []
        for row in result:
            trecho = dict(row._mapping)
            
            # Converter campos JSON para listas/dicionários
            for field in ['principais_causas', 'municipios', 'horarios_criticos', 'coordenadas']:
                if field in trecho and trecho[field]:
                    try:
                        trecho[field] = json.loads(trecho[field])
                    except:
                        trecho[field] = []
                        
            trechos.append(trecho)
            
        return trechos
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar trechos perigosos: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/acidentes/causas")
async def get_causas_acidentes(db = Depends(get_db)):
    try:
        query = "SELECT DISTINCT causa_acidente FROM acidentes WHERE causa_acidente IS NOT NULL"
        result = db.execute(text(query)).fetchall()
        causas = [row[0] for row in result]
        return causas
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar causas de acidentes: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/acidentes/tipos")
async def get_tipos_acidentes(db = Depends(get_db)):
    try:
        query = "SELECT DISTINCT tipo_acidente FROM acidentes WHERE tipo_acidente IS NOT NULL"
        result = db.execute(text(query)).fetchall()
        tipos = [row[0] for row in result]
        return tipos
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar tipos de acidentes: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/mapas/pontos")
async def get_pontos_mapa(
    uf: Optional[str] = None, 
    br: Optional[str] = None,
    ano: Optional[int] = None,
    causa: Optional[str] = None, 
    tipo: Optional[str] = None,
    limit: int = 1000,
    db = Depends(get_db)
):
    try:
        # Construir consulta dinâmica com filtros
        query = """
        SELECT 
            id, uf, br, km, data, horario, tipo_acidente, causa_acidente, 
            mortos, feridos, veiculos, latitude, longitude, municipio,
            periodo_dia, dia_semana
        FROM acidentes 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """
        params = {}
        
        if uf:
            query += " AND uf = :uf"
            params['uf'] = uf
        
        if br:
            query += " AND br = :br"
            params['br'] = br
            
        if ano:
            query += " AND strftime('%Y', data) = :ano"
            params['ano'] = str(ano)
        
        if causa:
            query += " AND causa_acidente = :causa"
            params['causa'] = causa
            
        if tipo:
            query += " AND tipo_acidente = :tipo"
            params['tipo'] = tipo
        
        query += " ORDER BY RANDOM() LIMIT :limit"
        params['limit'] = limit
        
        # Executar consulta
        result = db.execute(text(query), params).fetchall()
        
        # Converter para lista de dicionários
        pontos = []
        for row in result:
            ponto = dict(row._mapping)
            
            # Adicionar horário como hora
            if 'horario' in ponto and ponto['horario']:
                ponto['hora'] = ponto['horario']
                
            pontos.append(ponto)
            
        return pontos
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar pontos no mapa: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/estatisticas/por-ufs")
async def get_estatisticas_por_ufs(
    ano: Optional[int] = None,
    db = Depends(get_db)
):
    try:
        # Construir consulta base
        query_base = "FROM acidentes WHERE 1=1"
        params = {}
            
        if ano:
            query_base += " AND strftime('%Y', data) = :ano"
            params['ano'] = str(ano)
        
        # Estatísticas por UF
        query = f"""
        SELECT 
            uf, 
            COUNT(*) AS total_acidentes,
            COALESCE(SUM(mortos), 0) AS total_mortos,
            COALESCE(SUM(feridos), 0) AS total_feridos
        {query_base}
        GROUP BY uf 
        ORDER BY total_acidentes DESC
        """
        result = db.execute(text(query), params).fetchall()
        
        # Converter para lista de dicionários
        estatisticas = []
        for row in result:
            estatistica = {
                'uf': row.uf,
                'total_acidentes': row.total_acidentes,
                'total_mortos': row.total_mortos,
                'total_feridos': row.total_feridos
            }
            estatisticas.append(estatistica)
            
        return estatisticas
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar estatísticas por UFs: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

@app.get("/api/v1/estatisticas/por-horas")
async def get_estatisticas_por_horas(
    uf: Optional[str] = None,
    ano: Optional[int] = None,
    db = Depends(get_db)
):
    try:
        # Construir consulta base
        query_base = "FROM acidentes WHERE horario IS NOT NULL"
        params = {}
        
        if uf:
            query_base += " AND uf = :uf"
            params['uf'] = uf
            
        if ano:
            query_base += " AND strftime('%Y', data) = :ano"
            params['ano'] = str(ano)
        
        # Estatísticas por hora
        query = f"""
        SELECT 
            CAST(substr(horario, 1, 2) AS INTEGER) AS hora, 
            COUNT(*) AS total_acidentes,
            COALESCE(SUM(mortos), 0) AS total_mortos,
            COALESCE(SUM(feridos), 0) AS total_feridos
        {query_base}
        GROUP BY hora 
        ORDER BY hora
        """
        result = db.execute(text(query), params).fetchall()
        
        # Converter para lista de dicionários
        estatisticas = []
        for row in result:
            estatistica = {
                'hora': int(row.hora),
                'total_acidentes': row.total_acidentes,
                'total_mortos': row.total_mortos,
                'total_feridos': row.total_feridos
            }
            estatisticas.append(estatistica)
            
        return estatisticas
    
    except SQLAlchemyError as e:
        logger.error(f"Erro ao consultar estatísticas por horas: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao consultar database: {str(e)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Iniciando servidor na porta {port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)