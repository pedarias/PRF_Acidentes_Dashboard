from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, distinct
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.db.models import Acidente as AcidenteDB
from app.models.acidente import Acidente, AcidenteFilter, AcidenteResponse

class AcidenteService:
    @staticmethod
    async def get_acidentes(db: Session, filtros: AcidenteFilter, limit: int = 100, offset: int = 0) -> List[AcidenteResponse]:
        """
        Retorna uma lista de acidentes conforme os filtros aplicados.
        
        Args:
            db: Sessão do banco de dados
            filtros: Filtros a serem aplicados
            limit: Limite de registros
            offset: Deslocamento para paginação
            
        Returns:
            Lista de acidentes como objetos AcidenteResponse
        """
        query = db.query(AcidenteDB)
        
        # Aplicar filtros
        query = AcidenteService._apply_filters(query, filtros)
        
        # Ordenar por data (mais recentes primeiro) e ID
        query = query.order_by(desc(AcidenteDB.data_inversa), desc(AcidenteDB.id))
        
        # Aplicar paginação
        acidentes = query.offset(offset).limit(limit).all()
        
        # Converter para o modelo de resposta
        result = []
        for acidente in acidentes:
            acidente_resp = AcidenteResponse(
                id=acidente.id,
                data=acidente.data_inversa.isoformat() if acidente.data_inversa else None,
                dia_semana=acidente.dia_semana,
                hora=acidente.horario.strftime("%H:%M") if acidente.horario else None,
                uf=acidente.uf,
                br=acidente.br,
                km=acidente.km,
                municipio=acidente.municipio,
                causa_acidente=acidente.causa_acidente,
                tipo_acidente=acidente.tipo_acidente,
                classificacao_acidente=acidente.classificacao_acidente or "Não classificado",
                condicao_metereologica=acidente.condicao_metereologica,
                mortos=acidente.mortos or 0,
                feridos=acidente.feridos or 0,
                veiculos=acidente.veiculos or 0,
                latitude=acidente.latitude,
                longitude=acidente.longitude
            )
            result.append(acidente_resp)
        
        return result
    
    @staticmethod
    async def count_acidentes(db: Session, filtros: AcidenteFilter) -> int:
        """
        Retorna o total de acidentes conforme os filtros aplicados.
        
        Args:
            db: Sessão do banco de dados
            filtros: Filtros a serem aplicados
            
        Returns:
            Número total de acidentes
        """
        query = db.query(func.count(AcidenteDB.id))
        query = AcidenteService._apply_filters(query, filtros)
        return query.scalar()
    
    @staticmethod
    async def get_rodovias(db: Session) -> List[str]:
        """
        Retorna a lista de rodovias presentes nos dados.
        
        Args:
            db: Sessão do banco de dados
            
        Returns:
            Lista de rodovias
        """
        result = db.query(AcidenteDB.br) \
                  .filter(AcidenteDB.br.isnot(None)) \
                  .distinct() \
                  .order_by(AcidenteDB.br) \
                  .all()
        
        return [r[0] for r in result if r[0]]
    
    @staticmethod
    async def get_causas(db: Session) -> List[str]:
        """
        Retorna a lista de causas de acidentes presentes nos dados.
        
        Args:
            db: Sessão do banco de dados
            
        Returns:
            Lista de causas de acidentes
        """
        result = db.query(AcidenteDB.causa_acidente) \
                  .filter(AcidenteDB.causa_acidente.isnot(None)) \
                  .distinct() \
                  .order_by(AcidenteDB.causa_acidente) \
                  .all()
        
        return [r[0] for r in result if r[0]]
    
    @staticmethod
    async def get_tipos(db: Session) -> List[str]:
        """
        Retorna a lista de tipos de acidentes presentes nos dados.
        
        Args:
            db: Sessão do banco de dados
            
        Returns:
            Lista de tipos de acidentes
        """
        result = db.query(AcidenteDB.tipo_acidente) \
                  .filter(AcidenteDB.tipo_acidente.isnot(None)) \
                  .distinct() \
                  .order_by(AcidenteDB.tipo_acidente) \
                  .all()
        
        return [r[0] for r in result if r[0]]
    
    @staticmethod
    async def get_condicoes_meteorologicas(db: Session) -> List[str]:
        """
        Retorna a lista de condições meteorológicas presentes nos dados.
        
        Args:
            db: Sessão do banco de dados
            
        Returns:
            Lista de condições meteorológicas
        """
        result = db.query(AcidenteDB.condicao_metereologica) \
                  .filter(AcidenteDB.condicao_metereologica.isnot(None)) \
                  .distinct() \
                  .order_by(AcidenteDB.condicao_metereologica) \
                  .all()
        
        return [r[0] for r in result if r[0]]
    
    @staticmethod
    def _apply_filters(query, filtros: AcidenteFilter):
        """
        Aplica os filtros na consulta SQL.
        
        Args:
            query: Query SQLAlchemy
            filtros: Filtros a serem aplicados
            
        Returns:
            Query com filtros aplicados
        """
        if filtros.uf:
            query = query.filter(AcidenteDB.uf == filtros.uf)
        
        if filtros.ano:
            query = query.filter(AcidenteDB.ano == filtros.ano)
        
        if filtros.br:
            query = query.filter(AcidenteDB.br == filtros.br)
        
        if filtros.municipio:
            query = query.filter(AcidenteDB.municipio == filtros.municipio)
        
        if filtros.causa_acidente:
            query = query.filter(AcidenteDB.causa_acidente == filtros.causa_acidente)
        
        if filtros.tipo_acidente:
            query = query.filter(AcidenteDB.tipo_acidente == filtros.tipo_acidente)
        
        if filtros.classificacao_acidente:
            query = query.filter(AcidenteDB.classificacao_acidente == filtros.classificacao_acidente)
        
        if filtros.condicao_metereologica:
            query = query.filter(AcidenteDB.condicao_metereologica == filtros.condicao_metereologica)
        
        if filtros.tipo_pista:
            query = query.filter(AcidenteDB.tipo_pista == filtros.tipo_pista)
        
        if filtros.tracado_via:
            query = query.filter(AcidenteDB.tracado_via == filtros.tracado_via)
        
        if filtros.uso_solo:
            query = query.filter(AcidenteDB.uso_solo == filtros.uso_solo)
        
        return query