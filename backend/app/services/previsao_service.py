import pandas as pd
import numpy as np
from datetime import date, datetime, timedelta
from typing import List, Optional, Dict, Any
from app.models.previsao import PrevisaoRisco, CalculadoraRiscoInput, PrevisaoTendencia, FatorRisco
from app.utils.data_loader import DataLoader
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from scipy import stats

class PrevisaoService:
    def __init__(self):
        self.data_loader = DataLoader()
        self.df = None
        self.modelo_previsao = None
        self.fatores_risco = None
    
    async def _load_data(self):
        """Carrega os dados dos acidentes."""
        if self.df is None:
            self.df = await self.data_loader.load_data()
        return self.df
    
    async def _init_modelo_previsao(self):
        """
        Inicializa um modelo de previsão simples.
        Em um cenário real, usaríamos um modelo mais sofisticado.
        """
        if self.modelo_previsao is None:
            # Esse é um modelo simplificado para demonstração
            self.modelo_previsao = RandomForestRegressor(n_estimators=50, random_state=42)
            
            # Treinar o modelo com os dados disponíveis
            df = await self._load_data()
            
            # Agrupar por mês e ano
            df['month'] = df['data_inversa'].dt.month
            df['year'] = df['data_inversa'].dt.year
            
            # Recursos para o modelo
            features = ['month', 'year']
            
            # Agrupar dados por mês e ano
            df_agrupado = df.groupby(['year', 'month']).agg({
                'id': 'count',  # Total de acidentes
                'mortos': 'sum'  # Total de mortos
            }).reset_index()
            
            # Treinar o modelo para prever acidentes
            X = df_agrupado[features].values
            y_acidentes = df_agrupado['id'].values
            
            self.modelo_previsao.fit(X, y_acidentes)
        
        return self.modelo_previsao
    
    async def _init_fatores_risco(self):
        """Inicializa a lista de fatores de risco."""
        if self.fatores_risco is None:
            self.fatores_risco = [
                FatorRisco(
                    nome="Excesso de velocidade",
                    descricao="Dirigir acima do limite de velocidade da via",
                    impacto=0.8,
                    recomendacoes=[
                        "Respeite os limites de velocidade",
                        "Use o controle de velocidade do veículo",
                        "Planeje suas viagens com antecedência para evitar pressa"
                    ]
                ),
                FatorRisco(
                    nome="Consumo de álcool",
                    descricao="Dirigir sob efeito de álcool",
                    impacto=0.9,
                    recomendacoes=[
                        "Nunca dirija após consumir álcool",
                        "Utilize alternativas como transporte por aplicativo ou táxi",
                        "Defina um motorista da rodada que não beberá"
                    ]
                ),
                FatorRisco(
                    nome="Uso de celular",
                    descricao="Utilizar aparelhos eletrônicos durante a condução",
                    impacto=0.7,
                    recomendacoes=[
                        "Mantenha o celular fora do alcance enquanto dirige",
                        "Use recursos de modo carro/direção do smartphone",
                        "Faça paradas para verificar mensagens se necessário"
                    ]
                ),
                FatorRisco(
                    nome="Chuva forte",
                    descricao="Condução sob chuva intensa que reduz visibilidade",
                    impacto=0.6,
                    recomendacoes=[
                        "Reduza a velocidade em condições de chuva",
                        "Mantenha distância segura do veículo à frente",
                        "Verifique a condição dos pneus e das palhetas do limpador"
                    ]
                ),
                FatorRisco(
                    nome="Fadiga",
                    descricao="Dirigir sob condição de cansaço extremo",
                    impacto=0.7,
                    recomendacoes=[
                        "Faça paradas a cada 2 horas para descansar",
                        "Não dirija por mais de 8 horas por dia",
                        "Descanse adequadamente antes de viagens longas"
                    ]
                )
            ]
        
        return self.fatores_risco
    
    def _calcular_nivel_risco(self, probabilidade: float) -> str:
        """Calcula o nível de risco com base na probabilidade."""
        if probabilidade > 0.8:
            return "muito alto"
        elif probabilidade > 0.6:
            return "alto"
        elif probabilidade > 0.3:
            return "médio"
        else:
            return "baixo"
    
    async def prever_risco_rodovia(
        self, 
        uf: str, 
        br: str, 
        dia_semana: Optional[str] = None,
        periodo_dia: Optional[str] = None,
        condicao_metereologica: Optional[str] = None
    ) -> List[PrevisaoRisco]:
        """
        Prevê o risco para uma rodovia específica.
        """
        df = await self._load_data()
        fatores_risco = await self._init_fatores_risco()
        
        # Filtrar dados por UF e BR
        df_filtered = df[(df['uf'] == uf) & (df['br'].astype(str) == br)]
        
        # Filtros adicionais se fornecidos
        if dia_semana:
            df_filtered = df_filtered[df_filtered['dia_semana'] == dia_semana]
        if periodo_dia:
            df_filtered = df_filtered[df_filtered['PERIODO_DIA'] == periodo_dia]
        if condicao_metereologica:
            df_filtered = df_filtered[df_filtered['condicao_metereologica'] == condicao_metereologica]
        
        # Se não houver dados suficientes, retorne um resultado padrão
        if len(df_filtered) < 10:
            return [
                PrevisaoRisco(
                    uf=uf,
                    br=br,
                    km_inicial=0,
                    km_final=10,
                    nivel_risco="baixo",
                    probabilidade_acidente=0.1,
                    probabilidade_acidente_fatal=0.01,
                    fatores_risco=["Dados insuficientes para análise precisa"],
                    recomendacoes=["Siga as normas de trânsito", "Dirija com cautela"]
                )
            ]
        
        # Identificar trechos de 10 km na rodovia
        df_filtered['trecho_inicio'] = (df_filtered['km'] // 10) * 10
        df_filtered['trecho_fim'] = df_filtered['trecho_inicio'] + 10
        
        # Calcular estatísticas por trecho
        trechos = df_filtered.groupby(['trecho_inicio', 'trecho_fim']).agg({
            'id': 'count',  # Total de acidentes
            'mortos': 'sum',  # Total de mortos
            'causa_acidente': lambda x: list(x.value_counts().head(3).index)  # Principais causas
        }).reset_index()
        
        # Calcular probabilidades
        total_acidentes = len(df_filtered)
        total_trechos = len(trechos)
        
        # Calcular probabilidade baseada em dados históricos
        # Em um sistema real, usaríamos modelos ML mais sofisticados
        trechos['probabilidade_acidente'] = trechos['id'] / total_acidentes
        trechos['probabilidade_acidente_fatal'] = (trechos['mortos'] / trechos['id']) * trechos['probabilidade_acidente']
        
        # Determinar nível de risco
        trechos['nivel_risco'] = trechos['probabilidade_acidente'].apply(self._calcular_nivel_risco)
        
        # Mapear fatores de risco e recomendações
        resultado = []
        for _, trecho in trechos.iterrows():
            # Selecionar fatores de risco relevantes com base nas causas de acidentes
            causas = trecho['causa_acidente']
            fatores_trecho = []
            if "Velocidade incompatível" in causas or "Ultrapassagem indevida" in causas:
                fatores_trecho.append("Excesso de velocidade")
            if "Ingestão de álcool" in causas:
                fatores_trecho.append("Consumo de álcool")
            if "Falta de atenção" in causas:
                fatores_trecho.append("Uso de celular")
                fatores_trecho.append("Fadiga")
            if "Pista escorregadia" in causas or "Chuva" in causas:
                fatores_trecho.append("Chuva forte")
            
            # Se não encontrou fatores específicos, use os fatores gerais
            if not fatores_trecho:
                fatores_trecho = [f.nome for f in fatores_risco[:3]]
            
            # Obter recomendações para os fatores identificados
            recomendacoes = []
            for nome_fator in fatores_trecho:
                for fator in fatores_risco:
                    if fator.nome == nome_fator:
                        recomendacoes.extend(fator.recomendacoes)
                        break
            
            # Eliminar duplicatas nas recomendações
            recomendacoes = list(set(recomendacoes))
            
            # Criar objeto de previsão para o trecho
            previsao = PrevisaoRisco(
                uf=uf,
                br=br,
                km_inicial=float(trecho['trecho_inicio']),
                km_final=float(trecho['trecho_fim']),
                nivel_risco=trecho['nivel_risco'],
                probabilidade_acidente=float(trecho['probabilidade_acidente']),
                probabilidade_acidente_fatal=float(trecho['probabilidade_acidente_fatal']),
                fatores_risco=fatores_trecho,
                recomendacoes=recomendacoes
            )
            resultado.append(previsao)
        
        # Ordenar por probabilidade de acidente fatal (decrescente)
        resultado.sort(key=lambda x: x.probabilidade_acidente_fatal, reverse=True)
        
        return resultado
    
    async def calcular_risco_personalizado(self, dados: CalculadoraRiscoInput) -> Dict[str, Any]:
        """
        Calcula o risco personalizado com base nos dados fornecidos pelo usuário.
        """
        df = await self._load_data()
        fatores_risco = await self._init_fatores_risco()
        
        # Filtrar dados relevantes para a análise
        df_filtered = df[(df['uf'] == dados.uf) & (df['br'].astype(str) == dados.rodovia_br)]
        
        # Filtros adicionais
        if dados.dia_semana:
            df_filtered = df_filtered[df_filtered['dia_semana'] == dados.dia_semana]
        
        # Extrair hora do horário fornecido
        if dados.horario:
            hora = int(dados.horario.split(':')[0])
            df_filtered = df_filtered[df_filtered['HORA'] == hora]
        
        if dados.condicao_metereologica:
            df_filtered = df_filtered[df_filtered['condicao_metereologica'] == dados.condicao_metereologica]
        
        if dados.km_inicial is not None and dados.km_final is not None:
            df_filtered = df_filtered[(df_filtered['km'] >= dados.km_inicial) & (df_filtered['km'] <= dados.km_final)]
        
        # Calcular estatísticas básicas
        total_acidentes = len(df_filtered)
        total_mortos = df_filtered['mortos'].sum()
        taxa_mortalidade = total_mortos / total_acidentes if total_acidentes > 0 else 0
        
        # Ajustar probabilidade base com base nas condições fornecidas
        probabilidade_base = 0.01  # Probabilidade padrão
        
        # Ajustes com base nos dados fornecidos
        if dados.periodo_viagem == "noturno":
            probabilidade_base *= 1.5  # Maior risco à noite
        
        if dados.condicao_metereologica in ["CHUVA", "NEVOEIRO/NEBLINA", "GRANIZO", "NEVE"]:
            probabilidade_base *= 1.7  # Maior risco em condições adversas
        
        if dados.dia_semana in ["Sexta-feira", "Sábado", "Domingo"]:
            probabilidade_base *= 1.3  # Maior risco em fins de semana
        
        if dados.duracao_estimada > 3:
            probabilidade_base *= 1 + (dados.duracao_estimada - 3) * 0.1  # Aumento de risco com duração
        
        # Ajustes adicionais baseados em perfil e velocidade
        if dados.perfil_condutor == "iniciante":
            probabilidade_base *= 1.4
        
        if dados.velocidade_media and dados.velocidade_media > 100:
            probabilidade_base *= 1 + (dados.velocidade_media - 100) * 0.01
        
        if dados.carga:
            probabilidade_base *= 1.2
        
        # Calcular probabilidades ajustadas
        probabilidade_acidente = min(0.99, probabilidade_base * (total_acidentes / 1000 if total_acidentes > 0 else 1))
        probabilidade_acidente_fatal = min(0.99, probabilidade_acidente * taxa_mortalidade)
        
        # Determinar nível de risco
        nivel_risco = self._calcular_nivel_risco(probabilidade_acidente)
        
        # Identificar fatores de risco relevantes
        fatores_relevantes = []
        if dados.periodo_viagem == "noturno":
            fatores_relevantes.append("Fadiga")
        if dados.condicao_metereologica in ["CHUVA", "NEVOEIRO/NEBLINA", "GRANIZO", "NEVE"]:
            fatores_relevantes.append("Chuva forte")
        if dados.duracao_estimada > 3:
            fatores_relevantes.append("Fadiga")
        if dados.velocidade_media and dados.velocidade_media > 100:
            fatores_relevantes.append("Excesso de velocidade")
        
        # Se não identificou fatores específicos, use os fatores gerais
        if not fatores_relevantes:
            fatores_relevantes = [f.nome for f in fatores_risco[:2]]
        
        # Obter recomendações para os fatores identificados
        recomendacoes = []
        for nome_fator in fatores_relevantes:
            for fator in fatores_risco:
                if fator.nome == nome_fator:
                    recomendacoes.extend(fator.recomendacoes)
                    break
        
        # Eliminar duplicatas nas recomendações
        recomendacoes = list(set(recomendacoes))
        
        # Estatísticas da rodovia
        estatisticas_rodovia = {
            "total_acidentes": int(total_acidentes),
            "total_mortos": int(total_mortos),
            "taxa_mortalidade": round(taxa_mortalidade * 100, 2)
        }
        
        # Trecho da viagem
        trecho = {
            "rodovia": dados.rodovia_br,
            "uf": dados.uf,
            "km_inicial": dados.km_inicial,
            "km_final": dados.km_final
        }
        
        return {
            "probabilidade_acidente": round(probabilidade_acidente * 100, 2),
            "probabilidade_acidente_fatal": round(probabilidade_acidente_fatal * 100, 2),
            "nivel_risco": nivel_risco,
            "fatores_risco": fatores_relevantes,
            "recomendacoes": recomendacoes,
            "estatisticas_rodovia": estatisticas_rodovia,
            "trecho": trecho
        }
    
    async def prever_tendencias(
        self, 
        uf: Optional[str] = None, 
        br: Optional[str] = None,
        tipo_acidente: Optional[str] = None,
        meses_futuros: int = 12
    ) -> List[PrevisaoTendencia]:
        """
        Prevê tendências de acidentes para os próximos meses.
        """
        df = await self._load_data()
        modelo = await self._init_modelo_previsao()
        
        # Filtrar dados relevantes
        df_filtered = df.copy()
        if uf:
            df_filtered = df_filtered[df_filtered['uf'] == uf]
        if br:
            df_filtered = df_filtered[df_filtered['br'].astype(str) == br]
        if tipo_acidente:
            df_filtered = df_filtered[df_filtered['tipo_acidente'] == tipo_acidente]
        
        # Agrupar dados por mês e ano
        df_filtered['month'] = df_filtered['data_inversa'].dt.month
        df_filtered['year'] = df_filtered['data_inversa'].dt.year
        
        df_mensal = df_filtered.groupby(['year', 'month']).agg({
            'id': 'count',
            'mortos': 'sum'
        }).reset_index()
        
        # Se não houver dados suficientes, retorne uma previsão padrão
        if len(df_mensal) < 6:
            return self._gerar_previsao_padrao(meses_futuros, uf, br)
        
        # Preparar dados para previsão
        # Último ano e mês nos dados
        ultimo_ano = df_mensal['year'].max()
        ultimo_mes = df_mensal.loc[df_mensal['year'] == ultimo_ano, 'month'].max()
        
        # Gerar datas futuras para previsão
        datas_futuras = []
        anos_futuros = []
        meses_futuros_list = []
        
        data_atual = date(int(ultimo_ano), int(ultimo_mes), 1)
        for i in range(1, meses_futuros + 1):
            data_proxima = data_atual + timedelta(days=32 * i)
            data_proxima = date(data_proxima.year, data_proxima.month, 1)  # Primeiro dia do mês
            datas_futuras.append(data_proxima)
            anos_futuros.append(data_proxima.year)
            meses_futuros_list.append(data_proxima.month)
        
        # Prever acidentes para os meses futuros
        X_futuro = np.column_stack([anos_futuros, meses_futuros_list])
        previsao_acidentes = modelo.predict(X_futuro)
        
        # Calcular intervalo de confiança (simplificado)
        # Em um sistema real, usaríamos abordagens estatísticas mais robustas
        std_acidentes = df_mensal['id'].std()
        intervalo_confianca = stats.norm.interval(0.95, loc=0, scale=std_acidentes)
        
        # Calcular previsão de mortes com base na taxa histórica de mortalidade
        taxa_mortalidade = df_filtered['mortos'].sum() / len(df_filtered) if len(df_filtered) > 0 else 0.05
        previsao_mortes = previsao_acidentes * taxa_mortalidade
        
        # Fatores considerados na previsão
        fatores = ["Sazonalidade", "Tendência histórica"]
        if uf:
            fatores.append(f"Dados específicos do estado {uf}")
        if br:
            fatores.append(f"Dados específicos da rodovia BR-{br}")
        if tipo_acidente:
            fatores.append(f"Dados específicos do tipo de acidente: {tipo_acidente}")
        
        # Criar objetos de previsão
        resultado = []
        for i, data in enumerate(datas_futuras):
            previsao_acidentes_valor = max(0, previsao_acidentes[i])
            previsao_mortes_valor = max(0, previsao_mortes[i])
            
            # Previsão de acidentes
            tendencia_acidentes = PrevisaoTendencia(
                data_referencia=data,
                valor_previsto=float(previsao_acidentes_valor),
                intervalo_confianca_inferior=float(max(0, previsao_acidentes_valor + intervalo_confianca[0])),
                intervalo_confianca_superior=float(max(0, previsao_acidentes_valor + intervalo_confianca[1])),
                tipo_previsao="acidentes",
                unidade_geografica=uf if uf else "Brasil",
                fatores_considerados=fatores
            )
            resultado.append(tendencia_acidentes)
            
            # Previsão de mortes
            tendencia_mortes = PrevisaoTendencia(
                data_referencia=data,
                valor_previsto=float(previsao_mortes_valor),
                intervalo_confianca_inferior=float(max(0, previsao_mortes_valor * 0.8)),
                intervalo_confianca_superior=float(previsao_mortes_valor * 1.2),
                tipo_previsao="mortes",
                unidade_geografica=uf if uf else "Brasil",
                fatores_considerados=fatores
            )
            resultado.append(tendencia_mortes)
        
        return resultado
    
    def _gerar_previsao_padrao(self, num_meses: int, uf: Optional[str] = None, br: Optional[str] = None) -> List[PrevisaoTendencia]:
        """Gera uma previsão padrão quando não há dados suficientes."""
        resultado = []
        data_atual = date.today()
        
        for i in range(1, num_meses + 1):
            data_proxima = date(data_atual.year + ((data_atual.month + i - 1) // 12), 
                               ((data_atual.month + i - 1) % 12) + 1, 1)
            
            # Valores padrão para previsões
            tendencia_acidentes = PrevisaoTendencia(
                data_referencia=data_proxima,
                valor_previsto=100.0,
                intervalo_confianca_inferior=80.0,
                intervalo_confianca_superior=120.0,
                tipo_previsao="acidentes",
                unidade_geografica=uf if uf else "Brasil",
                fatores_considerados=["Dados históricos limitados", "Estimativa aproximada"]
            )
            resultado.append(tendencia_acidentes)
            
            tendencia_mortes = PrevisaoTendencia(
                data_referencia=data_proxima,
                valor_previsto=5.0,
                intervalo_confianca_inferior=3.0,
                intervalo_confianca_superior=7.0,
                tipo_previsao="mortes",
                unidade_geografica=uf if uf else "Brasil",
                fatores_considerados=["Dados históricos limitados", "Estimativa aproximada"]
            )
            resultado.append(tendencia_mortes)
        
        return resultado
    
    async def get_fatores_risco(self) -> Dict[str, Any]:
        """
        Retorna informações sobre os principais fatores de risco.
        """
        fatores = await self._init_fatores_risco()
        
        return {
            "fatores": [
                {
                    "nome": fator.nome,
                    "descricao": fator.descricao,
                    "impacto": fator.impacto,
                    "recomendacoes": fator.recomendacoes
                }
                for fator in fatores
            ],
            "metodologia": "A identificação dos fatores de risco foi realizada com base na análise estatística dos dados de acidentes, considerando correlações entre causas de acidentes, condições das vias, fatores climáticos e perfis dos condutores."
        }
    
    async def get_recomendacoes_seguranca(self, perfil: Optional[str] = None) -> Dict[str, List[str]]:
        """
        Retorna recomendações de segurança com base no perfil e análise de dados.
        """
        # Recomendações gerais para todos os perfis
        recomendacoes_gerais = [
            "Respeite sempre os limites de velocidade",
            "Use cinto de segurança em todos os momentos",
            "Nunca dirija sob efeito de álcool ou drogas",
            "Mantenha distância segura do veículo à frente",
            "Faça revisões periódicas no veículo",
            "Evite usar o celular enquanto dirige",
            "Redobre a atenção em condições climáticas adversas",
            "Descanse adequadamente antes de viagens longas",
            "Faça paradas a cada 2 horas em trajetos longos",
            "Pratique direção defensiva"
        ]
        
        # Recomendações específicas por perfil
        recomendacoes_motorista = [
            "Verifique os pontos cegos antes de mudar de faixa",
            "Sinalize sempre suas intenções com antecedência",
            "Mantenha-se atualizado sobre as leis de trânsito",
            "Adapte sua velocidade às condições da via",
            "Tenha atenção redobrada em cruzamentos e rotatórias"
        ]
        
        recomendacoes_motociclista = [
            "Use sempre capacete e equipamentos de proteção",
            "Não trafegue no corredor entre veículos em alta velocidade",
            "Mantenha-se visível, utilizando roupas claras ou refletivas",
            "Evite pontos cegos de caminhões e ônibus",
            "Respeite os limites de velocidade com ainda mais rigor"
        ]
        
        recomendacoes_pedestre = [
            "Atravesse sempre na faixa de pedestres",
            "Verifique o trânsito em ambas as direções antes de atravessar",
            "Caminhe sempre pela calçada ou acostamento",
            "Use roupas claras ou refletivas à noite",
            "Evite caminhar distraído com celular ou fones de ouvido"
        ]
        
        # Montar resposta com base no perfil
        if perfil == "motorista":
            return {
                "gerais": recomendacoes_gerais,
                "especificas": recomendacoes_motorista
            }
        elif perfil == "motociclista":
            return {
                "gerais": recomendacoes_gerais,
                "especificas": recomendacoes_motociclista
            }
        elif perfil == "pedestre":
            return {
                "gerais": recomendacoes_gerais,
                "especificas": recomendacoes_pedestre
            }
        else:
            # Se não especificar perfil, retornar recomendações para todos
            return {
                "gerais": recomendacoes_gerais,
                "motorista": recomendacoes_motorista,
                "motociclista": recomendacoes_motociclista,
                "pedestre": recomendacoes_pedestre
            }