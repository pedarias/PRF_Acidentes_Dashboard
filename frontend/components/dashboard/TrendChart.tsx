import React, { useEffect, useRef, useState } from 'react';
import { Box, Skeleton, Typography, Grid, Paper } from '@mui/material';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface TrendData {
  ano: number;
  total_acidentes: number;
  total_mortos: number;
  total_feridos?: number;
  variacao_percentual?: number | null;
  dados_mensais?: { 
    mes: number; 
    total_acidentes: number;
    total_mortos?: number;
    total_feridos?: number;
  }[];
}

interface TrendChartProps {
  data: TrendData[];
  isLoading: boolean;
  height?: number;
}

// Nomes dos meses em português
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Dados mensais reais para demonstração (use isso até a API fornecer dados reais)
const DADOS_MENSAIS_EXEMPLO = [
  { mes: 1, nome: 'Janeiro', acidentes: 5754 },
  { mes: 2, nome: 'Fevereiro', acidentes: 5279 },
  { mes: 3, nome: 'Março', acidentes: 5955 },
  { mes: 4, nome: 'Abril', acidentes: 5832 },
  { mes: 5, nome: 'Maio', acidentes: 6182 },
  { mes: 6, nome: 'Junho', acidentes: 6215 },
  { mes: 7, nome: 'Julho', acidentes: 6390 },
  { mes: 8, nome: 'Agosto', acidentes: 6155 },
  { mes: 9, nome: 'Setembro', acidentes: 6166 }
];

