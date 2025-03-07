import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip, 
  Grid, 
  Divider, 
  Skeleton,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Warning as WarningIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  AccessTime as TimeIcon,
  Map as MapIcon
} from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Importação dinâmica do componente de mapa para evitar erros de SSR
const TrechoMap = dynamic(
  () => import('@/components/mapa/TrechoMap'),
  { ssr: false, loading: () => <Skeleton variant="rectangular" height={300} /> }
);

interface Trecho {
  uf: string;
  br: string;
  km_inicial: number;
  km_final: number;
  total_acidentes: number;
  total_mortos: number;
  indice_periculosidade: number;
  principais_causas: string[];
  municipios: string[];
  horarios_criticos: string[];
  nivel_risco: string;
  coordenadas: [number, number][];
}

interface TrechosPerigososListProps {
  trechos: Trecho[];
  isLoading: boolean;
}

// Função para obter a cor com base no nível de risco
const getRiscoColor = (nivel: string): string => {
  switch (nivel.toLowerCase()) {
    case 'muito alto':
      return '#d32f2f'; // vermelho
    case 'alto':
      return '#f57c00'; // laranja
    case 'médio':
      return '#fbc02d'; // amarelo
    case 'baixo':
      return '#388e3c'; // verde
    default:
      return '#757575'; // cinza
  }
};

const TrechosPerigososList: React.FC<TrechosPerigososListProps> = ({ trechos, isLoading }) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedTrecho, setSelectedTrecho] = useState<Trecho | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  
  const handleExpandClick = (index: number) => {
    setExpandedId(expandedId === index ? null : index);
  };
  
  const handleMapClick = (trecho: Trecho) => {
    setSelectedTrecho(trecho);
    setMapDialogOpen(true);
  };
  
  const handleCloseMapDialog = () => {
    setMapDialogOpen(false);
  };
  
  if (isLoading) {
    return (
      <Box>
        {[...Array(3)].map((_, i) => (
          <Paper key={i} sx={{ p: 2, mb: 2 }}>
            <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={24} width="60%" />
            <Skeleton variant="text" height={24} width="40%" />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Skeleton variant="rectangular" width={60} height={24} />
              <Skeleton variant="rectangular" width={80} height={24} />
              <Skeleton variant="rectangular" width={70} height={24} />
            </Box>
          </Paper>
        ))}
      </Box>
    );
  }
  
  if (!trechos || trechos.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body1" color="textSecondary" align="center">
            Nenhum trecho perigoso encontrado para os filtros selecionados.
          </Typography>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Box>
      {trechos.map((trecho, index) => (
        <Paper 
          key={index} 
          elevation={2} 
          sx={{ 
            mb: 2, 
            borderLeft: '4px solid', 
            borderColor: getRiscoColor(trecho.nivel_risco),
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              p: 2,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
              }
            }}
            onClick={() => handleExpandClick(index)}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div">
                BR-{trecho.br}: Km {trecho.km_inicial.toFixed(1)} - {trecho.km_final.toFixed(1)}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label={`Risco ${trecho.nivel_risco.toUpperCase()}`}
                  color={trecho.nivel_risco.includes('alto') ? 'error' : 'warning'}
                  icon={<WarningIcon />}
                  sx={{ mr: 1 }}
                />
                
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMapClick(trecho);
                  }}
                  size="small"
                  color="primary"
                  sx={{ mr: 1 }}
                >
                  <MapIcon />
                </IconButton>
                
                <IconButton 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpandClick(index);
                  }}
                  size="small"
                >
                  {expandedId === index ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            </Box>
            
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              {trecho.municipios.join(' / ')} - {trecho.uf}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="textSecondary">
                  Total de acidentes
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {trecho.total_acidentes}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={4}>
                <Typography variant="caption" color="error">
                  Total de mortos
                </Typography>
                <Typography variant="body1" fontWeight="medium" color="error">
                  {trecho.total_mortos}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">
                  Índice de periculosidade
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ mr: 1 }}>
                    {trecho.indice_periculosidade.toFixed(1)}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min((trecho.indice_periculosidade / 5) * 100, 100)} 
                    sx={{ 
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getRiscoColor(trecho.nivel_risco),
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          <Collapse in={expandedId === index} timeout="auto" unmountOnExit>
            <Divider />
            <Box sx={{ p: 2, pt: 1, backgroundColor: 'rgba(0, 0, 0, 0.02)' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Principais causas de acidentes
                  </Typography>
                  <List dense disablePadding>
                    {trecho.principais_causas.map((causa, idx) => (
                      <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={`${idx + 1}. ${causa}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Horários críticos
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {trecho.horarios_criticos.map((horario, idx) => (
                      <Chip 
                        key={idx}
                        icon={<TimeIcon />}
                        label={horario}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<MapIcon />}
                  onClick={() => handleMapClick(trecho)}
                >
                  Ver no Mapa
                </Button>
              </Box>
            </Box>
          </Collapse>
        </Paper>
      ))}
      
      {/* Diálogo com mapa do trecho */}
      <Dialog
        open={mapDialogOpen}
        onClose={handleCloseMapDialog}
        fullWidth
        maxWidth="md"
        aria-labelledby="trecho-map-dialog-title"
      >
        <DialogTitle id="trecho-map-dialog-title">
          {selectedTrecho && (
            <>
              BR-{selectedTrecho.br}: Km {selectedTrecho.km_inicial.toFixed(1)} - {selectedTrecho.km_final.toFixed(1)}
              <Typography variant="subtitle2" color="textSecondary">
                {selectedTrecho.municipios.join(' / ')} - {selectedTrecho.uf}
              </Typography>
            </>
          )}
        </DialogTitle>
        
        <DialogContent dividers>
          {selectedTrecho && (
            <Box sx={{ height: 400 }}>
              <TrechoMap trecho={selectedTrecho} />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseMapDialog}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrechosPerigososList;