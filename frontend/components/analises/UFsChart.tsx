import React from 'react';
import { Box, Typography, CircularProgress, useTheme, Grid, Paper } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface UFData {
  uf: string;
  total_acidentes: number;
  total_mortos: number;
  media_mortos: number;
  rodovia_mais_perigosa: string;
  acidentes_por_100k_habitantes: number;
}

interface UFsChartProps {
  data: UFData[];
  isLoading: boolean;
  year: number;
  height?: number;
}

const UFsChart: React.FC<UFsChartProps> = ({ data, isLoading, year, height = 400 }) => {
  const theme = useTheme();
  
  // Ordenar dados por total de acidentes (decrescente)
  const sortedData = data ? [...data].sort((a, b) => b.total_acidentes - a.total_acidentes) : [];
  
  // Formatador personalizado para os valores nos tooltips
  const formatoNumero = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  
  // Modify the CustomTooltip component to handle null values:

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const uf = payload[0].payload.uf;
    const acidentes = payload[0].payload.total_acidentes;
    const mortos = payload[0].payload.total_mortos;
    const media = payload[0].payload.media_mortos || 0;
    const rodovia = payload[0].payload.rodovia_mais_perigosa || 'Não disponível';
    const taxa = payload[0].payload.acidentes_por_100k_habitantes;
    
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
          {uf}
        </Typography>
        <Typography variant="body2">
          Acidentes: <b>{formatoNumero(acidentes)}</b>
        </Typography>
        <Typography variant="body2">
          Mortes: <b>{formatoNumero(mortos)}</b>
        </Typography>
        <Typography variant="body2">
          Média de mortes: <b>{media ? media.toFixed(3) : '0.000'}</b> por acidente
        </Typography>
        <Typography variant="body2">
          Rodovia mais perigosa: <b>{rodovia}</b>
        </Typography>
        {taxa !== null && taxa !== undefined ? (
          <Typography variant="body2">
            Acidentes por 100k habitantes: <b>{taxa.toFixed(1)}</b>
          </Typography>
        ) : (
          <Typography variant="body2">
            Acidentes por 100k habitantes: <b>Não disponível</b>
          </Typography>
        )}
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
  
  if (!data || data.length === 0) {
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
      <Grid item xs={12}>
        <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Total de Acidentes por Estado em {year}
          </Typography>
          <Box sx={{ height: height/2, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 20, right: 50, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  tickFormatter={formatoNumero}
                  label={{ 
                    value: 'Número de Acidentes', 
                    position: 'insideBottom',
                    offset: -5
                  }}
                />
                <YAxis 
                  type="category"
                  dataKey="uf" 
                  width={50}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="total_acidentes" 
                  name="Total de Acidentes" 
                  fill={theme.palette.primary.main}
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {sortedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={theme.palette.primary.main}
                      fillOpacity={1 - (index * 0.075)} // Degradê
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Taxa de Acidentes por 100 mil Habitantes
          </Typography>
          <Box sx={{ height: height/2, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[...sortedData].filter(item => item.acidentes_por_100k_habitantes != null)
                  .sort((a, b) => b.acidentes_por_100k_habitantes - a.acidentes_por_100k_habitantes)}
                layout="vertical"
                margin={{ top: 20, right: 50, left: 50, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => value.toFixed(1)}
                  label={{ 
                    value: 'Acidentes por 100 mil Habitantes', 
                    position: 'insideBottom',
                    offset: -5
                  }}
                />
                <YAxis 
                  type="category"
                  dataKey="uf" 
                  width={50}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="acidentes_por_100k_habitantes" 
                  name="Acidentes por 100 mil Habitantes" 
                  fill={theme.palette.secondary.main}
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                >
                  {[...sortedData].filter(item => item.acidentes_por_100k_habitantes != null)
  .sort((a, b) => b.acidentes_por_100k_habitantes - a.acidentes_por_100k_habitantes).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={theme.palette.secondary.main}
                      fillOpacity={1 - (index * 0.075)} // Degradê
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default UFsChart;