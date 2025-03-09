import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Paper, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { api, getPontosAcidentes } from '@/services/api';
import StatsOverview from '@/components/dashboard/StatsOverview';
import FilterPanel from '@/components/common/FilterPanel';
import TrendChart from '@/components/dashboard/TrendChart';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Importação dinâmica para evitar problemas de SSR com Leaflet
const FullScreenMap = dynamic(
  () => import('@/components/mapa/FullScreenMap'),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={400} /> }
);

export default function Home() {
  const [filter, setFilter] = useState({
    year: new Date().getFullYear() - 1, // Ano anterior por padrão
    uf: ''
  });

  // Query para obter o resumo das estatísticas
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['estatisticas/resumo', filter.year, filter.uf],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.year) params.append('ano', filter.year.toString());
      if (filter.uf) params.append('uf', filter.uf);
      
      const response = await api.get(`/estatisticas/resumo?${params.toString()}`);
      return response.data;
    },
    enabled: true, // Ativa a query imediatamente
  });

  // Query para obter as estatísticas anuais
  const { data: annualData, isLoading: isAnnualLoading } = useQuery({
    queryKey: ['estatisticas/anuais', filter.year, filter.uf],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.year) params.append('ano', filter.year.toString());
      if (filter.uf) params.append('uf', filter.uf);
      
      const response = await api.get(`/estatisticas/anuais?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });

  // Query para obter as estatísticas por classificação de acidente
  const { data: causesData, isLoading: isCausesLoading } = useQuery({
    queryKey: ['estatisticas/por-classificacao', filter.year, filter.uf],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.year) params.append('ano', filter.year.toString());
      if (filter.uf) params.append('uf', filter.uf);
      
      const response = await api.get(`/estatisticas/por-classificacao?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });

  // Query para obter pontos de acidentes para o mapa
  const { data: mapPoints, isLoading: isMapLoading } = useQuery({
    queryKey: ['mapas/pontos', filter.year, filter.uf],
    queryFn: async () => {
      try {
        const response = await getPontosAcidentes(
          filter.year,
          filter.uf,
          undefined, // BR não definido
          undefined, // Tipo não definido
          1000 // Limite de pontos para não sobrecarregar
        );
        return response;
      } catch (error) {
        console.error('Erro ao buscar pontos do mapa:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Função para atualizar os filtros
  const handleFilterChange = (newFilter) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  // Dados mockados para testes enquanto a API não está pronta
  const mockData = {
    stats: {
      total_acidentes: 123456,
      total_mortos: 5432,
      total_feridos: 78901,
      media_mortos_por_acidente: 0.044,
      top_causas: {
        "Falta de atenção": 32456,
        "Velocidade incompatível": 18765,
        "Ingestão de álcool": 12345
      },
      horas_criticas: {
        "18": 4567,
        "19": 4321,
        "17": 4123
      },
      condicoes_meteorologicas: {
        "CÉU CLARO": 78901,
        "CHUVA": 23456,
        "NUBLADO": 12345
      }
    },
    annual: [
      { ano: 2019, total_acidentes: 89012, total_mortos: 4321, variacao_percentual: null },
      { ano: 2020, total_acidentes: 76543, total_mortos: 3765, variacao_percentual: -12.8 },
      { ano: 2021, total_acidentes: 81234, total_mortos: 3987, variacao_percentual: 5.9 },
      { ano: 2022, total_acidentes: 89765, total_mortos: 4321, variacao_percentual: 8.4 },
      { ano: 2023, total_acidentes: 92345, total_mortos: 4567, variacao_percentual: 5.7 }
    ],
    causes: [
      { classificacao: "SEM VÍTIMA", total_acidentes: 32456, percentual: 45.3 },
      { classificacao: "COM VÍTIMA FERIDA", total_acidentes: 22765, percentual: 31.8 },
      { classificacao: "COM VÍTIMA FATAL", total_acidentes: 12345, percentual: 17.2 },
      { classificacao: "IGNORADO", total_acidentes: 4123, percentual: 5.7 }
    ]
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Painel de Acidentes de Trânsito no Brasil
      </Typography>
      
      {/* Painel de Filtros */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <FilterPanel onFilterChange={handleFilterChange} filter={filter} />
      </Paper>

      {/* Visão Geral das Estatísticas */}
      <StatsOverview 
        data={statsData || mockData.stats} 
        isLoading={isStatsLoading} 
      />

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Mapa de Concentração de Acidentes */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clusters de Acidentes
              </Typography>
              <Box sx={{ height: 400, width: '100%', position: 'relative' }}>
                <FullScreenMap 
                  points={mapPoints || []} 
                  isLoading={isMapLoading}
                  mapMode={'clusters'} 
                  filter={filter}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Classificação de Acidentes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Classificação de Acidentes
              </Typography>
              {isCausesLoading ? (
                <Box sx={{ pt: 1 }}>
                  <Skeleton height={400} />
                </Box>
              ) : (
                <Box sx={{ height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(causesData || mockData.causes).map(item => ({
                          name: item.classificacao,
                          value: item.total_acidentes
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {(causesData || mockData.causes).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={[
                            '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a05195'
                          ][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Estatísticas de Acidentes por Ano */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas de Acidentes por Ano
              </Typography>
              <TrendChart 
                data={annualData || mockData.annual} 
                isLoading={isAnnualLoading}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}