import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Any
from app.models.estatistica import (
    EstatisticaAnual, 
    EstatisticaCausa,
    EstatisticaTipo,
    EstatisticaHora,
    EstatisticaUF
)
from app.utils.data_loader import DataLoader

class EstatisticaService:
    def __init__(self):
        self.data_loader = DataLoader()
        self.df = None
    
    async def _load_data(self):
        """Carrega os dados dos acidentes."""
        if self.df is None:
            self.df = await self.data_loader.load_data()
        return self.df
    
    async def get_resumo(self, ano: Optional[int] = None, uf: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna um resumo estatístico dos acidentes.
        """
        df = await self._load_data()
        
        # Filtrar por ano e UF, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        
        # Cálculo das estatísticas
        total_acidentes = len(df)
        total_mortos = df['mortos'].sum()
        total_feridos = df['TOTAL_FERIDOS'].sum() if 'TOTAL_FERIDOS' in df.columns else 0
        media_mortos = total_mortos / total_acidentes if total_acidentes > 0 else 0
        
        # Top 3 causas
        top_causas = df['causa_acidente'].value_counts().head(3).to_dict()
        
        # Top 3 tipos
        top_tipos = df['tipo_acidente'].value_counts().head(3).to_dict()
        
        # Estatísticas por hora do dia
        horas_criticas = df.groupby('HORA')['mortos'].sum().nlargest(3).to_dict()
        
        # Estatísticas por condição meteorológica
        condicoes = df.groupby('condicao_metereologica')['mortos'].sum().sort_values(ascending=False).head(3).to_dict()
        
        # Comparativo de mortes em relação ao ano anterior, se filtro por ano for aplicado
        comparativo_ano_anterior = None
        if ano and ano > 2014:  # Supondo que 2014 é o primeiro ano nos dados
            df_ano_anterior = await self._load_data()
            df_ano_anterior = df_ano_anterior[df_ano_anterior['year'] == ano - 1]
            if uf:
                df_ano_anterior = df_ano_anterior[df_ano_anterior['uf'] == uf]
            
            mortos_ano_anterior = df_ano_anterior['mortos'].sum()
            variacao = ((total_mortos - mortos_ano_anterior) / mortos_ano_anterior) * 100 if mortos_ano_anterior > 0 else 0
            
            comparativo_ano_anterior = {
                "ano": ano - 1,
                "mortos": int(mortos_ano_anterior),
                "variacao_percentual": round(variacao, 2)
            }
        
        return {
            "total_acidentes": total_acidentes,
            "total_mortos": int(total_mortos),
            "total_feridos": int(total_feridos),
            "media_mortos_por_acidente": round(media_mortos, 2),
            "top_causas": top_causas,
            "top_tipos": top_tipos,
            "horas_criticas": horas_criticas,
            "condicoes_meteorologicas": condicoes,
            "comparativo_ano_anterior": comparativo_ano_anterior
        }
    
    async def get_estatisticas_anuais(self, uf: Optional[str] = None) -> List[EstatisticaAnual]:
        """
        Retorna estatísticas agrupadas por ano.
        """
        df = await self._load_data()
        
        # Filtrar por UF, se especificado
        if uf:
            df = df[df['uf'] == uf]
        
        # Agrupar por ano
        df_anual = df.groupby('year').agg({
            'id': 'count',
            'mortos': 'sum',
            'TOTAL_FERIDOS': 'sum' if 'TOTAL_FERIDOS' in df.columns else lambda x: 0
        }).reset_index()
        
        df_anual.columns = ['ano', 'total_acidentes', 'total_mortos', 'total_feridos']
        
        # Calcular médias
        df_anual['media_mortos_por_acidente'] = df_anual['total_mortos'] / df_anual['total_acidentes']
        
        # Calcular variação percentual em relação ao ano anterior
        df_anual['variacao_percentual'] = df_anual['total_mortos'].pct_change() * 100
        
        # Converter para o modelo
        result = []
        for _, row in df_anual.iterrows():
            estatistica = EstatisticaAnual(
                ano=int(row['ano']),
                total_acidentes=int(row['total_acidentes']),
                total_mortos=int(row['total_mortos']),
                total_feridos=int(row['total_feridos']),
                media_mortos_por_acidente=float(row['media_mortos_por_acidente']),
                variacao_percentual=float(row['variacao_percentual']) if not pd.isna(row['variacao_percentual']) else None
            )
            result.append(estatistica)
        
        return result
    
    async def get_estatisticas_por_causa(self, ano: Optional[int] = None, uf: Optional[str] = None, top: int = 10) -> List[EstatisticaCausa]:
        """
        Retorna estatísticas agrupadas por causa de acidente.
        """
        df = await self._load_data()
        
        # Filtrar por ano e UF, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        
        # Total de acidentes
        total_acidentes = len(df)
        
        # Agrupar por causa
        df_causa = df.groupby('causa_acidente').agg({
            'id': 'count',
            'mortos': ['sum', 'mean']
        }).reset_index()
        
        df_causa.columns = ['causa', 'total_acidentes', 'total_mortos', 'media_mortos']
        
        # Calcular percentuais
        df_causa['percentual'] = (df_causa['total_acidentes'] / total_acidentes) * 100
        
        # Ordenar e pegar os top N
        df_causa_top = df_causa.sort_values('total_acidentes', ascending=False).head(top)
        
        # Converter para o modelo
        result = []
        for _, row in df_causa_top.iterrows():
            estatistica = EstatisticaCausa(
                causa=row['causa'],
                total_acidentes=int(row['total_acidentes']),
                total_mortos=int(row['total_mortos']),
                media_mortos=float(row['media_mortos']),
                percentual=float(row['percentual'])
            )
            result.append(estatistica)
        
        return result
    
    async def get_estatisticas_por_tipo(self, ano: Optional[int] = None, uf: Optional[str] = None, top: int = 10) -> List[EstatisticaTipo]:
        """
        Retorna estatísticas agrupadas por tipo de acidente.
        """
        df = await self._load_data()
        
        # Filtrar por ano e UF, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        
        # Total de acidentes
        total_acidentes = len(df)
        
        # Agrupar por tipo
        df_tipo = df.groupby('tipo_acidente').agg({
            'id': 'count',
            'mortos': ['sum', 'mean']
        }).reset_index()
        
        df_tipo.columns = ['tipo', 'total_acidentes', 'total_mortos', 'media_mortos']
        
        # Calcular percentuais
        df_tipo['percentual'] = (df_tipo['total_acidentes'] / total_acidentes) * 100
        
        # Ordenar e pegar os top N
        df_tipo_top = df_tipo.sort_values('total_acidentes', ascending=False).head(top)
        
        # Converter para o modelo
        result = []
        for _, row in df_tipo_top.iterrows():
            estatistica = EstatisticaTipo(
                tipo=row['tipo'],
                total_acidentes=int(row['total_acidentes']),
                total_mortos=int(row['total_mortos']),
                media_mortos=float(row['media_mortos']),
                percentual=float(row['percentual'])
            )
            result.append(estatistica)
        
        return result
    
    async def get_estatisticas_por_hora(self, ano: Optional[int] = None, uf: Optional[str] = None, condicao_metereologica: Optional[str] = None) -> List[EstatisticaHora]:
        """
        Retorna estatísticas agrupadas por hora do dia.
        """
        df = await self._load_data()
        
        # Filtrar por ano, UF e condição meteorológica, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        if condicao_metereologica:
            df = df[df['condicao_metereologica'] == condicao_metereologica]
        
        # Total de acidentes
        total_acidentes = len(df)
        
        # Se não houver condição meteorológica específica, agrupar também por essa condição
        if condicao_metereologica:
            df_hora = df.groupby('HORA').agg({
                'id': 'count',
                'mortos': 'sum'
            }).reset_index()
            
            df_hora.columns = ['hora', 'total_acidentes', 'total_mortos']
            df_hora['condicao_metereologica'] = condicao_metereologica
        else:
            df_hora = df.groupby(['HORA', 'condicao_metereologica']).agg({
                'id': 'count',
                'mortos': 'sum'
            }).reset_index()
            
            df_hora.columns = ['hora', 'condicao_metereologica', 'total_acidentes', 'total_mortos']
        
        # Calcular percentuais
        df_hora['percentual'] = (df_hora['total_acidentes'] / total_acidentes) * 100
        
        # Ordenar por hora
        df_hora_sorted = df_hora.sort_values('hora')
        
        # Converter para o modelo
        result = []
        for _, row in df_hora_sorted.iterrows():
            estatistica = EstatisticaHora(
                hora=int(row['hora']),
                total_acidentes=int(row['total_acidentes']),
                total_mortos=int(row['total_mortos']),
                condicao_metereologica=row['condicao_metereologica'],
                percentual=float(row['percentual'])
            )
            result.append(estatistica)
        
        return result
    
    async def get_estatisticas_por_uf(self, ano: Optional[int] = None) -> List[EstatisticaUF]:
        """
        Retorna estatísticas agrupadas por UF.
        """
        df = await self._load_data()
        
        # Filtrar por ano, se especificado
        if ano:
            df = df[df['year'] == ano]
        
        # Agrupar por UF
        df_uf = df.groupby('uf').agg({
            'id': 'count',
            'mortos': ['sum', 'mean']
        }).reset_index()
        
        df_uf.columns = ['uf', 'total_acidentes', 'total_mortos', 'media_mortos']
        
        # Encontrar a rodovia mais perigosa para cada UF
        rodovias_perigosas = {}
        for uf in df_uf['uf']:
            df_uf_rodovias = df[df['uf'] == uf].groupby('br').agg({
                'mortos': 'sum'
            }).reset_index()
            
            if not df_uf_rodovias.empty:
                rodovia_mais_perigosa = df_uf_rodovias.loc[df_uf_rodovias['mortos'].idxmax()]
                rodovias_perigosas[uf] = f"BR-{rodovia_mais_perigosa['br']}"
            else:
                rodovias_perigosas[uf] = "Não disponível"
        
        # TODO: Adicionar taxa por 100 mil habitantes (necessitaria de dados populacionais)
        
        # Converter para o modelo
        result = []
        for _, row in df_uf.iterrows():
            estatistica = EstatisticaUF(
                uf=row['uf'],
                total_acidentes=int(row['total_acidentes']),
                total_mortos=int(row['total_mortos']),
                media_mortos=float(row['media_mortos']),
                rodovia_mais_perigosa=rodovias_perigosas.get(row['uf'], "Não disponível"),
                acidentes_por_100k_habitantes=None  # Não temos esses dados ainda
            )
            result.append(estatistica)
        
        # Ordenar por total de acidentes
        result.sort(key=lambda x: x.total_acidentes, reverse=True)
        
        return result
    
    async def get_estatisticas_por_periodo_dia(self, ano: Optional[int] = None, uf: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna estatísticas agrupadas por período do dia.
        """
        df = await self._load_data()
        
        # Filtrar por ano e UF, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        
        # Total de acidentes
        total_acidentes = len(df)
        
        # Agrupar por período do dia
        df_periodo = df.groupby('PERIODO_DIA').agg({
            'id': 'count',
            'mortos': ['sum', 'mean']
        }).reset_index()
        
        df_periodo.columns = ['periodo', 'total_acidentes', 'total_mortos', 'media_mortos']
        
        # Calcular percentuais
        df_periodo['percentual'] = (df_periodo['total_acidentes'] / total_acidentes) * 100
        
        # Converter para dicionário formatado
        periodos = {}
        for _, row in df_periodo.iterrows():
            periodo = row['periodo']
            periodos[periodo] = {
                "total_acidentes": int(row['total_acidentes']),
                "total_mortos": int(row['total_mortos']),
                "media_mortos": float(row['media_mortos']),
                "percentual": float(row['percentual'])
            }
        
        return periodos
    
    async def get_estatisticas_por_dia_semana(self, ano: Optional[int] = None, uf: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna estatísticas agrupadas por dia da semana.
        """
        df = await self._load_data()
        
        # Filtrar por ano e UF, se especificados
        if ano:
            df = df[df['year'] == ano]
        if uf:
            df = df[df['uf'] == uf]
        
        # Total de acidentes
        total_acidentes = len(df)
        
        # Mapear dias da semana para tipo (útil ou fim de semana)
        df['tipo_dia'] = df['dia_semana'].apply(
            lambda x: 'Fim de Semana' if x.lower() in ['sábado', 'sabado', 'domingo'] else 'Dia Útil'
        )
        
        # Agrupar por dia da semana
        df_dia = df.groupby(['dia_semana', 'tipo_dia']).agg({
            'id': 'count',
            'mortos': ['sum', 'mean']
        }).reset_index()
        
        df_dia.columns = ['dia', 'tipo_dia', 'total_acidentes', 'total_mortos', 'media_mortos']
        
        # Calcular percentuais
        df_dia['percentual'] = (df_dia['total_acidentes'] / total_acidentes) * 100
        
        # Converter para dicionário formatado
        dias = {}
        for _, row in df_dia.iterrows():
            dia = row['dia']
            dias[dia] = {
                "total_acidentes": int(row['total_acidentes']),
                "total_mortos": int(row['total_mortos']),
                "media_mortos": float(row['media_mortos']),
                "percentual": float(row['percentual']),
                "tipo_dia": row['tipo_dia']
            }
        
        # Agrupar também por tipo de dia
        df_tipo_dia = df.groupby('tipo_dia').agg({
            'id': 'count',
            'mortos': ['sum', 'mean']
        }).reset_index()
        
        df_tipo_dia.columns = ['tipo_dia', 'total_acidentes', 'total_mortos', 'media_mortos']
        
        # Calcular percentuais
        df_tipo_dia['percentual'] = (df_tipo_dia['total_acidentes'] / total_acidentes) * 100
        
        # Converter para dicionário
        tipo_dia = {}
        for _, row in df_tipo_dia.iterrows():
            tipo = row['tipo_dia']
            tipo_dia[tipo] = {
                "total_acidentes": int(row['total_acidentes']),
                "total_mortos": int(row['total_mortos']),
                "media_mortos": float(row['media_mortos']),
                "percentual": float(row['percentual'])
            }
        
        return {
            "por_dia": dias,
            "por_tipo": tipo_dia
        }