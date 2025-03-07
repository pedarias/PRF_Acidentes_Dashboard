# API do PRF Acidentes Dashboard

## Visão Geral

A API do PRF Acidentes Dashboard oferece acesso programático aos dados de acidentes de trânsito nas rodovias federais brasileiras, permitindo consultas filtradas, estatísticas e análises preditivas.

Base URL: `http://localhost:8000/api/v1`

## Autenticação

Atualmente, a API não requer autenticação para ambientes de desenvolvimento.

## Formato de Resposta

Todas as respostas são fornecidas no formato JSON.

## Endpoints

### Acidentes

#### Listar Acidentes

```
GET /acidentes
```

Retorna uma lista paginada de acidentes com opções de filtro.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| uf | string | Estado (UF) |
| ano | integer | Ano do acidente |
| causa | string | Causa do acidente |
| tipo | string | Tipo de acidente |
| condicao_metereologica | string | Condição meteorológica |
| limit | integer | Limite de resultados (padrão: 100) |
| offset | integer | Offset para paginação (padrão: 0) |

**Exemplo de Resposta:**

```json
[
  {
    "id": 123456,
    "data": "2023-01-15",
    "hora": "14:30",
    "uf": "PR",
    "br": "376",
    "km": 123.5,
    "municipio": "Curitiba",
    "tipo_acidente": "Colisão traseira",
    "causa_acidente": "Falta de atenção",
    "classificacao_acidente": "Com Vítimas Feridas",
    "mortos": 0,
    "feridos": 2,
    "latitude": -25.4284,
    "longitude": -49.2733
  },
  ...
]
```

#### Contar Acidentes

```
GET /acidentes/total
```

Retorna o total de acidentes que correspondem aos filtros aplicados.

**Parâmetros:**
(Mesmos parâmetros de filtro do endpoint `/acidentes`)

**Exemplo de Resposta:**

```json
1234
```

#### Listar Rodovias

```
GET /acidentes/rodovias
```

Retorna a lista de todas as rodovias presentes nos dados.

**Exemplo de Resposta:**

```json
["101", "116", "277", "376", "381", ...]
```

#### Listar Causas

```
GET /acidentes/causas
```

Retorna a lista de todas as causas de acidentes presentes nos dados.

**Exemplo de Resposta:**

```json
["Falta de atenção", "Velocidade incompatível", "Ingestão de álcool", ...]
```

#### Listar Tipos

```
GET /acidentes/tipos
```

Retorna a lista de todos os tipos de acidentes presentes nos dados.

**Exemplo de Resposta:**

```json
["Colisão frontal", "Colisão traseira", "Saída de pista", ...]
```

#### Listar Condições Meteorológicas

```
GET /acidentes/condicoes-meteorologicas
```

Retorna a lista de todas as condições meteorológicas presentes nos dados.

**Exemplo de Resposta:**

```json
["CÉU CLARO", "CHUVA", "NUBLADO", "NEBLINA/NEVOEIRO", ...]
```

### Estatísticas

#### Resumo Estatístico

```
GET /estatisticas/resumo
```

Retorna um resumo estatístico dos acidentes.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |
| uf | string | Filtrar por UF |

**Exemplo de Resposta:**

```json
{
  "total_acidentes": 54321,
  "total_mortos": 987,
  "total_feridos": 8765,
  "media_mortos_por_acidente": 0.018,
  "top_causas": {
    "Falta de atenção": 12345,
    "Velocidade incompatível": 8765,
    "Ingestão de álcool": 4321
  },
  "horas_criticas": {
    "18": 987,
    "19": 954,
    "17": 876
  },
  "condicoes_meteorologicas": {
    "CÉU CLARO": 34567,
    "CHUVA": 12345,
    "NUBLADO": 5432
  },
  "comparativo_ano_anterior": {
    "ano": 2022,
    "mortos": 1012,
    "variacao_percentual": -2.47
  }
}
```

#### Estatísticas Anuais

```
GET /estatisticas/anuais
```

