import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Skeleton, Chip } from '@mui/material';
import {
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  ReportProblem as AlertIcon,
  LocalHospital as HospitalIcon,
  DirectionsCar as CarIcon,
  Timeline as StatsIcon
} from '@mui/icons-material';

interface StatsOverviewProps {
  data: {
    total_acidentes: number;
    total_mortos: number;
    total_feridos: number;
    media_mortos_por_acidente: number;
    comparativo_ano_anterior?: {
      ano: number;
      mortos: number;
      variacao_percentual: number;
    };
    [key: string]: any;
  };
  isLoading: boolean;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ data, isLoading }) => {
  // Formatar números grandes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toString();
    }
  };

  // Determinar a cor com base na variação
  const getVariationColor = (variation: number): string => {
    if (variation > 0) return 'error.main'; // Aumento de mortes (negativo)
    if (variation < 0) return 'success.main'; // Redução de mortes (positivo)
    return 'text.secondary';
  };

  // Ícone de variação
  const VariationIcon = ({ variation }: { variation: number }) => {
    if (variation > 0) return <ArrowUpIcon fontSize="small" color="error" />;
    if (variation < 0) return <ArrowDownIcon fontSize="small" color="success" />;
    return null;
  };

  return (
    <Grid container spacing={3}>
      {/* Total de Acidentes */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" color="text.secondary">
                Total de Acidentes
              </Typography>
              <Box sx={{ backgroundColor: 'primary.50', p: 0.8, borderRadius: '50%' }}>
                <CarIcon color="primary" />
              </Box>
            </Box>
            {isLoading ? (
              <Skeleton variant="text" height={60} width="80%" />
            ) : (
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                {formatNumber(data.total_acidentes)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Total de Mortos */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" color="text.secondary">
                Total de Mortos
              </Typography>
              <Box sx={{ backgroundColor: 'error.50', p: 0.8, borderRadius: '50%' }}>
                <AlertIcon color="error" />
              </Box>
            </Box>
            {isLoading ? (
              <Skeleton variant="text" height={60} width="80%" />
            ) : (
              <>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                  {formatNumber(data.total_mortos)}
                </Typography>
                {data.comparativo_ano_anterior && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <VariationIcon variation={data.comparativo_ano_anterior.variacao_percentual} />
                    <Typography 
                      variant="body2" 
                      component="span"
                      sx={{ 
                        color: getVariationColor(data.comparativo_ano_anterior.variacao_percentual)
                      }}
                    >
                      {Math.abs(data.comparativo_ano_anterior.variacao_percentual).toFixed(1)}% em relação a {data.comparativo_ano_anterior.ano}
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Total de Feridos */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" color="text.secondary">
                Total de Feridos
              </Typography>
              <Box sx={{ backgroundColor: 'warning.50', p: 0.8, borderRadius: '50%' }}>
                <HospitalIcon color="warning" />
              </Box>
            </Box>
            {isLoading ? (
              <Skeleton variant="text" height={60} width="80%" />
            ) : (
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                {formatNumber(data.total_feridos)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Média de Mortos por Acidente */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="subtitle2" color="text.secondary">
                Média de Mortos por Acidente
              </Typography>
              <Box sx={{ backgroundColor: 'info.50', p: 0.8, borderRadius: '50%' }}>
                <StatsIcon color="info" />
              </Box>
            </Box>
            {isLoading ? (
              <Skeleton variant="text" height={60} width="80%" />
            ) : (
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
                {data.media_mortos_por_acidente.toFixed(3)}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Principais Informações */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Informações Relevantes
            </Typography>
            {isLoading ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Skeleton variant="rounded" width={150} height={32} />
                <Skeleton variant="rounded" width={180} height={32} />
                <Skeleton variant="rounded" width={160} height={32} />
                <Skeleton variant="rounded" width={140} height={32} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {data.top_causas && Object.entries(data.top_causas).slice(0, 3).map(([causa, count], index) => (
                  <Chip 
                    key={index}
                    label={`${causa}: ${formatNumber(count as number)} acidentes`}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                
                {data.horas_criticas && Object.entries(data.horas_criticas).slice(0, 2).map(([hora, count], index) => (
                  <Chip 
                    key={index}
                    label={`${hora}h: ${formatNumber(count as number)} mortes`}
                    color="error"
                    variant="outlined"
                  />
                ))}

                {data.condicoes_meteorologicas && Object.entries(data.condicoes_meteorologicas).slice(0, 2).map(([condicao, count], index) => (
                  <Chip 
                    key={index}
                    label={`${condicao.toLowerCase()}: ${formatNumber(count as number)} acidentes`}
                    color="warning"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatsOverview;