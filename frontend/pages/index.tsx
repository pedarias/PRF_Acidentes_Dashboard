import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Paper, Skeleton } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { api } from '@/services/api';
import StatsOverview from '@/components/dashboard/StatsOverview';
import FilterPanel from '@/components/common/FilterPanel';
import TrendChart from '@/components/dashboard/TrendChart';

// Importação dinâmica para evitar problemas de SSR com Leaflet
const MapOverview = dynamic(
  () => import('@/components/dashboard/MapOverview'),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={400} /> }
);

export default function Home() {
  const [filter, setFilter] = useState({
    year: new Date().getFullYear() - 1, // Ano anterior por padrão
    uf: '',
    causa: '',
    tipo: ''
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
    queryKey: ['estatisticas/anuais', filter.uf],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.uf) params.append('uf', filter.uf);
      
      const response = await api.get(`/estatisticas/anuais?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });

  // Query para obter as estatísticas por causa
  const { data: causesData, isLoading: isCausesLoading } = useQuery({
    queryKey: ['estatisticas/por-causas', filter.year, filter.uf],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.year) params.append('ano', filter.year.toString());
      if (filter.uf) params.append('uf', filter.uf);
      params.append('top', '5'); // Top 5 causas
      
      const response = await api.get(`/estatisticas/por-causas?${params.toString()}`);
      return response.data;
    },
    enabled: true,
  });

  // Query para obter pontos de acidentes para o mapa
  const { data: mapPoints, isLoading: isMapLoading } = useQuery({
    queryKey: ['mapas/pontos', filter.year, filter.uf],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.year) params.append('ano', filter.year.toString());
      if (filter.uf) params.append('uf', filter.uf);
      params.append('limit', '1000'); // Limite de pontos para não sobrecarregar
      
      const response = await api.get(`/mapas/pontos?${params.toString()}`);
      return response.data;
    },
    enabled: true,
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
      { causa: "Falta de atenção", total_acidentes: 32456, total_mortos: 1234, media_mortos: 0.038, percentual: 26.3 },
      { causa: "Velocidade incompatível", total_acidentes: 18765, total_mortos: 987, media_mortos: 0.053, percentual: 15.2 },
      { causa: "Ingestão de álcool", total_acidentes: 12345, total_mortos: 789, media_mortos: 0.064, percentual: 10.0 },
      { causa: "Ultrapassagem indevida", total_acidentes: 9876, total_mortos: 654, media_mortos: 0.066, percentual: 8.0 },
      { causa: "Desobediência à sinalização", total_acidentes: 8765, total_mortos: 543, media_mortos: 0.062, percentual: 7.1 }
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
                Mapa de Concentração de Acidentes
              </Typography>
              <MapOverview 
                points={mapPoints || []} 
                isLoading={isMapLoading}
                height={400}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Principais Causas de Acidentes */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Principais Causas de Acidentes
              </Typography>
              {isCausesLoading ? (
                <Box sx={{ pt: 1 }}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} height={40} sx={{ my: 1 }} />
                  ))}
                </Box>
              ) : (
                <Box sx={{ height: 400, overflow: 'auto' }}>
                  {/* Renderizar dados de causas aqui */}
                  {(causesData || mockData.causes).map((cause, index) => (
                    <Box key={index} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      p: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' }
                    }}>
                      <Typography variant="body2" sx={{ flex: 2 }}>
                        {cause.causa}
                      </Typography>
                      <Typography variant="body2" sx={{ flex: 1, textAlign: 'right' }}>
                        {cause.total_acidentes.toLocaleString()}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          flex: 1, 
                          textAlign: 'right',
                          color: 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {cause.total_mortos.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Tendência de Acidentes por Ano */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Tendência de Acidentes por Ano
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