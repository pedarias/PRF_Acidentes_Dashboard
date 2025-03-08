"""
Script para carregar dados do CSV para o PostgreSQL
"""
import os
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
import logging
from datetime import datetime
import psycopg2

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('csv_loader')

# Carregar variáveis de ambiente
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

def create_tables(engine):
    """Cria tabelas no PostgreSQL"""
    try:
        # Criar tabela de acidentes
        with engine.connect() as conn:
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS acidentes (
                id SERIAL PRIMARY KEY,
                uf VARCHAR(2),
                br VARCHAR(5),
                km FLOAT,
                data DATE,
                horario TIME,
                tipo_acidente VARCHAR(100),
                causa_acidente VARCHAR(100),
                mortos INTEGER,
                feridos INTEGER,
                feridos_leves INTEGER,
                feridos_graves INTEGER,
                veiculos INTEGER,
                latitude FLOAT,
                longitude FLOAT,
                municipio VARCHAR(100),
                periodo_dia VARCHAR(20),
                dia_semana VARCHAR(20),
                fase_dia VARCHAR(50),
                condicao_metereologica VARCHAR(50),
                tipo_pista VARCHAR(50),
                tracado_via VARCHAR(50),
                uso_solo VARCHAR(50),
                pessoas INTEGER,
                classificacao_acidente VARCHAR(100),
                sentido_via VARCHAR(50)
            )
            """))
            
            # Criar tabela para trechos perigosos
            conn.execute(text("""
            CREATE TABLE IF NOT EXISTS trechos_perigosos (
                id SERIAL PRIMARY KEY,
                uf VARCHAR(2),
                br VARCHAR(5),
                km_inicial FLOAT,
                km_final FLOAT,
                total_acidentes INTEGER,
                total_mortos INTEGER,
                indice_periculosidade FLOAT,
                nivel_risco VARCHAR(20),
                ano INTEGER,
                principais_causas TEXT[],
                municipios TEXT[],
                horarios_criticos TEXT[],
                coordenadas FLOAT[][],
                created_at TIMESTAMP DEFAULT NOW()
            )
            """))
            
            conn.commit()
            logger.info("Tabelas criadas com sucesso!")
    except SQLAlchemyError as e:
        logger.error(f"Erro ao criar tabelas: {e}")
        raise

def process_csv(file_path):
    """Processa o CSV e retorna um DataFrame"""
    logger.info(f"Carregando dados do arquivo: {file_path}")
    try:
        # Leitura do CSV
        df = pd.read_csv(file_path, low_memory=False)
        
        # Renomear colunas para compatibilidade com o banco
        if 'data_inversa' in df.columns:
            df.rename(columns={'data_inversa': 'data'}, inplace=True)
            
        # Converter data para datetime
        if 'data' in df.columns:
            df['data'] = pd.to_datetime(df['data'], errors='coerce')
        
        # Extrair ano
        if 'data' in df.columns:
            df['ano'] = df['data'].dt.year
        
        # Converter horário para datetime (mantendo apenas a informação de hora)
        if 'horario' in df.columns:
            df['horario'] = pd.to_datetime(df['horario'], format='%H:%M:%S', errors='coerce')
        
        # Extrair período do dia
        if 'horario' in df.columns:
            # Extrair hora do dia (0-23)
            df['hora'] = df['horario'].dt.hour.fillna(-1).astype(int)
            
            # Definir períodos do dia
            bins = [-1, 4, 11, 17, 23]
            labels = ['MADRUGADA', 'MANHÃ', 'TARDE', 'NOITE']
            
            df['periodo_dia'] = pd.cut(
                df['hora'],
                bins=bins,
                labels=labels,
                include_lowest=True,
                right=True
            )
            
            # Lidar com valores fora dos bins
            df['periodo_dia'] = df['periodo_dia'].astype(str)
            df.loc[df['hora'] < 0, 'periodo_dia'] = 'DESCONHECIDO'
            df.loc[df['hora'] >= 24, 'periodo_dia'] = 'DESCONHECIDO'
            
            # Remover coluna hora temporária
            df.drop('hora', axis=1, inplace=True)
        
        # Converter colunas numéricas
        for col in ['km', 'latitude', 'longitude']:
            if col in df.columns:
                df[col] = (df[col].astype(str)
                          .str.replace(',', '.')
                          .astype(float, errors='ignore'))
        
        # Criar coluna de total de feridos se necessário
        if 'feridos_leves' in df.columns and 'feridos_graves' in df.columns and 'feridos' not in df.columns:
            df['feridos'] = df['feridos_leves'].fillna(0) + df['feridos_graves'].fillna(0)
        
        # Garantir que mortos seja numérico
        if 'mortos' in df.columns:
            df['mortos'] = df['mortos'].fillna(0).astype(int)
        
        # Padronização de texto para colunas categóricas
        if 'condicao_metereologica' in df.columns:
            df['condicao_metereologica'] = df['condicao_metereologica'].str.upper()
        
        # Preenchimento de valores faltantes para colunas numéricas
        fill_numeric = ['km', 'latitude', 'longitude', 'veiculos', 'pessoas', 'mortos', 'feridos']
        fill_numeric = [col for col in fill_numeric if col in df.columns]
        
        for col in fill_numeric:
            if col in df.columns:
                if col == 'ano' and df['ano'].isna().sum() > 0:
                    # Completar anos faltantes com base na data
                    df.loc[df['ano'].isna(), 'ano'] = df.loc[df['ano'].isna(), 'data'].dt.year
                df[col] = df[col].fillna(df[col].median() if not df[col].empty else 0)
        
        # Preenchimento de valores faltantes para colunas categóricas
        categorical_cols = [
            'uf', 'municipio', 'causa_acidente', 'tipo_acidente', 
            'sentido_via', 'condicao_metereologica', 'tipo_pista',
            'tracado_via', 'uso_solo', 'periodo_dia', 'dia_semana'
        ]
        categorical_cols = [col for col in categorical_cols if col in df.columns]
        
        for col in categorical_cols:
            if col in df.columns and len(df[col].dropna()) > 0:
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].empty else 'DESCONHECIDO')
        
        # Preparar horário para PostgreSQL
        if 'horario' in df.columns:
            df['horario'] = df['horario'].dt.strftime('%H:%M:%S')
        
        # Preparar data para PostgreSQL
        if 'data' in df.columns:
            df['data'] = df['data'].dt.strftime('%Y-%m-%d')
        
        logger.info(f"Dados processados com sucesso. Total de registros: {len(df)}")
        return df
    except Exception as e:
        logger.error(f"Erro ao processar o arquivo CSV: {e}")
        raise

def load_to_postgres(df, engine, batch_size=5000):
    """Carrega dados para PostgreSQL"""
    try:
        logger.info(f"Iniciando carga para PostgreSQL: {len(df)} registros")
        
        # Verificar se a tabela já tem dados
        with engine.connect() as conn:
            count = conn.execute(text("SELECT COUNT(*) FROM acidentes")).scalar()
            if count > 0:
                logger.warning(f"A tabela já contém {count} registros. Deseja limpar e recarregar? (s/n)")
                choice = input().lower()
                if choice == 's':
                    conn.execute(text("TRUNCATE TABLE acidentes RESTART IDENTITY"))
                    conn.commit()
                    logger.info("Tabela limpa.")
                else:
                    logger.info("Operação cancelada pelo usuário.")
                    return
        
        # Carregar em batches para melhor performance
        total_rows = len(df)
        for i in range(0, total_rows, batch_size):
            end = min(i + batch_size, total_rows)
            batch_df = df.iloc[i:end]
            
            # Carregar o batch para PostgreSQL
            batch_df.to_sql('acidentes', engine, if_exists='append', index=False)
            
            logger.info(f"Carregados registros {i+1} até {end} de {total_rows}")
        
        logger.info("Carga concluída com sucesso!")
    except SQLAlchemyError as e:
        logger.error(f"Erro ao carregar dados para PostgreSQL: {e}")
        raise

def gerar_trechos_perigosos(engine, ano=None):
    """Gera trechos perigosos com base nos dados de acidentes"""
    try:
        logger.info("Gerando trechos perigosos...")
        
        # Limpar trechos existentes
        with engine.connect() as conn:
            if ano:
                conn.execute(text(f"DELETE FROM trechos_perigosos WHERE ano = {ano}"))
            else:
                conn.execute(text("TRUNCATE TABLE trechos_perigosos RESTART IDENTITY"))
            conn.commit()
        
        # Para cada UF e BR, encontrar segmentos com alta concentração de acidentes
        with engine.connect() as conn:
            # Obter combinações de UF/BR
            query = "SELECT DISTINCT uf, br FROM acidentes WHERE uf IS NOT NULL AND br IS NOT NULL"
            if ano:
                query += f" AND EXTRACT(YEAR FROM data::date) = {ano}"
            
            uf_br_result = conn.execute(text(query)).fetchall()
            
            for uf_br in uf_br_result:
                uf, br = uf_br
                
                # Consultar acidentes para esta UF e BR
                acidente_query = f"""
                SELECT 
                    uf, br, km, municipio, causa_acidente, 
                    horario, latitude, longitude, mortos
                FROM acidentes 
                WHERE uf = '{uf}' AND br = '{br}'
                """
                
                if ano:
                    acidente_query += f" AND EXTRACT(YEAR FROM data::date) = {ano}"
                
                acidentes = conn.execute(text(acidente_query)).fetchall()
                
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
                        hora = acidente.horario.strftime('%H:00') if hasattr(acidente.horario, 'strftime') else str(acidente.horario)
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
                    
                    # Gerar coordenadas para o trecho
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
                    
                    # Inserir trecho perigoso no banco
                    query = f"""
                    INSERT INTO trechos_perigosos 
                        (uf, br, km_inicial, km_final, total_acidentes, total_mortos, 
                         indice_periculosidade, nivel_risco, ano, principais_causas,
                         municipios, horarios_criticos, coordenadas)
                    VALUES 
                        ('{uf}', '{br}', {dados['km_inicial']}, {dados['km_final']}, 
                         {dados['total_acidentes']}, {dados['total_mortos']},
                         {indice_normalizado}, '{nivel_risco}', {ano or 2023},
                         ARRAY{principais_causas}, ARRAY{list(dados['municipios'])},
                         ARRAY{horarios_criticos}, ARRAY{coordenadas})
                    """
                    
                    conn.execute(text(query))
            
            conn.commit()
            logger.info("Trechos perigosos gerados com sucesso!")
    except SQLAlchemyError as e:
        logger.error(f"Erro ao gerar trechos perigosos: {e}")
        raise

def main():
    """Função principal"""
    try:
        # Verificar se DATABASE_URL está configurado
        if not DATABASE_URL:
            raise ValueError("DATABASE_URL não encontrado no arquivo .env")
        
        # Verificar se o banco de dados está acessível
        try:
            engine = create_engine(DATABASE_URL)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Conexão com PostgreSQL estabelecida com sucesso!")
        except SQLAlchemyError as e:
            logger.error(f"Erro ao conectar ao PostgreSQL: {e}")
            raise
        
        # Criar tabelas
        create_tables(engine)
        
        # Caminho para o arquivo CSV
        csv_path = input("Digite o caminho para o arquivo CSV (ou deixe em branco para usar o padrão): ")
        if not csv_path:
            csv_path = "./data/raw/datatran_all_years.csv"
        
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Arquivo não encontrado: {csv_path}")
        
        # Processar CSV
        df = process_csv(csv_path)
        
        # Carregar para PostgreSQL
        load_to_postgres(df, engine)
        
        # Gerar trechos perigosos
        ano = input("Digite o ano para gerar trechos perigosos (ou deixe em branco para todos os anos): ")
        if ano:
            gerar_trechos_perigosos(engine, int(ano))
        else:
            gerar_trechos_perigosos(engine)
        
        logger.info("Processo concluído com sucesso!")
    
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}")
        raise

if __name__ == "__main__":
    main()