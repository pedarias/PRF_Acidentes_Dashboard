from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.models.acidente import Acidente, AcidenteFilter, AcidenteResponse
from backend.app.services.acidente_service import AcidenteService
from backend.app.db.database import get_db

router = APIRouter()

@router.get("/", response_model=List[AcidenteResponse])
async def listar_acidentes(
    db: Session = Depends(get_db),
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    ano: Optional[int] = Query(None, description="Ano do acidente"),
    causa: Optional[str] = Query(None, description="Causa do acidente"),
    tipo: Optional[str] = Query(None, description="Tipo de acidente"),
    condicao_metereologica: Optional[str] = Query(None, description="Condição meteorológica"),
    limit: int = Query(100, description="Limite de resultados"),
    offset: int = Query(0, description="Offset para paginação"),
):
    """
    Retorna uma lista de acidentes com filtros opcionais.
    """
    filtros = AcidenteFilter(
        uf=uf,
        ano=ano,
        causa_acidente=causa,
        tipo_acidente=tipo,
        condicao_metereologica=condicao_metereologica
    )
    return await AcidenteService.get_acidentes(db, filtros, limit, offset)

@router.get("/total", response_model=int)
async def contar_acidentes(
    db: Session = Depends(get_db),
    uf: Optional[str] = Query(None, description="Estado (UF)"),
    ano: Optional[int] = Query(None, description="Ano do acidente"),
    causa: Optional[str] = Query(None, description="Causa do acidente"),
    tipo: Optional[str] = Query(None, description="Tipo de acidente"),
    condicao_metereologica: Optional[str] = Query(None, description="Condição meteorológica"),
):
    """
    Retorna o total de acidentes com filtros opcionais.
    """
    filtros = AcidenteFilter(
        uf=uf,
        ano=ano,
        causa_acidente=causa,
        tipo_acidente=tipo,
        condicao_metereologica=condicao_metereologica
    )
    return await AcidenteService.count_acidentes(db, filtros)

@router.get("/rodovias", response_model=List[str])
async def listar_rodovias(db: Session = Depends(get_db)):
    """
    Retorna uma lista de todas as rodovias presentes nos dados.
    """
    return await AcidenteService.get_rodovias(db)

@router.get("/causas", response_model=List[str])
async def listar_causas(db: Session = Depends(get_db)):
    """
    Retorna uma lista de todas as causas de acidentes presentes nos dados.
    """
    return await AcidenteService.get_causas(db)

@router.get("/tipos", response_model=List[str])
async def listar_tipos(db: Session = Depends(get_db)):
    """
    Retorna uma lista de todos os tipos de acidentes presentes nos dados.
    """
    return await AcidenteService.get_tipos(db)

@router.get("/condicoes-meteorologicas", response_model=List[str])
async def listar_condicoes_meteorologicas(db: Session = Depends(get_db)):
    """
    Retorna uma lista de todas as condições meteorológicas presentes nos dados.
    """
    return await AcidenteService.get_condicoes_meteorologicas(db)