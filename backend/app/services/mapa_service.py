import pandas as pd
import numpy as np
import requests
import json
import os
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, distinct
from backend.app.models.ponto_mapa import PontoMapa, ClusterMapa, TrechoPerigoso
from backend.app.db.models import Acidente as AcidenteDB, TrechoPerigoso as TrechoPerigosoDB
from backend.app.core.config import settings
from geopy.distance import geodesic
from collections import defaultdict

class MapaService:
    ufs_geojson = None
    rodovias_geojson = None
    geojson_url_ufs = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson"
    
    @staticmethod
    async def _load_ufs_geojson():
        """Carrega o GeoJSON dos estados brasileiros."""
        if MapaService.ufs_geojson is None:
            response = requests.get(MapaService.geojson_url_ufs)
            MapaService.ufs_geojson = response.json()
            
            # Mapear nomes de estados para UFs
            state_name_to_code = {
                'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
                'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
                'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
                'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
                'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
                'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
                'Sergipe': 'SE', 'Tocantins': 'TO'
            }
            
            for feature in MapaService.ufs_geojson['features']:
                state_name = feature['properties']['name']
                uf = state_name_to_code.get(state_name)
                feature['properties']['uf'] = uf
        
        return MapaService.ufs_geojson
    
    @staticmethod
    async def _load_rodovias_geojson(uf: Optional[str] = None):
        """
        Esta é uma implementação simplificada.
        Em um cenário real, você precisaria de um arquivo GeoJSON com as rotas das rodovias.
        """
        # Em um cenário real, você carregaria de uma fonte de dados real
        # Por enquanto, retornamos um GeoJSON vazio
        if MapaService.rodovias_geojson is None:
            MapaService.rodovias_geojson = {
                "type": "FeatureCollection",
                "features": []
            }
        
        # Se uma UF for especificada, filtre as rodovias
        if uf:
            filtered_features = [f for f in MapaService.rodovias_geojson["features"] 
                                if f["properties"].get("uf") == uf]
            return {
                "type": "FeatureCollection",
                "features": filtered_features
            }
        
        return MapaService.rodovias_geojson
    
    @staticmethod
    async def get_pontos_acidentes(
        db: Session,
        uf: Optional[str] = None, 
        ano: Optional[int] = None,
        br: Optional[str] = None,
        tipo_acidente: Optional[str] = None,
        classificacao: Optional[str] = None,
        limit: int = 1000
    ) -> List[PontoMapa]:
        """
        Retorna pontos de acidentes para visualização no mapa.
        
        Args:
            db: Sessão do banco de dados
            uf: Filtro por UF
            ano: Filtro por ano
            br: Filtro por rodovia BR
            tipo_acidente: Filtro por tipo de acidente
            classificacao: Filtro por classificação de acidente
            limit: Limite de registros a retornar
            
        Returns:
            Lista de pontos de acidentes
        """
        query = db.query(AcidenteDB) \
                .filter(AcidenteDB.latitude.isnot(None), AcidenteDB.longitude.isnot(None))
        
        # Aplicar filtros, se especificados
        if uf:
            query = query.filter(AcidenteDB.uf == uf)
            
        if ano:
            query = query.filter(AcidenteDB.ano == ano)
            
        if br:
            query = query.filter(AcidenteDB.br == br)
            
        if tipo_acidente:
            query = query.filter(AcidenteDB.tipo_acidente == tipo_acidente)
            
        if classificacao:
            query = query.filter(AcidenteDB.classificacao_acidente == classificacao)
        
        # Ordenar por data (mais recente primeiro)
        query = query.order_by(desc(AcidenteDB.data_inversa))
        
        # Limitar a quantidade de registros
        acidentes = query.limit(limit).all()
        
        # Converter para o modelo
        result = []
        for acidente in acidentes:
            ponto = PontoMapa(
                id=acidente.id,
                latitude=float(acidente.latitude),
                longitude=float(acidente.longitude),
                data=acidente.data_inversa.isoformat() if acidente.data_inversa else None,
                hora=acidente.horario.strftime('%H:%M') if acidente.horario else None,
                br=acidente.br,
                km=float(acidente.km) if acidente.km else 0.0,
                uf=acidente.uf,
                municipio=acidente.municipio,
                tipo_acidente=acidente.tipo_acidente,
                causa_acidente=acidente.causa_acidente,
                mortos=acidente.mortos or 0,
                feridos=acidente.feridos or 0,
                classificacao_acidente=acidente.classificacao_acidente or 'Não classificado',
                condicao_metereologica=acidente.condicao_metereologica
            )
            result.append(ponto)
        
        return result
    
    @staticmethod
    async def get_trechos_perigosos(
        db: Session,
        uf: Optional[str] = None, 
        ano: Optional[int] = None,
        br: Optional[str] = None,
        top: int = 10
    ) -> List[TrechoPerigoso]:
        """
        Retorna os trechos mais perigosos com base na concentração de acidentes.
        
        Args:
            db: Sessão do banco de dados
            uf: Filtro por UF
            ano: Filtro por ano
            br: Filtro por rodovia BR
            top: Número de trechos a retornar
            
        Returns:
            Lista de trechos perigosos
        """
        query = db.query(TrechoPerigosoDB)
        
        # Aplicar filtros, se especificados
        if uf:
            query = query.filter(TrechoPerigosoDB.uf == uf)
            
        if ano:
            query = query.filter(TrechoPerigosoDB.ano == ano)
            
        if br:
            query = query.filter(TrechoPerigosoDB.br == br)
        
        # Ordenar por índice de periculosidade (decrescente)
        query = query.order_by(desc(TrechoPerigosoDB.indice_periculosidade))
        
        # Limitar a quantidade de registros
        trechos_db = query.limit(top).all()
        
        # Converter para o modelo
        result = []
        for trecho_db in trechos_db:
            trecho = TrechoPerigoso(
                uf=trecho_db.uf,
                br=trecho_db.br,
                km_inicial=trecho_db.km_inicial,
                km_final=trecho_db.km_final,
                total_acidentes=trecho_db.total_acidentes,
                total_mortos=trecho_db.total_mortos,
                indice_periculosidade=trecho_db.indice_periculosidade,
                nivel_risco=trecho_db.nivel_risco,
                principais_causas=trecho_db.principais_causas,
                municipios=trecho_db.municipios,
                horarios_criticos=trecho_db.horarios_criticos,
                coordenadas=trecho_db.coordenadas
            )
            result.append(trecho)
        
        return result
    
    @staticmethod
    async def get_ufs_geojson() -> Dict[str, Any]:
        """
        Retorna o GeoJSON com os limites dos estados brasileiros.
        """
        return await MapaService._load_ufs_geojson()
    
    @staticmethod
    async def get_rodovias_geojson(uf: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna o GeoJSON com as rodovias federais.
        """
        return await MapaService._load_rodovias_geojson(uf)
    
    async def get_heatmap_data(
        self, 
        uf: Optional[str] = None, 
        ano: Optional[int] = None,
        tipo_acidente: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna dados para geração de mapa de calor de concentração de acidentes.
        """
        df = await self._load_data()
        
        # Filtrar por ano, UF e tipo, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        if tipo_acidente:
            df = df[df['tipo_acidente'] == tipo_acidente]
        
        # Filtrar apenas registros com coordenadas válidas
        df = df[df['latitude'].notna() & df['longitude'].notna()]
        
        # Preparar dados para o heatmap (formato esperado por bibliotecas como heatmap.js)
        heatmap_data = []
        for _, row in df.iterrows():
            # Intensidade baseada no número de mortos (poderia ser outra métrica)
            intensity = 1 + row['mortos'] * 2  # Acidentes com mortes têm maior intensidade
            
            point = {
                "lat": float(row['latitude']),
                "lng": float(row['longitude']),
                "intensity": int(intensity)
            }
            heatmap_data.append(point)
        
        # Calcular limites do mapa para melhor visualização
        bounds = {
            "north": df['latitude'].max() if not df.empty else -13.0,
            "south": df['latitude'].min() if not df.empty else -22.0,
            "east": df['longitude'].max() if not df.empty else -43.0,
            "west": df['longitude'].min() if not df.empty else -52.0
        }
        
        return {
            "data": heatmap_data,
            "max": 10,  # Valor máximo para normalização
            "bounds": bounds,
            "count": len(heatmap_data)
        }
    
    async def get_ufs_geojson(self) -> Dict[str, Any]:
        """
        Retorna o GeoJSON com os limites dos estados brasileiros.
        """
        return await self._load_ufs_geojson()
    
    async def get_rodovias_geojson(self, uf: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna o GeoJSON com as rodovias federais.
        """
        return await self._load_rodovias_geojson(uf)