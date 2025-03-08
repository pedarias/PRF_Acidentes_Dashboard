"""
Script para carregar dados do CSV para o SQLite (Versão Automática)
"""
import os
import pandas as pd
import numpy as np
import sqlite3
import logging
from datetime import datetime
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('csv_loader')

# Carregar variáveis de ambiente
load_dotenv()

# Caminho do banco SQLite
DB_PATH = "./acidentes.db"

def create_tables():
    """Cria tabelas no SQLite"""
    try:
        # Conexão com o banco
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Criar tabela de acidentes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS acidentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uf TEXT,
            br TEXT,
            km REAL,
            data TEXT,
            horario TEXT,
            tipo_acidente TEXT,
            causa_acidente TEXT,
            mortos INTEGER,
            feridos INTEGER,
            feridos_leves INTEGER,
            feridos_graves INTEGER,
            veiculos INTEGER,
            latitude REAL,
            longitude REAL,
            municipio TEXT,
            periodo_dia TEXT,
            dia_semana TEXT,
            fase_dia TEXT,
            condicao_metereologica TEXT,
            tipo_pista TEXT,
            tracado_via TEXT,
            uso_solo TEXT,
            pessoas INTEGER,
            classificacao_acidente TEXT,
            sentido_via TEXT
        )
        """)
        
        # Criar tabela para trechos perigosos
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS trechos_perigosos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uf TEXT,
            br TEXT,
            km_inicial REAL,
            km_final REAL,
            total_acidentes INTEGER,
            total_mortos INTEGER,
            indice_periculosidade REAL,
            nivel_risco TEXT,
            ano INTEGER,
            principais_causas TEXT,
            municipios TEXT,
            horarios_criticos TEXT,
            coordenadas TEXT,
            created_at TEXT
        )
        """)
        
        conn.commit()
        conn.close()
        logger.info("Tabelas criadas com sucesso!")
    except Exception as e:
        logger.error(f"Erro ao criar tabelas: {e}")
        raise

def process_csv(file_path):
    """Processa o CSV e retorna um DataFrame"""
    logger.info(f"Carregando dados do arquivo: {file_path}")
    try:
        # Leitura do CSV
        df = pd.read_csv(file_path, low_memory=False, encoding='latin1')
        
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
        
        # Converter data para string
        if 'data' in df.columns:
            df['data'] = df['data'].dt.strftime('%Y-%m-%d')
            
        # Converter horario para string
        if 'horario' in df.columns:
            df['horario'] = df['horario'].dt.strftime('%H:%M:%S')
        
        logger.info(f"Dados processados com sucesso. Total de registros: {len(df)}")
        
        # Se o dataframe for muito grande, fazer amostragem
        if len(df) > 50000:
            df_sample = df.sample(50000, random_state=42)
            logger.info(f"Usando amostra de 50000 registros para evitar problemas de memória")
            return df_sample
        
        return df
    except Exception as e:
        logger.error(f"Erro ao processar o arquivo CSV: {e}")
        raise

def load_to_sqlite(df, force_reload=True, batch_size=1000):
    """Carrega dados para SQLite"""
    try:
        # Conexão com o banco
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verificar se a tabela já tem dados
        cursor.execute("SELECT COUNT(*) FROM acidentes")
        count = cursor.fetchone()[0]
        
        if count > 0:
            if force_reload:
                cursor.execute("DELETE FROM acidentes")
                conn.commit()
                logger.info("Tabela limpa.")
            else:
                logger.info(f"A tabela já contém {count} registros. Cancelando carga.")
                conn.close()
                return
        
        logger.info(f"Iniciando carga para SQLite: {len(df)} registros")
        
        # Pegar nomes das colunas e filtrar apenas as que existem na tabela
        cursor.execute("PRAGMA table_info(acidentes)")
        table_columns = [row[1] for row in cursor.fetchall()]
        
        # Filtrar colunas do DataFrame
        df_columns = [col for col in df.columns if col in table_columns]
        df_filtered = df[df_columns]
        
        # Carregar em batches para melhor performance
        total_rows = len(df_filtered)
        for i in range(0, total_rows, batch_size):
            end = min(i + batch_size, total_rows)
            batch_df = df_filtered.iloc[i:end]
            
            # Preparar placeholders para a query SQL
            placeholders = ', '.join(['?'] * len(df_columns))
            columns = ', '.join(df_columns)
            
            # Query de inserção
            insert_query = f"INSERT INTO acidentes ({columns}) VALUES ({placeholders})"
            
            # Converter DataFrame para lista de tuplas
            batch_data = [tuple(row) for row in batch_df.values]
            
            # Executar inserção em lote
            cursor.executemany(insert_query, batch_data)
            conn.commit()
            
            logger.info(f"Carregados registros {i+1} até {end} de {total_rows}")
        
        # Criar índices para melhorar performance
        logger.info("Criando índices...")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_acidentes_uf ON acidentes (uf)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_acidentes_data ON acidentes (data)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_acidentes_causa ON acidentes (causa_acidente)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_acidentes_tipo ON acidentes (tipo_acidente)")
        conn.commit()
        
        conn.close()
        logger.info("Carga concluída com sucesso!")
    except Exception as e:
        logger.error(f"Erro ao carregar dados para SQLite: {e}")
        if 'conn' in locals():
            conn.close()
        raise

