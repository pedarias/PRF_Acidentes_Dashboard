import React from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from 'recharts';

interface CausaData {
  causa: string;
  total_acidentes: number;
  total_mortos: number;
  media_mortos: number;
  percentual: number;
}

interface CausasChartProps {
  data: CausaData[];
  isLoading: boolean;
  height?: number;
}

const CausasChart: React.FC<CausasChartProps> = ({ data, isLoading, height = 400 }) => {
  const theme = useTheme();
  
  // Ordenar dados por total de acidentes (decrescente)
  const sortedData = data ? [...data].sort((a, b) => b.total_acidentes - a.total_acidentes) : [];
  
  // Formatador personalizado para os valores nos tooltips
  const formatoNumero = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  // Customizar o componente Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const causa = payload[0].payload.causa;
      const acidentes = payload[0].payload.total_acidentes;
      const mortos = payload[0].payload.total_mortos;
      const media = payload[0].payload.media_mortos;
      const percentual = payload[0].payload.percentual;
      
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
            {causa}
          </Typography>
          <Typography variant="body2">
            Acidentes: <b>{formatoNumero(acidentes)}</b> ({percentual.toFixed(1)}%)
          </Typography>
          <Typography variant="body2">
            Mortes: <b>{formatoNumero(mortos)}</b>
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
          Carregando dados ou nenhum resultado disponível para os filtros selecionados. 
          Tente ajustar os filtros.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="causa" 
            angle={-45} 
            textAnchor="end" 
            height={80} 
            interval={0}
            tick={{ fontSize: 12 }}
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
              value: 'Média de Mortes por Acidente', 
              angle: 90, 
              position: 'insideRight',
              style: { textAnchor: 'middle' }
            }}
            domain={[0, 'auto']}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ marginTop: 10 }} />
          <Bar 
            yAxisId="left"
            dataKey="total_acidentes" 
            name="Total de Acidentes" 
            fill={theme.palette.primary.main}
            radius={[4, 4, 0, 0]}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={theme.palette.primary.main} />
            ))}
          </Bar>
          <Bar 
            yAxisId="right"
            dataKey="media_mortos" 
            name="Média de Mortes por Acidente" 
            fill={theme.palette.error.main}
            radius={[4, 4, 0, 0]}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={theme.palette.error.main} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CausasChart;