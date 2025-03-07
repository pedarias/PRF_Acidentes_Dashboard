import { useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Card, 
  CardContent, 
  Paper, 
  Tabs, 
  Tab,
  Divider,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import FilterPanel from '@/components/common/FilterPanel';
import { 
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Schedule as ScheduleIcon,
  CalendarMonth as CalendarIcon,
  Map as MapIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import CausasChart from '@/components/analises/CausasChart';
import TiposChart from '@/components/analises/TiposChart';
import HorasChart from '@/components/analises/HorasChart';
import PeriodicidadeChart from '@/components/analises/PeriodicidadeChart';
import UFsChart from '@/components/analises/UFsChart';
import { 
  getEstatisticasPorCausas, 
  getEstatisticasPorTipos, 
  getEstatisticasPorHora,
  getEstatisticasAnuais,
  getEstatisticasPorUF
} from '@/services/api';

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AnalisesDados() {
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState({
    year: new Date().getFullYear() - 1,
    uf: '',
    causa: '',
    tipo: ''
  });
  
  const [showFilters, setShowFilters] = useState(true);

  // Query para obter dados de causas
  const { data: causasData, isLoading: isCausasLoading } = useQuery({
    queryKey: ['estatisticas/por-causas', filter.year, filter.uf],
    queryFn: async () => {
      try {
        const result = await getEstatisticasPorCausas(filter.year, filter.uf, 10);
        return result && result.length > 0 ? result : mockCausas;
      } catch (error) {
        console.error('Erro ao buscar estatísticas por causas:', error);
        return mockCausas;
      }
    },
    enabled: tabValue === 0 || tabValue === 3,
  });

  // Query para obter dados de tipos
  const { data: tiposData, isLoading: isTiposLoading } = useQuery({
    queryKey: ['estatisticas/por-tipos', filter.year, filter.uf],
    queryFn: async () => {
      try {
        const result = await getEstatisticasPorTipos(filter.year, filter.uf, 10);
        return result && result.length > 0 ? result : mockTipos;
      } catch (error) {
        console.error('Erro ao buscar estatísticas por tipos:', error);
        return mockTipos;
      }
    },
    enabled: tabValue === 1 || tabValue === 3,
  });

  // Query para obter dados por hora
  const { data: horasData, isLoading: isHorasLoading } = useQuery({
    queryKey: ['estatisticas/por-horas', filter.year, filter.uf],
    queryFn: async () => {
      try {
        const result = await getEstatisticasPorHora(filter.year, filter.uf);
        return result && result.length > 0 ? result : mockHoras;
      } catch (error) {
        console.error('Erro ao buscar estatísticas por hora:', error);
        return mockHoras;
      }
    },
    enabled: tabValue === 2,
  });

  // Query para obter dados anuais
  const { data: anuaisData, isLoading: isAnuaisLoading } = useQuery({
    queryKey: ['estatisticas/anuais', filter.uf],
    queryFn: async () => {
      try {
        const result = await getEstatisticasAnuais(filter.uf);
        return result && result.length > 0 ? result : mockAnuais;
      } catch (error) {
        console.error('Erro ao buscar estatísticas anuais:', error);
        return mockAnuais;
      }
    },
    enabled: tabValue === 3,
  });

  // Query para obter dados por UF
  const { data: ufsData, isLoading: isUFsLoading } = useQuery({
    queryKey: ['estatisticas/por-ufs', filter.year],
    queryFn: async () => {
      try {
        const result = await getEstatisticasPorUF(filter.year);
        return result && result.length > 0 ? result : mockUFs;
      } catch (error) {
        console.error('Erro ao buscar estatísticas por UF:', error);
        return mockUFs;
      }
    },
    enabled: tabValue === 4,
  });

  // Função para atualizar os filtros
  const handleFilterChange = (newFilter) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  // Handler para mudança de tabs
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Dados mockados para testes enquanto a API não está pronta
  const mockCausas = [ 
    { causa: "Falta de atenção", total_acidentes: 32456, total_mortos: 1234, media_mortos: 0.038, percentual: 26.3 },
    { causa: "Velocidade incompatível", total_acidentes: 18765, total_mortos: 987, media_mortos: 0.053, percentual: 15.2 },
    { causa: "Ingestão de álcool", total_acidentes: 12345, total_mortos: 789, media_mortos: 0.064, percentual: 10.0 },
    { causa: "Ultrapassagem indevida", total_acidentes: 9876, total_mortos: 654, media_mortos: 0.066, percentual: 8.0 },
    { causa: "Desobediência à sinalização", total_acidentes: 8765, total_mortos: 543, media_mortos: 0.062, percentual: 7.1 },
    { causa: "Defeito mecânico", total_acidentes: 6543, total_mortos: 321, media_mortos: 0.049, percentual: 5.3 },
    { causa: "Dormindo", total_acidentes: 5432, total_mortos: 456, media_mortos: 0.084, percentual: 4.4 },
    { causa: "Defeito na via", total_acidentes: 4321, total_mortos: 210, media_mortos: 0.049, percentual: 3.5 },
    { causa: "Animais na pista", total_acidentes: 3210, total_mortos: 176, media_mortos: 0.055, percentual: 2.6 },
    { causa: "Outras", total_acidentes: 21876, total_mortos: 789, media_mortos: 0.036, percentual: 17.6 }
  ];

  const mockTipos = [
    { tipo: "Colisão frontal", total_acidentes: 18765, total_mortos: 2345, media_mortos: 0.125, percentual: 15.2 },
    { tipo: "Colisão traseira", total_acidentes: 32456, total_mortos: 987, media_mortos: 0.030, percentual: 26.3 },
    { tipo: "Saída de pista", total_acidentes: 12345, total_mortos: 876, media_mortos: 0.071, percentual: 10.0 },
    { tipo: "Atropelamento de pessoa", total_acidentes: 5432, total_mortos: 890, media_mortos: 0.164, percentual: 4.4 },
    { tipo: "Capotamento", total_acidentes: 9876, total_mortos: 654, media_mortos: 0.066, percentual: 8.0 },
    { tipo: "Colisão lateral", total_acidentes: 15432, total_mortos: 432, media_mortos: 0.028, percentual: 12.5 },
    { tipo: "Colisão com objeto fixo", total_acidentes: 7654, total_mortos: 456, media_mortos: 0.060, percentual: 6.2 },
    { tipo: "Atropelamento de animal", total_acidentes: 3210, total_mortos: 123, media_mortos: 0.038, percentual: 2.6 },
    { tipo: "Tombamento", total_acidentes: 6543, total_mortos: 345, media_mortos: 0.053, percentual: 5.3 },
    { tipo: "Outros", total_acidentes: 11876, total_mortos: 432, media_mortos: 0.036, percentual: 9.5 }
  ];

  const mockHoras = Array.from({ length: 24 }, (_, i) => ({
    hora: i,
    total_acidentes: Math.floor(Math.random() * 10000) + 1000,
    total_mortos: Math.floor(Math.random() * 500) + 50,
    percentual: (Math.random() * 8) + 2,
    condicao_metereologica: i >= 6 && i <= 18 ? "CÉU CLARO" : "NOITE"
  }));

  const mockAnuais = [
    { ano: 2019, total_acidentes: 89012, total_mortos: 4321, total_feridos: 43210, media_mortos_por_acidente: 0.0485, variacao_percentual: null },
    { ano: 2020, total_acidentes: 76543, total_mortos: 3765, total_feridos: 38765, media_mortos_por_acidente: 0.0492, variacao_percentual: -12.8 },
    { ano: 2021, total_acidentes: 81234, total_mortos: 3987, total_feridos: 40123, media_mortos_por_acidente: 0.0491, variacao_percentual: 5.9 },
    { ano: 2022, total_acidentes: 89765, total_mortos: 4321, total_feridos: 45678, media_mortos_por_acidente: 0.0481, variacao_percentual: 8.4 },
    { ano: 2023, total_acidentes: 92345, total_mortos: 4567, total_feridos: 47890, media_mortos_por_acidente: 0.0494, variacao_percentual: 5.7 }
  ];

  const mockUFs = [
    { uf: "SP", total_acidentes: 45678, total_mortos: 2345, media_mortos: 0.0513, rodovia_mais_perigosa: "BR-116", acidentes_por_100k_habitantes: 98.7 },
    { uf: "MG", total_acidentes: 34567, total_mortos: 1876, media_mortos: 0.0543, rodovia_mais_perigosa: "BR-381", acidentes_por_100k_habitantes: 163.2 },
    { uf: "RJ", total_acidentes: 23456, total_mortos: 1234, media_mortos: 0.0526, rodovia_mais_perigosa: "BR-101", acidentes_por_100k_habitantes: 134.5 },
    { uf: "RS", total_acidentes: 21345, total_mortos: 1087, media_mortos: 0.0509, rodovia_mais_perigosa: "BR-290", acidentes_por_100k_habitantes: 187.3 },
    { uf: "PR", total_acidentes: 19876, total_mortos: 1023, media_mortos: 0.0515, rodovia_mais_perigosa: "BR-277", acidentes_por_100k_habitantes: 172.8 },
    { uf: "SC", total_acidentes: 17654, total_mortos: 876, media_mortos: 0.0496, rodovia_mais_perigosa: "BR-101", acidentes_por_100k_habitantes: 243.2 },
    { uf: "BA", total_acidentes: 15432, total_mortos: 965, media_mortos: 0.0625, rodovia_mais_perigosa: "BR-324", acidentes_por_100k_habitantes: 103.1 },
    { uf: "GO", total_acidentes: 12321, total_mortos: 765, media_mortos: 0.0621, rodovia_mais_perigosa: "BR-060", acidentes_por_100k_habitantes: 174.2 },
    { uf: "ES", total_acidentes: 9876, total_mortos: 543, media_mortos: 0.0550, rodovia_mais_perigosa: "BR-101", acidentes_por_100k_habitantes: 242.1 },
    { uf: "PE", total_acidentes: 8765, total_mortos: 498, media_mortos: 0.0568, rodovia_mais_perigosa: "BR-232", acidentes_por_100k_habitantes: 91.8 }
  ];

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Análises de Acidentes
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
          <FilterPanel onFilterChange={handleFilterChange} filter={filter} />
        </Paper>
      )}
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="analytics tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<BarChartIcon />} 
            label="Causas" 
            id="analytics-tab-0" 
            aria-controls="analytics-tabpanel-0"
            iconPosition="start"
          />
          <Tab 
            icon={<PieChartIcon />} 
            label="Tipos" 
            id="analytics-tab-1" 
            aria-controls="analytics-tabpanel-1"
            iconPosition="start"
          />
          <Tab 
            icon={<ScheduleIcon />} 
            label="Por Hora" 
            id="analytics-tab-2" 
            aria-controls="analytics-tabpanel-2"
            iconPosition="start"
          />
          <Tab 
            icon={<CalendarIcon />} 
            label="Periodicidade" 
            id="analytics-tab-3" 
            aria-controls="analytics-tabpanel-3"
            iconPosition="start"
          />
          <Tab 
            icon={<MapIcon />} 
            label="Por Estado" 
            id="analytics-tab-4" 
            aria-controls="analytics-tabpanel-4"
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Painel de Causas */}
      <TabPanel value={tabValue} index={0}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Principais Causas de Acidentes
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Esta análise apresenta as principais causas de acidentes registradas, ordenadas por quantidade. 
              Você pode observar a relação entre o número de acidentes e o número de mortes causadas por cada fator.
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <CausasChart 
              data={causasData} 
              isLoading={isCausasLoading} 
              height={500}
            />
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Painel de Tipos */}
      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Principais Tipos de Acidentes
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Esta análise mostra os diferentes tipos de acidentes registrados, destacando 
              aqueles com maior incidência e os que resultam em mais mortes.
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <TiposChart 
              data={tiposData} 
              isLoading={isTiposLoading} 
              height={500}
            />
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Painel de Hora do Dia */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribuição de Acidentes por Hora do Dia
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Esta visualização mostra como os acidentes se distribuem ao longo das 24 horas do dia, 
              identificando horários de pico e períodos mais perigosos.
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <HorasChart 
              data={horasData} 
              isLoading={isHorasLoading} 
              height={500}
            />
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Painel de Periodicidade */}
      <TabPanel value={tabValue} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Evolução Temporal e Periodicidade
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Esta análise mostra a evolução dos acidentes ao longo dos anos e a distribuição 
              por períodos (meses, dias da semana). Observe tendências e padrões sazonais.
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <PeriodicidadeChart 
              anuaisData={anuaisData} 
              causasData={causasData}
              tiposData={tiposData}
              isLoading={isAnuaisLoading || isCausasLoading || isTiposLoading} 
              height={600}
            />
          </CardContent>
        </Card>
      </TabPanel>
      
      {/* Painel de Estados */}
      <TabPanel value={tabValue} index={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Análise por Estado (UF)
            </Typography>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Esta visualização compara os dados de acidentes entre os diferentes estados brasileiros, 
              destacando aqueles com maiores incidências e taxas de mortalidade.
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <UFsChart 
              data={ufsData} 
              isLoading={isUFsLoading} 
              year={filter.year}
              height={600}
            />
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
}