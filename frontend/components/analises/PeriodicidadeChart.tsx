import React from 'react';
import { Box, Typography, CircularProgress, useTheme, Grid, Paper } from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface AnoData {
  ano: number;
  total_acidentes: number;
  total_mortos: number;
  total_feridos: number;
  media_mortos_por_acidente: number;
  variacao_percentual: number | null;
}

interface CausaData {
  causa: string;
  total_acidentes: number;
  total_mortos: number;
  media_mortos: number;
  percentual: number;
}

interface TipoData {
  tipo: string;
  total_acidentes: number;
  total_mortos: number;
  media_mortos: number;
  percentual: number;
}

interface PeriodicidadeChartProps {
  anuaisData: AnoData[];
  causasData: CausaData[];
  tiposData: TipoData[];
  isLoading: boolean;
  height?: number;
}

const PeriodicidadeChart: React.FC<PeriodicidadeChartProps> = ({ 
  anuaisData, 
  causasData,
  tiposData,
  isLoading, 
  height = 400 
}) => {
  const theme = useTheme();
  
  // Ordenar dados anuais cronologicamente
  const sortedAnuaisData = anuaisData ? [...anuaisData].sort((a, b) => a.ano - b.ano) : [];
  
  // Formatador personalizado para os valores nos tooltips
  const formatoNumero = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  // Customizar o componente Tooltip para dados anuais
  const CustomTooltipAnual = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const ano = payload[0].payload.ano;
      const acidentes = payload[0].payload.total_acidentes;
      const mortos = payload[0].payload.total_mortos;
      const feridos = payload[0].payload.total_feridos;
      const media = payload[0].payload.media_mortos_por_acidente;
      const variacao = payload[0].payload.variacao_percentual;
      
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="subtitle2" color="primary" fontWeight="bold">
            {ano}
          </Typography>
          <Typography variant="body2">
            Acidentes: <b>{formatoNumero(acidentes)}</b>
            {variacao !== null && (
              <span style={{ color: variacao >= 0 ? theme.palette.error.main : theme.palette.success.main }}>
                {' '}({variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%)
              </span>
            )}
          </Typography>
          <Typography variant="body2">
            Mortes: <b>{formatoNumero(mortos)}</b>
          </Typography>
          <Typography variant="body2">
            Feridos: <b>{formatoNumero(feridos)}</b>
          </Typography>
          <Typography variant="body2">
            Média de mortes: <b>{media.toFixed(3)}</b> por acidente
          </Typography>
        </Box>
      );
    }
    
    return null;
  };
  
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (!anuaisData || anuaisData.length === 0) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height={height}
        borderRadius={1}
        border={1}
        borderColor="divider"
      >
        <Typography variant="body1" color="textSecondary">
          Não há dados disponíveis para os filtros selecionados
        </Typography>
      </Box>
    );
  }
  
  return (
    <Grid container spacing={3}>
      {/* Gráfico de Evolução Anual */}
      <Grid item xs={12}>
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Evolução Anual de Acidentes
          </Typography>
          <Box sx={{ height: height/2, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sortedAnuaisData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="ano" 
                  tickFormatter={(value) => value.toString()}
                />
                <YAxis 
                  yAxisId="left"
                  orientation="left"
                  label={{ 
                    value: 'Número de Acidentes', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  tickFormatter={formatoNumero}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ 
                    value: 'Número de Mortes', 
                    angle: 90, 
                    position: 'insideRight',
                    style: { textAnchor: 'middle' }
                  }}
                  tickFormatter={formatoNumero}
                />
                <Tooltip content={<CustomTooltipAnual />} />
                <Legend wrapperStyle={{ marginTop: 10 }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="total_acidentes" 
                  name="Total de Acidentes" 
                  stroke={theme.palette.primary.main}
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="total_mortos" 
                  name="Total de Mortos" 
                  stroke={theme.palette.error.main}
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="total_feridos" 
                  name="Total de Feridos" 
                  stroke={theme.palette.warning.main}
                  strokeWidth={2}
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>

      {/* Gráfico de Média de Mortos por Acidente Anual */}
      <Grid item xs={12}>
        <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Taxa de Mortalidade por Ano
          </Typography>
          <Box sx={{ height: height/3, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={sortedAnuaisData}
                margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="ano" 
                  tickFormatter={(value) => value.toString()}
                />
                <YAxis 
                  label={{ 
                    value: 'Média de Mortes por Acidente', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle' }
                  }}
                  domain={[0, 'auto']}
                  tickFormatter={(value) => value.toFixed(3)}
                />
                <Tooltip />
                <Legend wrapperStyle={{ marginTop: 10 }} />
                <Area 
                  type="monotone" 
                  dataKey="media_mortos_por_acidente" 
                  name="Média de Mortes por Acidente" 
                  stroke={theme.palette.error.dark}
                  fill={theme.palette.error.light}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default PeriodicidadeChart;