Retorna estatísticas agrupadas por ano.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| uf | string | Filtrar por UF |

**Exemplo de Resposta:**

```json
[
  {
    "ano": 2023,
    "total_acidentes": 54321,
    "total_mortos": 987,
    "total_feridos": 8765,
    "media_mortos_por_acidente": 0.018,
    "variacao_percentual": -2.47
  },
  {
    "ano": 2022,
    "total_acidentes": 56789,
    "total_mortos": 1012,
    "total_feridos": 9876,
    "media_mortos_por_acidente": 0.017,
    "variacao_percentual": 3.21
  },
  ...
]
```

#### Estatísticas por Causas

```
GET /estatisticas/por-causas
```

Retorna estatísticas agrupadas por causa de acidente.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |
| uf | string | Filtrar por UF |
| top | integer | Número máximo de causas a retornar (padrão: 10) |

**Exemplo de Resposta:**

```json
[
  {
    "causa": "Falta de atenção",
    "total_acidentes": 12345,
    "total_mortos": 234,
    "media_mortos": 0.019,
    "percentual": 22.7
  },
  ...
]
```

#### Estatísticas por Tipos

```
GET /estatisticas/por-tipos
```

Retorna estatísticas agrupadas por tipo de acidente.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |
| uf | string | Filtrar por UF |
| top | integer | Número máximo de tipos a retornar (padrão: 10) |

**Exemplo de Resposta:**

```json
[
  {
    "tipo": "Colisão frontal",
    "total_acidentes": 5432,
    "total_mortos": 345,
    "media_mortos": 0.063,
    "percentual": 10.0
  },
  ...
]
```

#### Estatísticas por Hora

```
GET /estatisticas/por-hora
```

Retorna estatísticas agrupadas por hora do dia.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |
| uf | string | Filtrar por UF |
| condicao_metereologica | string | Filtrar por condição meteorológica |

**Exemplo de Resposta:**

```json
[
  {
    "hora": 0,
    "total_acidentes": 1234,
    "total_mortos": 45,
    "percentual": 2.3,
    "condicao_metereologica": "CÉU CLARO"
  },
  {
    "hora": 1,
    "total_acidentes": 987,
    "total_mortos": 32,
    "percentual": 1.8,
    "condicao_metereologica": "CÉU CLARO"
  },
  ...
]
```

#### Estatísticas por UF

```
GET /estatisticas/por-uf
```

Retorna estatísticas agrupadas por UF.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |

**Exemplo de Resposta:**

```json
[
  {
    "uf": "SP",
    "total_acidentes": 12345,
    "total_mortos": 456,
    "media_mortos": 0.037,
    "rodovia_mais_perigosa": "BR-116",
    "acidentes_por_100k_habitantes": 28.4
  },
  ...
]
```

### Mapas

#### Pontos de Acidentes

```
GET /mapas/pontos
```

Retorna pontos de acidentes para visualização no mapa.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |
| uf | string | Filtrar por UF |
| br | string | Filtrar por rodovia |
| tipo_acidente | string | Filtrar por tipo de acidente |
| limit | integer | Limite de pontos a retornar (padrão: 1000) |

**Exemplo de Resposta:**

```json
[
  {
    "id": 123456,
    "latitude": -25.4284,
    "longitude": -49.2733,
    "data": "2023-01-15",
    "hora": "14:30",
    "uf": "PR",
    "br": "376",
    "km": 123.5,
    "municipio": "Curitiba",
    "tipo_acidente": "Colisão traseira",
    "causa_acidente": "Falta de atenção",
    "mortos": 0,
    "feridos": 2
  },
  ...
]
```

#### Trechos Perigosos

```
GET /mapas/trechos-perigosos
```

Retorna os trechos mais perigosos de rodovias.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| ano | integer | Filtrar por ano |
| uf | string | Filtrar por UF |
| br | string | Filtrar por rodovia |
| top | integer | Número máximo de trechos a retornar (padrão: 10) |

**Exemplo de Resposta:**