const TrendChart: React.FC<TrendChartProps> = ({ data, isLoading, height = 350 }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [estatisticasMensais, setEstatisticasMensais] = useState<{
    total_acidentes: number;
    media_mensal: number;
    mes_mais_acidentes: string;
    mes_menos_acidentes: string;
    diferenca_mais_menos: number;
    maximo_acidentes: number;
    minimo_acidentes: number;
    dadosMensaisChart: {nome: string, acidentes: number}[];
  } | null>(null);

  // Função para calcular estatísticas mensais
  useEffect(() => {
    if (isLoading || !data || data.length === 0) return;

    // Usamos dados mensais da API se disponíveis, senão usamos os dados de exemplo
    // Em um ambiente real, esses dados viriam apenas da API
    let dadosMensais;
    
    // Encontrar o último ano disponível nos dados (mais recente)
    const dadosOrdenadosPorAno = [...data].sort((a, b) => b.ano - a.ano);
    const dadosMaisRecentes = dadosOrdenadosPorAno[0];
    
    if (dadosMaisRecentes && dadosMaisRecentes.dados_mensais) {
      // Converter estrutura da API para o formato que precisamos
      dadosMensais = dadosMaisRecentes.dados_mensais.map(item => ({
        mes: item.mes,
        nome: MESES[item.mes - 1],
        acidentes: item.total_acidentes
      }));
    } else {
      // Usar dados de exemplo
      dadosMensais = DADOS_MENSAIS_EXEMPLO;
    }

    if (dadosMensais && dadosMensais.length > 0) {
      // Encontra o mês com mais acidentes
      const mesMaisAcidentes = [...dadosMensais].sort((a, b) => b.acidentes - a.acidentes)[0];
      
      // Encontra o mês com menos acidentes
      const mesMenosAcidentes = [...dadosMensais].sort((a, b) => a.acidentes - b.acidentes)[0];
      
      // Calcula a diferença entre o mês com mais e menos acidentes
      const diferencaMaisMenos = mesMaisAcidentes.acidentes - mesMenosAcidentes.acidentes;
      
      setEstatisticasMensais({
        total_acidentes: 0, // Mantido para compatibilidade
        media_mensal: 0, // Mantido para compatibilidade
        mes_mais_acidentes: mesMaisAcidentes.nome,
        mes_menos_acidentes: mesMenosAcidentes.nome,
        diferenca_mais_menos: diferencaMaisMenos,
        maximo_acidentes: mesMaisAcidentes.acidentes,
        minimo_acidentes: mesMenosAcidentes.acidentes,
        dadosMensaisChart: dadosMensais
      });
    }
  }, [data, isLoading]);

  // Função para criar e atualizar o gráfico
  useEffect(() => {
    if (isLoading || !chartRef.current) return;

    // Destruir instância anterior caso exista
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Organizar dados por ano em ordem crescente
    const sortedData = [...data].sort((a, b) => a.ano - b.ano);
    
    // Extrair anos, totais de acidentes e mortos
    const anos = sortedData.map(item => item.ano);
    const totaisAcidentes = sortedData.map(item => item.total_acidentes);
    const totaisMortos = sortedData.map(item => item.total_mortos);
    const totaisFeridos = sortedData.map(item => item.total_feridos || 0);
    
    // Calcular variações percentuais para tendência
    const variacoesMortos = sortedData.map((item, index) => {
      if (index === 0 || !item.variacao_percentual) return null;
      return item.variacao_percentual;
    });

    // Criar o gráfico
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: anos,
          datasets: [
            {
              label: 'Total de Acidentes',
              data: totaisAcidentes,
              backgroundColor: 'rgba(0, 119, 255, 0.1)', // Azul (PRF)
              borderColor: 'rgba(0, 119, 255, 0.8)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(0, 119, 255, 1)',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
              fill: true,
              yAxisID: 'y',
            },
            {
              label: 'Total de Mortos',
              data: totaisMortos,
              backgroundColor: 'rgba(255, 68, 68, 0.1)', // Vermelho (Perigo)
              borderColor: 'rgba(255, 68, 68, 0.8)',
              borderWidth: 2,
              pointBackgroundColor: 'rgba(255, 68, 68, 1)',
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.3,
              fill: true,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 500 // Shorter animation for better performance
          },
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.parsed.y !== null) {
                    const value = context.parsed.y;
                    label += value.toLocaleString('pt-BR');
                    
                    // Adicionar informação de variação para mortos
                    if (context.dataset.label === 'Total de Mortos' && variacoesMortos[context.dataIndex] !== null) {
                      const variacao = variacoesMortos[context.dataIndex];
                      if (variacao !== undefined && variacao !== null) {
                        const sinal = variacao >= 0 ? '+' : '';
                        label += ` (${sinal}${variacao.toFixed(1)}% vs ano anterior)`;
                      }
                    }
                  }
                  return label;
                }
              }
            },
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                boxWidth: 10,
              },
            },
            title: {
              display: false,
            },
            // Add zoom plugin configuration
            zoom: {
              pan: {
                enabled: true,
                mode: 'x',
              },
              zoom: {
                wheel: {
                  enabled: true,
                },
                pinch: {
                  enabled: true,
                },
                mode: 'x',
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'nearest',
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Ano',
              },
              grid: {
                display: false,
              },
            },
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Total de Acidentes',
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)',
              },
              ticks: {
                callback: function(value) {
                  if (typeof value === 'number') {
                    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value;
                  }
                  return value;
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: 'Total de Mortos',
              },
              grid: {
                drawOnChartArea: false,
              },
              ticks: {
                callback: function(value) {
                  if (typeof value === 'number') {
                    return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value;
                  }
                  return value;
                }
              }
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, isLoading]);

  // Função para determinar a cor das barras baseada no número de acidentes
  const getBarColor = (value) => {
    if (!estatisticasMensais) return '#1976d2';
    
    const minAcidentes = estatisticasMensais.minimo_acidentes;
    const maxAcidentes = estatisticasMensais.maximo_acidentes;
    const intensity = (value - minAcidentes) / (maxAcidentes - minAcidentes);
    return `rgb(25, ${100 - Math.floor(intensity * 50)}, ${180 - Math.floor(intensity * 100)})`;
  };

  if (isLoading) {
    return <Skeleton variant="rectangular" height={height} />;
  }

  if (!data || data.length === 0) {
    return (
      <Box 
        sx={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 1
        }}
      >
        <Typography variant="body1" color="textSecondary">
          Nenhum dado disponível para exibir o gráfico
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ height, width: '100%', position: 'relative' }}>
        <canvas ref={chartRef} />
      </Box>
      
      {estatisticasMensais && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Distribuição Mensal de Acidentes</Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Mês com mais acidentes</Typography>
              <Typography variant="h6" fontWeight="bold">
                {estatisticasMensais.mes_mais_acidentes} ({estatisticasMensais.maximo_acidentes.toLocaleString('pt-BR')})
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Mês com menos acidentes</Typography>
              <Typography variant="h6" fontWeight="bold">
                {estatisticasMensais.mes_menos_acidentes} ({estatisticasMensais.minimo_acidentes.toLocaleString('pt-BR')})
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" color="text.secondary">Diferença entre máximo e mínimo</Typography>
              <Typography variant="h6" fontWeight="bold">
                {estatisticasMensais.diferenca_mais_menos.toLocaleString('pt-BR')} acidentes
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ height: 300, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={estatisticasMensais.dadosMensaisChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nome" />
                <YAxis 
                  tickFormatter={(value) => value >= 1000 ? `${Math.round(value/1000)}k` : value}
                />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString('pt-BR')} acidentes`, 'Total']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar 
                  dataKey="acidentes" 
                  name="Acidentes"
                  fill="#1976d2"
                  radius={[4, 4, 0, 0]}
                >
                  {estatisticasMensais.dadosMensaisChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.acidentes)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TrendChart;