def gerar_trechos_perigosos(ano=None, force_reload=True):
    """Gera trechos perigosos com base nos dados de acidentes"""
    try:
        logger.info("Gerando trechos perigosos...")
        
        # Conexão com o banco
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Verificar se já existem trechos perigosos
        if force_reload:
            # Limpar trechos existentes
            if ano:
                cursor.execute(f"DELETE FROM trechos_perigosos WHERE ano = {ano}")
            else:
                cursor.execute("DELETE FROM trechos_perigosos")
            conn.commit()
        else:
            # Verificar se já existem trechos
            if ano:
                cursor.execute(f"SELECT COUNT(*) FROM trechos_perigosos WHERE ano = {ano}")
            else:
                cursor.execute("SELECT COUNT(*) FROM trechos_perigosos")
            
            count = cursor.fetchone()[0]
            if count > 0:
                logger.info(f"Já existem {count} trechos perigosos. Pulando geração.")
                conn.close()
                return
        
        # Para cada UF e BR, encontrar segmentos com alta concentração de acidentes
        
        # Obter combinações de UF/BR
        query = "SELECT DISTINCT uf, br FROM acidentes WHERE uf IS NOT NULL AND br IS NOT NULL"
        if ano:
            query += f" AND strftime('%Y', data) = '{ano}'"
        
        uf_br_result = cursor.execute(query).fetchall()
        
        for uf_br in uf_br_result:
            uf, br = uf_br['uf'], uf_br['br']
            
            # Consultar acidentes para esta UF e BR
            acidente_query = f"""
            SELECT 
                uf, br, km, municipio, causa_acidente, 
                horario, latitude, longitude, mortos
            FROM acidentes 
            WHERE uf = ? AND br = ?
            """
            
            params = [uf, br]
            
            if ano:
                acidente_query += f" AND strftime('%Y', data) = ?"
                params.append(str(ano))
            
            acidentes = cursor.execute(acidente_query, params).fetchall()
            
            if len(acidentes) < 10:  # Ignorar rodovias com poucos acidentes
                continue
            
            # Agrupar por segmentos de 5km
            segmentos = {}
            for acidente in acidentes:
                if acidente['km'] is None:
                    continue
                    
                # Arredondar para segmentos de 5km
                segmento_inicio = int(acidente['km'] / 5) * 5
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
                segmentos[segmento_key]['total_mortos'] += acidente['mortos'] or 0
                
                if acidente['municipio']:
                    segmentos[segmento_key]['municipios'].add(acidente['municipio'])
                
                if acidente['causa_acidente']:
                    causa = acidente['causa_acidente']
                    segmentos[segmento_key]['causas'][causa] = segmentos[segmento_key]['causas'].get(causa, 0) + 1
                
                if acidente['horario']:
                    hora = acidente['horario'].split(':')[0] + ':00' if acidente['horario'] else '00:00'
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
                    acidentes_com_coords = [a for a in dados['acidentes'] if a['latitude'] and a['longitude']]
                    if acidentes_com_coords:
                        acidentes_ordenados = sorted(acidentes_com_coords, key=lambda a: a['km'])
                        for acidente in acidentes_ordenados[:5]:  # Usar no máximo 5 pontos
                            if acidente['latitude'] and acidente['longitude']:
                                coordenadas.append([float(acidente['latitude']), float(acidente['longitude'])])
                
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
                insert_query = """
                INSERT INTO trechos_perigosos 
                    (uf, br, km_inicial, km_final, total_acidentes, total_mortos, 
                     indice_periculosidade, nivel_risco, ano, principais_causas,
                     municipios, horarios_criticos, coordenadas, created_at)
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                # Converter listas para string JSON
                import json
                principais_causas_json = json.dumps(principais_causas)
                municipios_json = json.dumps(list(dados['municipios']))
                horarios_criticos_json = json.dumps(horarios_criticos)
                coordenadas_json = json.dumps(coordenadas)
                
                # Parâmetros
                params = (
                    uf, 
                    br, 
                    dados['km_inicial'], 
                    dados['km_final'],
                    dados['total_acidentes'], 
                    dados['total_mortos'],
                    indice_normalizado, 
                    nivel_risco, 
                    ano or 2023,
                    principais_causas_json, 
                    municipios_json, 
                    horarios_criticos_json, 
                    coordenadas_json,
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                )
                
                cursor.execute(insert_query, params)
        
        conn.commit()
        conn.close()
        logger.info("Trechos perigosos gerados com sucesso!")
    except Exception as e:
        logger.error(f"Erro ao gerar trechos perigosos: {e}")
        if 'conn' in locals():
            conn.close()
        raise

def run_auto_load(csv_path=None):
    """Executa todo o processo de carga automaticamente"""
    try:
        # Se não foi fornecido um caminho, usar o padrão
        if not csv_path:
            csv_path = "./data/raw/datatran_all_years.csv"
        
        # Verificar se o arquivo existe
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Arquivo não encontrado: {csv_path}")
        
        # Criar tabelas
        create_tables()
        
        # Processar CSV
        df = process_csv(csv_path)
        
        # Carregar para SQLite
        load_to_sqlite(df, force_reload=True)
        
        # Gerar trechos perigosos
        gerar_trechos_perigosos(force_reload=True)
        
        logger.info("Processo concluído com sucesso!")
        
    except Exception as e:
        logger.error(f"Erro durante a execução: {e}")
        raise

if __name__ == "__main__":
    csv_path = None
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    
    run_auto_load(csv_path)