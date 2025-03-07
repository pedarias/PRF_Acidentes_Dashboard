import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Slider,
  Paper,
  Divider,
  Alert,
  AlertTitle,
  Rating,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import { 
  DirectionsCar as CarIcon,
  WbSunny as SunIcon,
  Schedule as ClockIcon,
  CalendarMonth as CalendarIcon,
  Speed as SpeedIcon,
  BrightnessHigh as DayIcon,
  NightsStay as NightIcon,
  Cloud as CloudIcon,
  WaterDrop as RainIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { 
  calcularRiscoRodovia, 
  calcularRiscoPersonalizado,
  getRecomendacoesSeguranca
} from '@/services/api';

const periodosDia = [
  { value: 'MADRUGADA', label: 'Madrugada (00h - 05h)', icon: <NightIcon /> },
  { value: 'MANHÃ', label: 'Manhã (06h - 11h)', icon: <DayIcon /> },
  { value: 'TARDE', label: 'Tarde (12h - 17h)', icon: <SunIcon /> },
  { value: 'NOITE', label: 'Noite (18h - 23h)', icon: <NightIcon /> }
];

const condicoesMetereologicas = [
  { value: 'CÉU CLARO', label: 'Céu claro', icon: <SunIcon /> },
  { value: 'NUBLADO', label: 'Nublado', icon: <CloudIcon /> },
  { value: 'CHUVA', label: 'Chuva', icon: <RainIcon /> },
  { value: 'NEBLINA/NEVOEIRO', label: 'Neblina/Nevoeiro', icon: <CloudIcon /> }
];

const diasSemana = [
  { value: 'SEGUNDA-FEIRA', label: 'Segunda-feira' },
  { value: 'TERÇA-FEIRA', label: 'Terça-feira' },
  { value: 'QUARTA-FEIRA', label: 'Quarta-feira' },
  { value: 'QUINTA-FEIRA', label: 'Quinta-feira' },
  { value: 'SEXTA-FEIRA', label: 'Sexta-feira' },
  { value: 'SÁBADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
];

const getNivelRiscoLabel = (risco: number) => {
  if (risco >= 0.8) return { label: 'Extremo', color: 'error', icon: <ErrorIcon /> };
  if (risco >= 0.6) return { label: 'Alto', color: 'warning', icon: <WarningIcon /> };
  if (risco >= 0.4) return { label: 'Moderado', color: 'info', icon: <InfoIcon /> };
  return { label: 'Baixo', color: 'success', icon: <CheckIcon /> };
};

export default function PerfilRisco() {
  const [formData, setFormData] = useState({
    uf: '',
    br: '',
    dia_semana: '',
    periodo_dia: '',
    condicao_metereologica: '',
    velocidade: 80,
  });
  
  const [calculoRealizado, setCalculoRealizado] = useState(false);
  
  // Estados e UFs (mock)
  const estados = [
    { uf: 'PR', nome: 'Paraná' },
    { uf: 'SC', nome: 'Santa Catarina' },
    { uf: 'RS', nome: 'Rio Grande do Sul' },
    { uf: 'SP', nome: 'São Paulo' },
    { uf: 'RJ', nome: 'Rio de Janeiro' },
    { uf: 'MG', nome: 'Minas Gerais' },
    // Adicionar outros estados...
  ];
  
  // Rodovias (mock ou obtidas por API)
  const [rodovias, setRodovias] = useState<{br: string, nome: string}[]>([]);
  
  // Buscar rodovias baseadas no estado selecionado
  useEffect(() => {
    if (formData.uf) {
      // Mock de dados - em produção seria uma chamada API
      const rodoviasDoEstado = [
        { br: '101', nome: 'BR-101' },
        { br: '116', nome: 'BR-116' },
        { br: '277', nome: 'BR-277' },
        { br: '376', nome: 'BR-376' },
        { br: '369', nome: 'BR-369' },
        { br: '476', nome: 'BR-476' }
      ];
      
      setRodovias(rodoviasDoEstado);
    } else {
      setRodovias([]);
    }
  }, [formData.uf]);
  
  // Query para calcular o risco da rodovia
  const { 
    data: riscoData, 
    isLoading: isRiscoLoading,
    refetch: recalcularRisco,
    isError: isRiscoError
  } = useQuery({
    queryKey: ['risco-rodovia', formData],
    queryFn: async () => {
      try {
        if (!formData.uf || !formData.br) {
          throw new Error('UF e BR são obrigatórios');
        }
        
        return await calcularRiscoRodovia(
          formData.uf,
          formData.br,
          formData.dia_semana || undefined,
          formData.periodo_dia || undefined,
          formData.condicao_metereologica || undefined
        );
      } catch (error) {
        console.error('Erro ao calcular risco:', error);
        throw error;
      }
    },
    enabled: false // Não executa automaticamente
  });
  
  // Query para buscar recomendações de segurança
  const { 
    data: recomendacoesData, 
    isLoading: isRecomendacoesLoading 
  } = useQuery({
    queryKey: ['recomendacoes', calculoRealizado && riscoData?.nivel_risco],
    queryFn: async () => {
      try {
        const perfil = riscoData?.nivel_risco >= 0.6 ? 'alto_risco' : 'padrao';
        return await getRecomendacoesSeguranca(perfil);
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
        throw error;
      }
    },
    enabled: calculoRealizado && !!riscoData
  });
  
  // Handler para mudanças no formulário
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handler para o slider de velocidade
  const handleVelocidadeChange = (_, newValue) => {
    setFormData(prev => ({ ...prev, velocidade: newValue }));
  };
  
  // Handler para o botão de calcular
  const handleCalcular = () => {
    recalcularRisco();
    setCalculoRealizado(true);
  };
  
  // Dados mockados para desenvolvimento
  const mockRiscoData = {
    id: 1,
    uf: formData.uf,
    br: formData.br,
    km_inicial: 0,
    km_final: 150,
    nivel_risco: 0.72,
    total_acidentes_trecho: 423,
    total_mortos_trecho: 32,
    media_acidentes_por_km: 2.82,
    fatores_risco: [
      { fator: 'Velocidade média elevada', peso: 0.35 },
      { fator: 'Condições metereológicas', peso: 0.25 },
      { fator: 'Alta concentração de veículos pesados', peso: 0.20 },
      { fator: 'Trecho com curvas acentuadas', peso: 0.15 },
      { fator: 'Histórico de acidentes', peso: 0.05 }
    ]
  };
  
  const mockRecomendacoesData = {
    recomendacoes: [
      { 
        id: 1,
        titulo: 'Reduza a velocidade em condições adversas',
        descricao: 'Em dias chuvosos ou com neblina, reduza a velocidade em pelo menos 20km/h abaixo do limite da via.',
        prioridade: 'alta'
      },
      {
        id: 2,
        titulo: 'Mantenha distância segura',
        descricao: 'Mantenha pelo menos 3 segundos de distância do veículo à frente, aumentando para 5 segundos em condições adversas.',
        prioridade: 'alta'
      },
      {
        id: 3,
        titulo: 'Evite dirigir em horários de pico',
        descricao: 'Se possível, evite trafegar nesta rodovia entre 17h e 19h, período com maior número de acidentes.',
        prioridade: 'media'
      },
      {
        id: 4,
        titulo: 'Realize pausas regulares',
        descricao: 'Em viagens longas, faça uma pausa de 15 minutos a cada 2 horas de direção para evitar a fadiga.',
        prioridade: 'media'
      },
      {
        id: 5,
        titulo: 'Verifique as condições do veículo',
        descricao: 'Certifique-se que pneus, freios e luzes estão em boas condições antes de viajar por esta rodovia.',
        prioridade: 'baixa'
      }
    ]
  };
  
  // Usar dados reais ou mockados
  const resultadoRisco = riscoData || (calculoRealizado ? mockRiscoData : null);
  const recomendacoes = recomendacoesData?.recomendacoes || (calculoRealizado ? mockRecomendacoesData.recomendacoes : []);
  
  // Informações de nível de risco
  const nivelRisco = resultadoRisco ? getNivelRiscoLabel(resultadoRisco.nivel_risco) : null;
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        Perfil de Risco e Recomendações
      </Typography>
      
      <Grid container spacing={4}>
        {/* Formulário para cálculo de risco */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Calculadora de Risco em Rodovias
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Preencha os dados abaixo para calcular o perfil de risco para uma rodovia específica.
              </Typography>
              
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="uf-label">Estado (UF)</InputLabel>
                      <Select
                        labelId="uf-label"
                        id="uf"
                        name="uf"
                        value={formData.uf}
                        label="Estado (UF)"
                        onChange={handleChange}
                      >
                        <MenuItem value="" disabled><em>Selecione um estado</em></MenuItem>
                        {estados.map(estado => (
                          <MenuItem key={estado.uf} value={estado.uf}>
                            {estado.nome} ({estado.uf})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth disabled={!formData.uf}>
                      <InputLabel id="br-label">Rodovia (BR)</InputLabel>
                      <Select
                        labelId="br-label"
                        id="br"
                        name="br"
                        value={formData.br}
                        label="Rodovia (BR)"
                        onChange={handleChange}
                      >
                        <MenuItem value="" disabled><em>Selecione uma rodovia</em></MenuItem>
                        {rodovias.map(rodovia => (
                          <MenuItem key={rodovia.br} value={rodovia.br}>
                            {rodovia.nome}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 1 }}>Condições de Tráfego (Opcional)</Divider>
                
                <FormControl fullWidth>
                  <InputLabel id="dia-semana-label">Dia da Semana</InputLabel>
                  <Select
                    labelId="dia-semana-label"
                    id="dia_semana"
                    name="dia_semana"
                    value={formData.dia_semana}
                    label="Dia da Semana"
                    onChange={handleChange}
                  >
                    <MenuItem value=""><em>Qualquer dia</em></MenuItem>
                    {diasSemana.map(dia => (
                      <MenuItem key={dia.value} value={dia.value}>
                        {dia.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel id="periodo-dia-label">Período do Dia</InputLabel>
                  <Select
                    labelId="periodo-dia-label"
                    id="periodo_dia"
                    name="periodo_dia"
                    value={formData.periodo_dia}
                    label="Período do Dia"
                    onChange={handleChange}
                  >
                    <MenuItem value=""><em>Qualquer período</em></MenuItem>
                    {periodosDia.map(periodo => (
                      <MenuItem key={periodo.value} value={periodo.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1 }}>{periodo.icon}</Box>
                          {periodo.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth>
                  <InputLabel id="condicao-metereologica-label">Condição Meteorológica</InputLabel>
                  <Select
                    labelId="condicao-metereologica-label"
                    id="condicao_metereologica"
                    name="condicao_metereologica"
                    value={formData.condicao_metereologica}
                    label="Condição Meteorológica"
                    onChange={handleChange}
                  >
                    <MenuItem value=""><em>Qualquer condição</em></MenuItem>
                    {condicoesMetereologicas.map(condicao => (
                      <MenuItem key={condicao.value} value={condicao.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ mr: 1 }}>{condicao.icon}</Box>
                          {condicao.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Box sx={{ mt: 2 }}>
                  <Typography gutterBottom>
                    Velocidade Pretendida (km/h)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs>
                      <Slider
                        value={formData.velocidade}
                        onChange={handleVelocidadeChange}
                        min={40}
                        max={120}
                        step={5}
                        marks={[
                          { value: 40, label: '40' },
                          { value: 60, label: '60' },
                          { value: 80, label: '80' },
                          { value: 100, label: '100' },
                          { value: 120, label: '120' }
                        ]}
                        valueLabelDisplay="auto"
                      />
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="h6" textAlign="center">
                        {formData.velocidade} km/h
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  startIcon={<SpeedIcon />}
                  onClick={handleCalcular}
                  disabled={!formData.uf || !formData.br || isRiscoLoading}
                  sx={{ mt: 2 }}
                >
                  {isRiscoLoading ? (
                    <>
                      <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                      Calculando...
                    </>
                  ) : 'Calcular Risco'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Resultados do cálculo de risco */}
        <Grid item xs={12} md={6}>
          {!calculoRealizado ? (
            <Paper 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                p: 3,
                backgroundColor: 'action.hover'
              }}
            >
              <Typography variant="subtitle1" color="textSecondary" textAlign="center">
                Preencha o formulário e clique em "Calcular Risco" para visualizar os resultados
              </Typography>
            </Paper>
          ) : isRiscoLoading ? (
            <Paper 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                p: 5
              }}
            >
              <CircularProgress size={60} sx={{ mb: 3 }} />
              <Typography variant="h6">
                Calculando perfil de risco...
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Analisando dados históricos e condições informadas
              </Typography>
            </Paper>
          ) : isRiscoError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              <AlertTitle>Erro ao calcular risco</AlertTitle>
              Não foi possível processar sua solicitação. Verifique os dados informados e tente novamente.
            </Alert>
          ) : resultadoRisco && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Perfil de Risco: {formData.uf && formData.br ? `BR-${formData.br} (${formData.uf})` : 'Rodovia Selecionada'}
                </Typography>
                
                <Box sx={{ mt: 2, mb: 4, textAlign: 'center' }}>
                  <Typography variant="overline" component="div" color="textSecondary">
                    NÍVEL DE RISCO
                  </Typography>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      mt: 1
                    }}
                  >
                    <Box
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${nivelRisco?.color}.light`,
                        border: 3,
                        borderColor: `${nivelRisco?.color}.main`,
                        mb: 1
                      }}
                    >
                      <Typography variant="h4" component="div" color={`${nivelRisco?.color}.main`}>
                        {Math.round(resultadoRisco.nivel_risco * 100)}%
                      </Typography>
                    </Box>
                    
                    <Chip
                      icon={nivelRisco?.icon}
                      label={nivelRisco?.label}
                      color={nivelRisco?.color as any}
                      sx={{ fontWeight: 'bold', px: 1 }}
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Estatísticas do Trecho
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Total de Acidentes
                      </Typography>
                      <Typography variant="h6">
                        {resultadoRisco.total_acidentes_trecho}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Total de Mortos
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {resultadoRisco.total_mortos_trecho}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Extensão
                      </Typography>
                      <Typography variant="h6">
                        {resultadoRisco.km_final - resultadoRisco.km_inicial} km
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        Acidentes/km
                      </Typography>
                      <Typography variant="h6">
                        {resultadoRisco.media_acidentes_por_km.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                <Typography variant="subtitle2" gutterBottom>
                  Principais Fatores de Risco
                </Typography>
                
                {resultadoRisco.fatores_risco.map((fator, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">
                        {fator.fator}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {Math.round(fator.peso * 100)}%
                      </Typography>
                    </Box>
                    <Slider
                      value={fator.peso * 100}
                      step={1}
                      min={0}
                      max={100}
                      disabled
                      sx={{
                        '& .MuiSlider-track': {
                          backgroundColor: fator.peso > 0.3 ? 'error.main' : 
                                          fator.peso > 0.15 ? 'warning.main' : 'success.main',
                        }
                      }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Recomendações de segurança */}
          {calculoRealizado && recomendacoes.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recomendações de Segurança
                </Typography>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Com base no perfil de risco calculado, recomendamos as seguintes medidas:
                </Typography>
                
                {isRecomendacoesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {recomendacoes.map((recomendacao) => {
                      const prioridadeCor = 
                        recomendacao.prioridade === 'alta' ? 'error' :
                        recomendacao.prioridade === 'media' ? 'warning' : 'success';
                      
                      return (
                        <Paper 
                          key={recomendacao.id} 
                          variant="outlined"
                          sx={{ 
                            p: 2,
                            borderLeft: 4,
                            borderColor: `${prioridadeCor}.main`
                          }}
                        >
                          <Typography variant="subtitle2" gutterBottom>
                            {recomendacao.titulo}
                          </Typography>
                          <Typography variant="body2">
                            {recomendacao.descricao}
                          </Typography>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}