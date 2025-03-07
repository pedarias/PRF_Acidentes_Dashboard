import React, { useEffect, useRef } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import Chart from 'chart.js/auto';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TrendData {
  ano: number;
  total_acidentes: number;
  total_mortos: number;
  total_feridos?: number;
  variacao_percentual?: number | null;
}

interface TrendChartProps {
  data: TrendData[];
  isLoading: boolean;
  height?: number;
}

const TrendChart: React.FC<TrendChartProps> = ({ data, isLoading, height = 350 }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

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
    <Box sx={{ height, width: '100%' }}>
      <canvas ref={chartRef} />
    </Box>
  );
};

export default TrendChart;