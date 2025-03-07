import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  AlertTitle,
  Chip,
  Stack
} from '@mui/material';
import { 
  DirectionsCar as CarIcon,
  TwoWheeler as MotorcycleIcon,
  DirectionsWalk as PedestrianIcon,
  LocalPolice as PoliceIcon,
  School as SchoolIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  VerifiedUser as ShieldIcon,
  PhoneAndroid as PhoneIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getRecomendacoesSeguranca } from '@/services/api';

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
      id={`prevention-tabpanel-${index}`}
      aria-labelledby={`prevention-tab-${index}`}
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

export default function Prevencao() {
  const [tabValue, setTabValue] = useState(0);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Query para obter recomendações de segurança
  const { data: recomendacoesData, isLoading } = useQuery({
    queryKey: ['recomendacoes', tabValue],
    queryFn: async () => {
      try {
        const perfil = tabValue === 1 ? 'motorista' : 
                       tabValue === 2 ? 'motociclista' : 
                       tabValue === 3 ? 'pedestre' : undefined;
                       
        return await getRecomendacoesSeguranca(perfil);
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
        return null;
      }
    },
    enabled: true,
  });
  
  // Dados mockados para testes
  const mockRecomendacoes = {
    gerais: [
      "Respeite sempre os limites de velocidade",
      "Use cinto de segurança em todos os momentos",
      "Nunca dirija sob efeito de álcool ou drogas",
      "Mantenha distância segura do veículo à frente",
      "Faça revisões periódicas no veículo",
      "Evite usar o celular enquanto dirige",
      "Redobre a atenção em condições climáticas adversas",
      "Descanse adequadamente antes de viagens longas",
      "Faça paradas a cada 2 horas em trajetos longos",
      "Pratique direção defensiva"
    ],
    motorista: [
      "Verifique os pontos cegos antes de mudar de faixa",
      "Sinalize sempre suas intenções com antecedência",
      "Mantenha-se atualizado sobre as leis de trânsito",
      "Adapte sua velocidade às condições da via",
      "Tenha atenção redobrada em cruzamentos e rotatórias"
    ],
    motociclista: [
      "Use sempre capacete e equipamentos de proteção",
      "Não trafegue no corredor entre veículos em alta velocidade",
      "Mantenha-se visível, utilizando roupas claras ou refletivas",
      "Evite pontos cegos de caminhões e ônibus",
      "Respeite os limites de velocidade com ainda mais rigor"
    ],
    pedestre: [
      "Atravesse sempre na faixa de pedestres",
      "Verifique o trânsito em ambas as direções antes de atravessar",
      "Caminhe sempre pela calçada ou acostamento",
      "Use roupas claras ou refletivas à noite",
      "Evite caminhar distraído com celular ou fones de ouvido"
    ],
    especificas: []
  };
  
  // Usar dados reais ou mockados
  const recomendacoes = recomendacoesData || mockRecomendacoes;
  
  // Determinar recomendações específicas com base na tab selecionada
  const getRecomendacoesEspecificas = () => {
    if (tabValue === 0) return [];
    if (tabValue === 1) return recomendacoes.motorista || recomendacoes.especificas || [];
    if (tabValue === 2) return recomendacoes.motociclista || recomendacoes.especificas || [];
    if (tabValue === 3) return recomendacoes.pedestre || recomendacoes.especificas || [];
    return [];
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Prevenção e Segurança no Trânsito
      </Typography>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <AlertTitle>Dica importante</AlertTitle>
        A prevenção de acidentes começa com informação e consciência. Consulte as estatísticas no 
        dashboard e utilize o &ldquo;Perfil de Risco&rdquo; para planejar suas viagens com mais segurança.
      </Alert>

      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 120
            }
          }}
        >
          <Tab icon={<InfoIcon />} label="Geral" iconPosition="start" />
          <Tab icon={<CarIcon />} label="Motoristas" iconPosition="start" />
          <Tab icon={<MotorcycleIcon />} label="Motociclistas" iconPosition="start" />
          <Tab icon={<PedestrianIcon />} label="Pedestres" iconPosition="start" />
        </Tabs>
        
        {/* Painel Geral */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Pilares da Segurança no Trânsito
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" paragraph>
                  A segurança no trânsito depende de uma abordagem integrada que envolve diversos 
                  fatores e atores. Conheça os principais pilares que sustentam um trânsito mais seguro:
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <ShieldIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Educação e Conscientização" 
                      secondary="Programas educativos contínuos para todos os usuários das vias"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PoliceIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Fiscalização Efetiva" 
                      secondary="Monitoramento e aplicação das leis de trânsito para coibir infrações"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <CarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Segurança Veicular" 
                      secondary="Veículos equipados com sistemas de segurança ativa e passiva"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Infraestrutura Segura" 
                      secondary="Vias bem projetadas e sinalizadas que minimizam riscos"
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Atendimento Pós-Trauma" 
                      secondary="Resposta rápida e eficiente em casos de acidentes"
                    />
                  </ListItem>
                </List>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Recomendações Gerais de Segurança
              </Typography>
              
              <List>
                {recomendacoes.gerais.map((recomendacao, index) => (
                  <ListItem key={index} sx={{ 
                    py: 0.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' }
                  }}>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={recomendacao} />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  href="/risco"
                >
                  Calcular Risco da Sua Viagem
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4 }} />
          
          <Typography variant="h6" gutterBottom>
            Dados e Estatísticas Relevantes
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'error.light'
                }}
              >
                <Typography variant="h3" color="error.dark" gutterBottom>
                  5.7x
                </Typography>
                <Typography variant="body2" align="center">
                  Aumento do risco de acidente grave ao usar o celular enquanto dirige
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'warning.light'
                }}
              >
                <Typography variant="h3" color="warning.dark" gutterBottom>
                  30%
                </Typography>
                <Typography variant="body2" align="center">
                  dos acidentes fatais ocorrem em rodovias durante os finais de semana
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'info.light'
                }}
              >
                <Typography variant="h3" color="info.dark" gutterBottom>
                  45%
                </Typography>
                <Typography variant="body2" align="center">
                  das mortes poderiam ser evitadas com uso adequado do cinto de segurança
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  height: '100%', 
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  bgcolor: 'success.light'
                }}
              >
                <Typography variant="h3" color="success.dark" gutterBottom>
                  10km/h
                </Typography>
                <Typography variant="body2" align="center">
                  A cada 10km/h reduzidos em excesso de velocidade, diminui-se 40% a chance de acidente fatal
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Painel Motoristas */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Box sx={{ mb: 3 }}>
                <img 
                  src="/images/driver-safety.jpg" 
                  alt="Segurança para Motoristas" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }} 
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Principais Riscos para Motoristas
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Distrações ao volante" 
                    secondary="Uso de celular, ajustes no painel, conversas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Excesso de velocidade" 
                    secondary="Velocidade incompatível com a via ou condições climáticas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Condução sob efeito de álcool" 
                    secondary="Mesmo pequenas quantidades prejudicam reflexos e julgamento"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Fadiga e sonolência" 
                    secondary="Dirigir cansado ou com sono é tão perigoso quanto alcoolizado"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Desatenção às condições da via" 
                    secondary="Não adaptar a condução a diferentes pavimentos ou sinalização"
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Recomendações Específicas para Motoristas
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                  {getRecomendacoesEspecificas().map((recomendacao, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          borderLeft: 4,
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="body1">
                          {recomendacao}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Direção Defensiva: Princípios Fundamentais
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Conhecimento
                    </Typography>
                    <Typography variant="body2">
                      Conheça bem as leis de trânsito, a sinalização e as capacidades do seu veículo para tomar decisões corretas.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Atenção
                    </Typography>
                    <Typography variant="body2">
                      Mantenha-se concentrado na via, observe o comportamento de outros condutores e esteja atento a potenciais riscos.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Previsão
                    </Typography>
                    <Typography variant="body2">
                      Antecipe possíveis situações de risco e esteja sempre preparado para reagir a comportamentos inesperados.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Decisão
                    </Typography>
                    <Typography variant="body2">
                      Tome decisões seguras e precisas, sempre priorizando a prevenção de acidentes sobre qualquer outro objetivo.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="success">
                <AlertTitle>Dica de Ouro</AlertTitle>
                Antes de qualquer viagem longa, verifique os trechos mais perigosos da sua rota utilizando a ferramenta 
                de Perfil de Risco. Conhecer os pontos críticos permite ajustar sua condução nestes locais.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Painel Motociclistas */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Box sx={{ mb: 3 }}>
                <img 
                  src="/images/motorcycle-safety.jpg" 
                  alt="Segurança para Motociclistas" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }} 
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Equipamentos de Proteção Essenciais
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Stack spacing={1} direction="row" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                  <Chip label="Capacete certificado" color="primary" />
                  <Chip label="Jaqueta resistente" color="primary" />
                  <Chip label="Calça reforçada" color="primary" />
                  <Chip label="Luvas" color="primary" />
                  <Chip label="Botas" color="primary" />
                  <Chip label="Protetor de coluna" color="primary" />
                  <Chip label="Joelheiras" color="primary" />
                  <Chip label="Cotoveleiras" color="primary" />
                </Stack>
                
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  *O uso de equipamentos de proteção adequados pode reduzir em até 70% o risco de lesões graves em caso de acidentes.
                </Typography>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Fatores de Risco Específicos
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Visibilidade reduzida" 
                    secondary="Motocicletas são menos visíveis para outros veículos"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Estabilidade" 
                    secondary="Maior sensibilidade a condições da pista e clima"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Vulnerabilidade física" 
                    secondary="Ausência de estrutura de proteção em colisões"
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Recomendações Específicas para Motociclistas
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                  {getRecomendacoesEspecificas().map((recomendacao, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          borderLeft: 4,
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="body1">
                          {recomendacao}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Técnicas de Pilotagem Segura
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Posicionamento na Via
                    </Typography>
                    <Typography variant="body2">
                      Ocupe a posição que oferece maior visibilidade para outros condutores e melhor visão da via à frente.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Frenagem Segura
                    </Typography>
                    <Typography variant="body2">
                      Utilize ambos os freios de forma progressiva, evitando travamentos, especialmente em curvas ou piso molhado.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Uso de Retrovisores
                    </Typography>
                    <Typography variant="body2">
                      Verifique constantemente os retrovisores e não permaneça no ponto cego de outros veículos, especialmente caminhões.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Atenção em Cruzamentos
                    </Typography>
                    <Typography variant="body2">
                      Reduza a velocidade e esteja preparado para reagir, mesmo quando tiver preferência de passagem.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="warning">
                <AlertTitle>Atenção Especial</AlertTitle>
                Motociclistas têm 29 vezes mais chance de sofrer acidentes fatais em comparação a ocupantes de automóveis. 
                A prevenção e o uso de equipamentos de proteção são fundamentais para reduzir esse risco.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Painel Pedestres */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Box sx={{ mb: 3 }}>
                <img 
                  src="/images/pedestrian-safety.jpg" 
                  alt="Segurança para Pedestres" 
                  style={{ 
                    width: '100%', 
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }} 
                />
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Vulnerabilidade do Pedestre
              </Typography>
              
              <Typography variant="body1" paragraph>
                Pedestres são os usuários mais vulneráveis no sistema viário. Em um impacto 
                com um veículo, mesmo em baixa velocidade, as consequências podem ser graves 
                ou fatais devido à ausência de proteção física.
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Você sabia?</AlertTitle>
                Aproximadamente 22% das mortes no trânsito em rodovias federais brasileiras 
                são de pedestres, muitas vezes tentando atravessar vias de alta velocidade 
                em locais inadequados.
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                Principais Fatores de Risco
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Travessia em locais inadequados" 
                    secondary="Fora da faixa de pedestres ou passarelas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Baixa visibilidade" 
                    secondary="Especialmente à noite ou em condições climáticas adversas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Distração" 
                    secondary="Uso de celulares ou fones de ouvido ao caminhar"
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={7}>
              <Typography variant="h6" gutterBottom>
                Recomendações Específicas para Pedestres
              </Typography>
              
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                  {getRecomendacoesEspecificas().map((recomendacao, index) => (
                    <Grid item xs={12} key={index}>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2,
                          borderLeft: 4,
                          borderColor: 'primary.main'
                        }}
                      >
                        <Typography variant="body1">
                          {recomendacao}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
              
              <Typography variant="h6" gutterBottom>
                Comportamento Seguro em Diferentes Ambientes
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Em Áreas Urbanas
                    </Typography>
                    <Typography variant="body2">
                      Utilize sempre as calçadas e cruze nas faixas de pedestres, observando o semáforo quando houver.
                      Estabeleça contato visual com motoristas antes de atravessar.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Em Rodovias
                    </Typography>
                    <Typography variant="body2">
                      Nunca caminhe na pista. Use acostamentos e caminhe no sentido contrário ao fluxo dos veículos.
                      Utilize passarelas ou passagens subterrâneas sempre que disponíveis.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      À Noite
                    </Typography>
                    <Typography variant="body2">
                      Use roupas claras ou com elementos refletivos. Evite caminhar em vias mal iluminadas e redobre
                      a atenção ao atravessar, pois sua visibilidade está reduzida.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Com Crianças
                    </Typography>
                    <Typography variant="body2">
                      Segure sempre a mão de crianças pequenas junto ao corpo, longe do lado da rua. Ensine pelo exemplo,
                      respeitando regras de trânsito e utilizando faixas de pedestres.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              <Alert severity="success">
                <AlertTitle>Dica de Visibilidade</AlertTitle>
                Em áreas com pouca iluminação ou em rodovias, além de roupas claras, considere levar uma lanterna 
                ou utilizar a luz do celular (sem olhar para a tela) para aumentar sua visibilidade para os motoristas.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Educação é o Caminho
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" paragraph>
                Grande parte dos acidentes de trânsito poderia ser evitada com educação e conscientização. 
                O conhecimento das leis, das boas práticas de segurança e o desenvolvimento de uma cultura 
                de respeito mútuo entre todos os usuários das vias são pilares fundamentais para reduzir
                a acidentalidade.
              </Typography>
              
              <Typography variant="body1" paragraph>
                A educação para o trânsito deve começar na infância e se estender por toda a vida do cidadão, 
                com ações contínuas que reforcem comportamentos seguros e responsáveis.
              </Typography>
              
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<SchoolIcon />}
                sx={{ mt: 2 }}
                href="https://portal.prf.gov.br/educacao-para-o-transito"
                target="_blank"
              >
                Recursos Educativos da PRF
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Ações Educativas Recomendadas
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Participação em cursos de direção defensiva" 
                    secondary="Mesmo condutores experientes se beneficiam de atualizações periódicas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Acesso a materiais informativos atualizados" 
                    secondary="Consultar publicações sobre segurança viária e boas práticas"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Conscientização de crianças e jovens" 
                    secondary="Incentivar projetos escolares sobre educação para o trânsito"
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <SchoolIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Campanhas de prevenção" 
                    secondary="Apoiar e divulgar campanhas educativas sobre segurança no trânsito"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}