```json
[
  {
    "uf": "PR",
    "br": "376",
    "km_inicial": 120.0,
    "km_final": 130.0,
    "municipio": "Curitiba",
    "total_acidentes": 123,
    "total_mortos": 15,
    "indice_periculosidade": 8.7,
    "coordenadas": [[lat1, lng1], [lat2, lng2], ...],
    "causas_principais": {
      "Falta de atenção": 45,
      "Velocidade incompatível": 23,
      "Ultrapassagem indevida": 18
    }
  },
  ...
]
```

### Previsão

#### Risco de Rodovia

```
GET /previsao/risco-rodovia
```

Calcula o risco para uma rodovia específica.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| uf | string | Estado (UF) da rodovia |
| br | string | Número da rodovia (BR) |
| dia_semana | string | Dia da semana para estimar o risco |
| periodo_dia | string | Período do dia para estimar o risco |
| condicao_metereologica | string | Condição meteorológica para estimar o risco |

**Exemplo de Resposta:**

```json
{
  "uf": "PR",
  "br": "376",
  "km_inicial": 0.0,
  "km_final": 150.0,
  "nivel_risco": 0.72,
  "total_acidentes_trecho": 423,
  "total_mortos_trecho": 32,
  "media_acidentes_por_km": 2.82,
  "fatores_risco": [
    {
      "fator": "Velocidade média elevada",
      "peso": 0.35
    },
    {
      "fator": "Condições metereológicas",
      "peso": 0.25
    },
    ...
  ]
}
```

#### Calculadora de Risco Personalizado

```
POST /previsao/calculadora-risco
```

Calcula o risco personalizado com base em dados fornecidos pelo usuário.

**Corpo da Requisição:**

```json
{
  "uf": "PR",
  "rodovia_br": "376",
  "dia_semana": "Sexta-feira",
  "horario": "19:30",
  "periodo_viagem": "noturno",
  "condicao_metereologica": "CHUVA",
  "velocidade_media": 100,
  "duracao_estimada": 4,
  "perfil_condutor": "experiente",
  "km_inicial": 120,
  "km_final": 180,
  "carga": false
}
```

**Exemplo de Resposta:**

```json
{
  "probabilidade_acidente": 15.87,
  "probabilidade_acidente_fatal": 3.42,
  "nivel_risco": "alto",
  "fatores_risco": [
    "Velocidade média elevada",
    "Condições metereológicas",
    "Período noturno"
  ],
  "recomendacoes": [
    "Reduza a velocidade em condições de chuva",
    "Faça paradas regulares para descanso",
    "Mantenha distância segura do veículo à frente"
  ],
  "estatisticas_rodovia": {
    "total_acidentes": 423,
    "total_mortos": 32,
    "taxa_mortalidade": 7.56
  },
  "trecho": {
    "rodovia": "376",
    "uf": "PR",
    "km_inicial": 120,
    "km_final": 180
  }
}
```

#### Recomendações de Segurança

```
GET /previsao/recomendacoes
```

Retorna recomendações de segurança baseadas no perfil do usuário.

**Parâmetros:**

| Nome | Tipo | Descrição |
|------|------|-----------|
| perfil | string | Perfil do usuário (ex: motorista, motociclista, pedestre) |

**Exemplo de Resposta:**

```json
{
  "gerais": [
    "Respeite sempre os limites de velocidade",
    "Use cinto de segurança em todos os momentos",
    ...
  ],
  "especificas": [
    "Verifique os pontos cegos antes de mudar de faixa",
    "Sinalize sempre suas intenções com antecedência",
    ...
  ]
}
```

## Tratamento de Erros

A API retorna códigos de status HTTP padrão:

- 200: Sucesso
- 400: Requisição inválida
- 404: Recurso não encontrado
- 500: Erro interno do servidor

Em caso de erro, a resposta incluirá detalhes sobre o problema:

```json
{
  "detail": "Mensagem de erro detalhada"
}
```

## Limites de Uso

Atualmente, não há limites de uso implementados, mas solicitações massivas devem ser evitadas para garantir o desempenho do sistema.