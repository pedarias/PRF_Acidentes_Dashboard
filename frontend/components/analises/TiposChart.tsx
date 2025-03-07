import React from 'react';
import { Box, Typography, CircularProgress, useTheme } from '@mui/material';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Sector
} from 'recharts';

interface TipoData {
  tipo: string;
  total_acidentes: number;
  total_mortos: number;
  media_mortos: number;
  percentual: number;
}

interface TiposChartProps {
  data: TipoData[];
  isLoading: boolean;
  height?: number;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD',
  '#3498DB', '#1ABC9C', '#F1C40F', '#E67E22', '#9B59B6'
];

const TiposChart: React.FC<TiposChartProps> = ({ data, isLoading, height = 400 }) => {
  const theme = useTheme();
  const [activeIndex, setActiveIndex] = React.useState(-1);
  
  // Ordenar dados por total de acidentes (decrescente)
  const sortedData = data ? [...data].sort((a, b) => b.total_acidentes - a.total_acidentes) : [];
  
  // Formatador personalizado para os valores nos tooltips
  const formatoNumero = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };
  
  // Customizar o componente Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const tipo = payload[0].payload.tipo;
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
            {tipo}
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
  
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };
  
  const onPieLeave = () => {
    setActiveIndex(-1);
  };
  
  const renderActiveShape = (props) => {
    const RADIAN = Math.PI / 180;
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={12}>
          {`${payload.tipo} (${(percent * 100).toFixed(1)}%)`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
          {`${formatoNumero(value)} acidentes`}
        </text>
      </g>
    );
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
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={sortedData}
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={100}
            fill="#8884d8"
            dataKey="total_acidentes"
            nameKey="tipo"
            paddingAngle={2}
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            stroke={theme.palette.background.paper}
            strokeWidth={2}
          >
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            formatter={(value, entry, index) => {
              return (
                <span style={{ color: theme.palette.text.primary, marginRight: 10 }}>
                  {value} ({(sortedData[index]?.percentual || 0).toFixed(1)}%)
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TiposChart;