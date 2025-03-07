import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Paper, 
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Alert,
  Chip,
  Button,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import FilterPanel from '@/components/common/FilterPanel';
import { api, getPontosAcidentes, getTrechosPerigosos } from '@/services/api';
import { 
  LayersOutlined as LayersIcon,
  WarningAmber as WarningIcon,
  LocalFireDepartment as HeatMapIcon,
  Room as MarkerIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';

// Importação dinâmica do componente de mapa para evitar erros de SSR
const FullScreenMap = dynamic(
  () => import('@/components/mapa/FullScreenMap'),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={600} /> }
);

const TrechosPerigososList = dynamic(
  () => import('@/components/mapa/TrechosPerigososList'),
  { ssr: false }
);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`map-tabpanel-${index}`}
      aria-labelledby={`map-tab-${index}`}
      {...other}
      style={{ height: index === 0 ? 'calc(100vh - 200px)' : 'auto' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function MapaAcidentes() {
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState({
    year: new Date().getFullYear() - 1,
    uf: '',
    br: '',
    tipo: '',
    classificacao: '',
  });
  
  const [mapMode, setMapMode] = useState<'pontos' | 'heatmap' | 'clusters'>('heatmap');
  const [showFilters, setShowFilters] = useState(true);

  // Query para obter os pontos de acidentes
  const { data: mapPoints, isLoading: isMapLoading } = useQuery({
    queryKey: ['mapas/pontos', filter.year, filter.uf, filter.br, filter.tipo, filter.classificacao],
    queryFn: async () => {
      try {
        const response = await getPontosAcidentes(
          filter.year,
          filter.uf,
          filter.br,
          filter.tipo,
          5000 // Limite maior para o mapa principal
        );
        return response;
      } catch (error) {
        console.error('Erro ao buscar pontos do mapa:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Query para obter as rodovias
  const { data: rodovias } = useQuery({
    queryKey: ['acidentes/rodovias'],
    queryFn: async () => {
      try {
        const response = await api.get('/acidentes/rodovias');
        return response.data;
      } catch (error) {
        console.error('Erro ao buscar rodovias:', error);
        return [];
      }
    },
    placeholderData: ['101', '116', '153', '230', '277', '381', '386', '393', '407', '470'],
  });

  // Query para obter os trechos perigosos
  const { data: trechosPerigosos, isLoading: isTrechosLoading } = useQuery({
    queryKey: ['mapas/trechos-perigosos', filter.year, filter.uf, filter.br],
    queryFn: async () => {
      try {
        const response = await getTrechosPerigosos(
          filter.year,
          filter.uf, 
          filter.br,
          10 // Top 10 trechos
        );
        return response;
      } catch (error) {
        console.error('Erro ao buscar trechos perigosos:', error);
        return [];
      }
    },
    enabled: tabValue === 1, // Somente carregar quando a tab estiver ativa
  });

  // Função para atualizar os filtros
  const handleFilterChange = (newFilter) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  // Handler para mudança de tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handler para mudança do modo do mapa
  const handleMapModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'pontos' | 'heatmap' | 'clusters',
  ) => {
    if (newMode !== null) {
      setMapMode(newMode);
    }
  };

  // Dados mockados para testes enquanto a API não está pronta
  const mockTrechos = [
    {
      uf: 'SP',
      br: '116',
      km_inicial: 230.5,
      km_final: 235.5,
      total_acidentes: 87,
      total_mortos: 12,
      indice_periculosidade: 4.8,
      principais_causas: ['Excesso de velocidade', 'Ultrapassagem indevida', 'Defeito na pista'],
      municipios: ['Guarulhos', 'São Paulo'],
      horarios_criticos: ['18:00', '19:00', '07:00'],
      nivel_risco: 'muito alto',
      coordenadas: [[-23.432, -46.531], [-23.450, -46.520], [-23.470, -46.510], [-23.490, -46.500], [-23.510, -46.490]]
    },
    {
      uf: 'MG',
      br: '381',
      km_inicial: 458.2,
      km_final: 463.2,
      total_acidentes: 65,
      total_mortos: 8,
      indice_periculosidade: 3.9,
      principais_causas: ['Falta de atenção', 'Dormindo', 'Defeito mecânico'],
      municipios: ['Betim', 'Contagem'],
      horarios_criticos: ['23:00', '00:00', '05:00'],
      nivel_risco: 'alto',
      coordenadas: [[-19.932, -44.031], [-19.950, -44.020], [-19.970, -44.010], [-19.990, -44.000], [-20.010, -43.990]]
    },
    {
      uf: 'RJ',
      br: '101',
      km_inicial: 320.0,
      km_final: 325.0,
      total_acidentes: 58,
      total_mortos: 7,
      indice_periculosidade: 3.6,
      principais_causas: ['Velocidade incompatível', 'Ingestão de álcool', 'Ultrapassagem indevida'],
      municipios: ['Niterói', 'São Gonçalo'],
      horarios_criticos: ['19:00', '20:00', '21:00'],
      nivel_risco: 'alto',
      coordenadas: [[-22.882, -43.231], [-22.900, -43.220], [-22.920, -43.210], [-22.940, -43.200], [-22.960, -43.190]]
    }
  ];
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mapa de Acidentes em Rodovias Federais
        </Typography>
        
        <Button
          startIcon={<FilterIcon />}
          variant="outlined"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>
      </Box>
      
      {showFilters && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={10}>
              <FilterPanel onFilterChange={handleFilterChange} filter={filter} />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="br-select-label">Rodovia BR</InputLabel>
                <Select
                  labelId="br-select-label"
                  id="br-select"
                  value={filter.br}
                  onChange={(e) => handleFilterChange({ br: e.target.value })}
                  label="Rodovia BR"
                >
                  <MenuItem value="">Todas as rodovias</MenuItem>
                  {rodovias && rodovias.map((br) => (
                    <MenuItem key={br} value={br}>
                      BR-{br}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="mapa tabs"
          variant="fullWidth"
        >
          <Tab 
            icon={<LayersIcon />} 
            label="Mapa Interativo" 
            id="map-tab-0" 
            aria-controls="map-tabpanel-0"
          />
          <Tab 
            icon={<WarningIcon />} 
            label="Trechos Perigosos" 
            id="map-tab-1" 
            aria-controls="map-tabpanel-1"
          />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <ToggleButtonGroup
            value={mapMode}
            exclusive
            onChange={handleMapModeChange}
            aria-label="modo de visualização do mapa"
            size="small"
          >
            <ToggleButton value="heatmap" aria-label="mapa de calor">
              <HeatMapIcon sx={{ mr: 1 }} />
              Mapa de Calor
            </ToggleButton>
            <ToggleButton value="pontos" aria-label="pontos">
              <MarkerIcon sx={{ mr: 1 }} />
              Pontos de Acidentes
            </ToggleButton>
            <ToggleButton value="clusters" aria-label="clusters">
              <LayersIcon sx={{ mr: 1 }} />
              Clusters
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        
        <Box sx={{ height: 'calc(100% - 48px)', width: '100%', position: 'relative' }}>
          <FullScreenMap 
            points={mapPoints || []} 
            isLoading={isMapLoading}
            mapMode={mapMode}
            filter={filter}
          />
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Trechos mais Perigosos
        </Typography>
        
        {filter.uf && (
          <Chip 
            label={`Estado: ${filter.uf}`} 
            color="primary" 
            variant="outlined" 
            sx={{ mr: 1, mb: 2 }} 
          />
        )}
        
        {filter.br && (
          <Chip 
            label={`BR-${filter.br}`} 
            color="primary" 
            variant="outlined" 
            sx={{ mr: 1, mb: 2 }} 
          />
        )}
        
        {filter.year && (
          <Chip 
            label={`Ano: ${filter.year}`} 
            color="primary" 
            variant="outlined" 
            sx={{ mr: 1, mb: 2 }} 
          />
        )}
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Os trechos são classificados por índice de periculosidade, calculado com base no número de acidentes, 
          mortes e feridos. Selecione um trecho para ver detalhes e visualizá-lo no mapa.
        </Alert>
        
        <TrechosPerigososList
          trechos={trechosPerigosos || mockTrechos}
          isLoading={isTrechosLoading}
        />
      </TabPanel>
    </Box>
  );
}