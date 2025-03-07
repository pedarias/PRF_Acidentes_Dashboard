import pandas as pd
import os
from app.core.config import settings
import asyncio
from datetime import datetime

class DataLoader:
    """
    Classe responsável pelo carregamento e pré-processamento dos dados de acidentes.
    """
    
    def __init__(self):
        self.file_path = os.path.join(settings.DATA_DIR, 'datatran_all_years.csv')
        print(f"Loading data from: {self.file_path}")
        self.cached_data = None
    
    async def load_data(self) -> pd.DataFrame:
        """
        Carrega os dados do arquivo CSV e realiza o pré-processamento.
        
        Returns:
            pd.DataFrame: DataFrame com os dados processados.
        """
        if self.cached_data is not None:
            return self.cached_data
        
        # Simular operação assíncrona para carregamento de dados
        # Em aplicações reais, isso poderia ser uma operação de leitura de banco de dados
        loop = asyncio.get_event_loop()
        df = await loop.run_in_executor(None, self._load_data_sync)
        
        self.cached_data = df
        return df
    
    def _load_data_sync(self) -> pd.DataFrame:
        """
        Carrega os dados de forma síncrona e faz o pré-processamento.
        
        Returns:
            pd.DataFrame: DataFrame com os dados processados.
        """
        # Verificar se o arquivo existe
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"Arquivo de dados não encontrado: {self.file_path}")
        
        # Carregar os dados
        df = pd.read_csv(self.file_path, low_memory=False)
        
        # Pré-processamento padrão
        df = self._preprocess_data(df)
        
        return df
    
    def _preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Realiza o pré-processamento dos dados.
        
        Args:
            df (pd.DataFrame): DataFrame original.
            
        Returns:
            pd.DataFrame: DataFrame processado.
        """
        # Converter data_inversa para datetime
        df['data_inversa'] = pd.to_datetime(df['data_inversa'], errors='coerce')
        
        # Extrair o ano
        df['year'] = df['data_inversa'].dt.year
        
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
            df['TOTAL_FERIDOS'] = df['feridos_leves'] + df['feridos_graves']
        
        # Garantir que mortos seja numérico
        if 'mortos' in df.columns:
            df['mortos'] = df['mortos'].fillna(0).astype(int)
        
        # Padronização de texto para colunas categóricas
        if 'condicao_metereologica' in df.columns:
            df['condicao_metereologica'] = df['condicao_metereologica'].str.upper()
        
        # Preenchimento de valores faltantes para colunas numéricas
        fill_numeric = ['km', 'latitude', 'longitude', 'veiculos', 'pessoas', 'mortos', 'year']
        fill_numeric = [col for col in fill_numeric if col in df.columns]
        
        for col in fill_numeric:
            if col == 'year' and df['year'].isna().sum() > 0:
                # Completar anos faltantes com base na data_inversa
                df.loc[df['year'].isna(), 'year'] = df.loc[df['year'].isna(), 'data_inversa'].dt.year
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
        
        return df