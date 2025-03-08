import pandas as pd
import numpy as np
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
from backend.app.db.database import Base, engine
from backend.app.db.models import Acidente, TrechoPerigoso
from backend.app.core.config import settings
import json

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Criar todas as tabelas do banco de dados."""
    logger.info("Criando tabelas no banco de dados...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tabelas criadas com sucesso!")
    except SQLAlchemyError as e:
        logger.error(f"Erro ao criar tabelas: {e}")
        raise

def process_csv(file_path: str) -> pd.DataFrame:
    """
    Carrega e processa o arquivo CSV.
    
    Args:
        file_path: Caminho para o arquivo CSV de acidentes
        
    Returns:
        DataFrame processado
    """
    logger.info(f"Carregando dados do arquivo: {file_path}")
    try:
        # Leitura do CSV
        df = pd.read_csv(file_path, low_memory=False)
        
        # Converter data_inversa para datetime
        df['data_inversa'] = pd.to_datetime(df['data_inversa'], errors='coerce')
        
        # Extrair o ano
        df['ano'] = df['data_inversa'].dt.year
        
        # Converter horário para datetime (mantendo apenas a informação de hora)
        df['horario'] = pd.to_datetime(df['horario'], format='%H:%M:%S', errors='coerce')
        
        # Extrair hora do dia (0-23)
        df['HORA'] = df['horario'].dt.hour.fillna(-1).astype(int)
        
        # Definir períodos do dia
        bins = [-1, 4, 11, 17, 23]
        labels = ['MADRUGADA', 'MANHÃ', 'TARDE', 'NOITE']
        
        df['PERIODO_DIA'] = pd.cut(
            df['HORA'],
            bins=bins,
            labels=labels,
            include_lowest=True,
            right=True
        )
        
        # Lidar com valores fora dos bins
        df['PERIODO_DIA'] = df['PERIODO_DIA'].cat.add_categories(['DESCONHECIDO'])
        df.loc[df['HORA'] < 0, 'PERIODO_DIA'] = 'DESCONHECIDO'
        df.loc[df['HORA'] >= 24, 'PERIODO_DIA'] = 'DESCONHECIDO'
        
        # Converter colunas numéricas
        for col in ['km', 'latitude', 'longitude']:
            if col in df.columns:
                df[col] = (df[col].astype(str)
                          .str.replace(',', '.')
                          .astype(float, errors='ignore'))
        
        # Criar coluna de total de feridos
        if 'feridos_leves' in df.columns and 'feridos_graves' in df.columns:
            df['feridos'] = df['feridos_leves'].fillna(0) + df['feridos_graves'].fillna(0)
        
        # Garantir que mortos seja numérico
        if 'mortos' in df.columns:
            df['mortos'] = df['mortos'].fillna(0).astype(int)
        
        # Padronização de texto para colunas categóricas
        if 'condicao_metereologica' in df.columns:
            df['condicao_metereologica'] = df['condicao_metereologica'].str.upper()
        
        # Preenchimento de valores faltantes para colunas numéricas
        fill_numeric = ['km', 'latitude', 'longitude', 'veiculos', 'pessoas', 'mortos', 'ano']
        fill_numeric = [col for col in fill_numeric if col in df.columns]
        
        for col in fill_numeric:
            if col == 'ano' and df['ano'].isna().sum() > 0:
                # Completar anos faltantes com base na data_inversa
                df.loc[df['ano'].isna(), 'ano'] = df.loc[df['ano'].isna(), 'data_inversa'].dt.year
            df[col] = df[col].fillna(df[col].median())
        
        # Preenchimento de valores faltantes para colunas categóricas
        categorical_cols = [
            'uf', 'municipio', 'causa_acidente', 'tipo_acidente', 
            'sentido_via', 'condicao_metereologica', 'tipo_pista',
            'tracado_via', 'uso_solo', 'PERIODO_DIA', 'dia_semana'
        ]
        categorical_cols = [col for col in categorical_cols if col in df.columns]
        
        for col in categorical_cols:
            if len(df[col].dropna()) > 0:  # Verificar se há valores não-nulos para computar a moda
                df[col] = df[col].fillna(df[col].mode()[0])
        
        logger.info(f"Dados processados com sucesso. Total de registros: {len(df)}")
        return df
    
    except Exception as e:
        logger.error(f"Erro ao processar o arquivo CSV: {e}")
        raise

def populate_db_from_csv(db: Session, csv_path: str, batch_size: int = 1000):
    """
    Popula o banco de dados com os dados do CSV.
    
    Args:
        db: Sessão do banco de dados
        csv_path: Caminho para o arquivo CSV
        batch_size: Tamanho do lote para inserção em batch
    """
    try:
        # Processar CSV
        df = process_csv(csv_path)
        
        # Verificar se já existem dados no banco
        existing_count = db.query(Acidente).count()
        if existing_count > 0:
            logger.info(f"Já existem {existing_count} registros no banco. Pulando importação.")
            return
        
        total_records = len(df)
        logger.info(f"Iniciando importação de {total_records} registros...")
        
        # Inserir em lotes
        for i in range(0, total_records, batch_size):
            batch_end = min(i + batch_size, total_records)
            batch_df = df.iloc[i:batch_end]
            
            # Converter para dicionários
            records = batch_df.to_dict('records')
            
            # Criar objetos Acidente e adicionar à sessão
            for record in records:
                # Converter horário para objeto time
                if 'horario' in record and pd.notna(record['horario']):
                    if isinstance(record['horario'], pd.Timestamp):
                        record['horario'] = record['horario'].time()
                
                # Converter data_inversa para objeto date
                if 'data_inversa' in record and pd.notna(record['data_inversa']):
                    if isinstance(record['data_inversa'], pd.Timestamp):
                        record['data_inversa'] = record['data_inversa'].date()
                
                # Criar objeto do modelo e adicionar à sessão
                acidente = Acidente(**{k: v for k, v in record.items() if k in Acidente.__table__.columns.keys()})
                db.add(acidente)
            
            # Commit do lote
            db.commit()
            logger.info(f"Importados registros {i+1} até {batch_end} de {total_records}")
        
        logger.info("Importação concluída com sucesso!")
    
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao importar dados: {e}")
        raise

def gerar_trechos_perigosos(db: Session, ano: int = None):
    """
    Gera trechos perigosos com base nos dados de acidentes.
    
    Args:
        db: Sessão do banco de dados
        ano: Ano específico para filtrar, ou None para todos os anos
    """
    try:
        logger.info("Gerando trechos perigosos...")
        
        # Limpar trechos existentes
        if ano:
            db.query(TrechoPerigoso).filter(TrechoPerigoso.ano == ano).delete()
        else:
            db.query(TrechoPerigoso).delete()
        
        db.commit()
        
        # Para cada UF e BR, encontrar segmentos com alta concentração de acidentes
        query = db.query(Acidente.uf, Acidente.br)
        if ano:
            query = query.filter(Acidente.ano == ano)
        
        uf_br_combinations = query.distinct().all()
        
        for uf, br in uf_br_combinations:
            if not uf or not br:
                continue
                
            # Consultar acidentes para esta UF e BR
            query = db.query(Acidente).filter(Acidente.uf == uf, Acidente.br == br)
            if ano:
                query = query.filter(Acidente.ano == ano)
                
            acidentes = query.all()
            
            if len(acidentes) < 10:  # Ignorar rodovias com poucos acidentes
                continue
                
            # Agrupar por segmentos de 5km
            segmentos = {}
            for acidente in acidentes:
                if acidente.km is None:
                    continue
                    
                # Arredondar para segmentos de 5km
                segmento_inicio = int(acidente.km / 5) * 5
                segmento_fim = segmento_inicio + 5
                segmento_key = f"{segmento_inicio}-{segmento_fim}"
                
                if segmento_key not in segmentos:
                    segmentos[segmento_key] = {
                        'km_inicial': segmento_inicio,
                        'km_final': segmento_fim,
                        'acidentes': [],
                        'total_acidentes': 0,
                        'total_mortos': 0,
                        'municipios': set(),
                        'causas': {},
                        'horarios': {}
                    }
                
                # Adicionar acidente ao segmento
                segmentos[segmento_key]['acidentes'].append(acidente)
                segmentos[segmento_key]['total_acidentes'] += 1
                segmentos[segmento_key]['total_mortos'] += acidente.mortos or 0
                
                if acidente.municipio:
                    segmentos[segmento_key]['municipios'].add(acidente.municipio)
                
                if acidente.causa_acidente:
                    causa = acidente.causa_acidente
                    segmentos[segmento_key]['causas'][causa] = segmentos[segmento_key]['causas'].get(causa, 0) + 1
                
                if acidente.horario:
                    hora = acidente.horario.strftime('%H:00')
                    segmentos[segmento_key]['horarios'][hora] = segmentos[segmento_key]['horarios'].get(hora, 0) + 1
            
            # Calcular índice de periculosidade e identificar trechos perigosos
            for segmento_key, dados in segmentos.items():
                if dados['total_acidentes'] < 5:  # Ignorar segmentos com poucos acidentes
                    continue
                
                # Calcular índice de periculosidade (escala 1-5)
                # Fórmula: (acidentes * 0.3) + (mortos * 0.7) / comprimento do trecho
                mortos_por_km = dados['total_mortos'] / 5  # 5km é o comprimento do trecho
                acidentes_por_km = dados['total_acidentes'] / 5
                
                indice = (acidentes_por_km * 0.3) + (mortos_por_km * 0.7)
                
                # Normalizar para escala 1-5
                indice_normalizado = min(5, max(1, indice))
                
                # Determinar nível de risco
                if indice_normalizado >= 4:
                    nivel_risco = "muito alto"
                elif indice_normalizado >= 3:
                    nivel_risco = "alto"
                elif indice_normalizado >= 2:
                    nivel_risco = "médio"
                else:
                    nivel_risco = "baixo"
                
                # Gerar coordenadas simuladas para o trecho
                # Na implementação real, seria necessário usar dados geográficos reais
                coordenadas = []
                if len(dados['acidentes']) > 1:
                    # Usar coordenadas dos acidentes ordenadas por km
                    acidentes_com_coords = [a for a in dados['acidentes'] if a.latitude and a.longitude]
                    if acidentes_com_coords:
                        acidentes_ordenados = sorted(acidentes_com_coords, key=lambda a: a.km)
                        for acidente in acidentes_ordenados[:5]:  # Usar no máximo 5 pontos
                            if acidente.latitude and acidente.longitude:
                                coordenadas.append([float(acidente.latitude), float(acidente.longitude)])
                
                # Se não houver coordenadas suficientes, não criar o trecho
                if len(coordenadas) < 2:
                    continue
                
                # Obter principais causas
                principais_causas = sorted(dados['causas'].items(), key=lambda x: x[1], reverse=True)[:3]
                principais_causas = [causa for causa, _ in principais_causas]
                
                # Obter horários críticos
                horarios_criticos = sorted(dados['horarios'].items(), key=lambda x: x[1], reverse=True)[:3]
                horarios_criticos = [hora for hora, _ in horarios_criticos]
                
                # Criar objeto TrechoPerigoso
                trecho = TrechoPerigoso(
                    uf=uf,
                    br=br,
                    km_inicial=dados['km_inicial'],
                    km_final=dados['km_final'],
                    total_acidentes=dados['total_acidentes'],
                    total_mortos=dados['total_mortos'],
                    indice_periculosidade=indice_normalizado,
                    nivel_risco=nivel_risco,
                    ano=ano if ano else 2023,  # Usar ano especificado ou padrão
                    principais_causas=principais_causas,
                    municipios=list(dados['municipios']),
                    horarios_criticos=horarios_criticos,
                    coordenadas=coordenadas
                )
                
                db.add(trecho)
        
        db.commit()
        logger.info("Trechos perigosos gerados com sucesso!")
    
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao gerar trechos perigosos: {e}")
        raise

def init_db():
    """Inicializa o banco de dados e carrega os dados iniciais."""
    from backend.app.db.database import SessionLocal
    
    db = SessionLocal()
    try:
        # Criar tabelas
        create_tables()
        
        # Carregar dados do CSV (caso exista)
        csv_path = os.path.join(settings.DATA_DIR, 'datatran_all_years.csv')
        if os.path.exists(csv_path):
            populate_db_from_csv(db, csv_path)
            
            # Gerar trechos perigosos
            gerar_trechos_perigosos(db)
        else:
            logger.warning(f"Arquivo CSV não encontrado em {csv_path}. Pulando importação de dados.")
        
        logger.info("Inicialização do banco de dados concluída com sucesso!")
    
    except Exception as e:
        logger.error(f"Erro na inicialização do banco de dados: {e}")
    
    finally:
        db.close()

if __name__ == "__main__":
    init_db()