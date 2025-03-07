import React from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';

interface HoraData {
  hora: number;
  total_acidentes: number;
  total_mortos: number;
  percentual: number;
  condicao_metereologica?: string;
}

interface HorasChartProps {
  data: HoraData[];
  isLoading: boolean;
  height?: number;
}

const HorasChart: React.FC<HorasChartProps> = ({ data, isLoading, height = 400 }) => {
  const theme = useTheme();
  
  // Preparar dados para o gráfico
  const chartData = Array.from({ length: 24 }, (_, i) => ({
    hora: i,
    total_acidentes: 0,
    total_mortos: 0,
    percentual: 0,
    taxa_mortalidade: 0,
    condicao_metereologica: ''
  }));
  
  // Preencher com dados reais
  if (data && data.length > 0) {
    data.forEach(item => {
      if (item.hora >= 0 && item.hora < 24) {
        chartData[item.hora] = {
          ...chartData[item.hora],
          ...item,
          taxa_mortalidade: item.total_acidentes > 0 
            ? (item.total_mortos / item.total_acidentes) 
            : 0
        };
      }
    });
  }
  
  // Formatador personalizado para os valores nos tooltips
  const formatoNumero = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  // Formatar hora
  const formatarHora = (hora: number) => {
    return `${hora.toString().padStart(2, '0')}:00`;
  };
  
  // Personalizar o toltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const hora = payload[0].payload.hora;
      const acidentes = payload[0].payload.total_acidentes;
      const mortos = payload[0].payload.total_mortos;
      const percentual = payload[0].payload.percentual;
      const taxa = payload[0].payload.taxa_mortalidade;
      const condicao = payload[0].payload.condicao_metereologica;
      
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
            {formatarHora(hora)} h
          </Typography>
          <Typography variant="body2">
            Acidentes: <b>{formatoNumero(acidentes)}</b> ({percentual.toFixed(1)}%)
          </Typography>
          <Typography variant="body2">
            Mortes: <b>{formatoNumero(mortos)}</b>
          </Typography>
          <Typography variant="body2">
            Taxa de mortalidade: <b>{(taxa * 100).toFixed(2)}%</b>
          </Typography>
          {condicao && (
            <Typography variant="body2">
              Condição predominante: <b>{condicao.toLowerCase()}</b>
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
    <Box sx={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="hora" 
            tickFormatter={formatarHora} 
            label={{ 
              value: 'Hora do Dia', 
              position: 'insideBottomRight', 
              offset: -10 
            }}
          />
          <YAxis 
            yAxisId="left"
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
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="total_acidentes"
            name="Total de Acidentes"
            stroke={theme.palette.primary.main}
            fill={theme.palette.primary.light}
            fillOpacity={0.3}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total_mortos"
            name="Total de Mortos"
            stroke={theme.palette.error.main}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default HorasChart;