import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Paper,
  Link as MuiLink,
  Button
} from '@mui/material';
import Link from 'next/link';
import { 
  DataObject as DataIcon,
  Code as CodeIcon,
  BarChart as ChartIcon,
  Map as MapIcon,
  Speed as SpeedIcon,
  BugReport as BugIcon,
  GitHub as GitHubIcon,
  Mail as MailIcon,
  LinkedIn as LinkedInIcon
} from '@mui/icons-material';

export default function Sobre() {
  const features = [
    {
      title: 'Visualização Geoespacial',
      description: 'Mapeamento detalhado dos acidentes em rodovias federais brasileiras para identificar pontos críticos e padrões geográficos.',
      icon: <MapIcon color="primary" fontSize="large" />
    },
    {
      title: 'Análise Estatística',
      description: 'Gráficos interativos e relatórios detalhados sobre tendências, causas e fatores contribuintes para acidentes.',
      icon: <ChartIcon color="primary" fontSize="large" />
    },
    {
      title: 'Calculadora de Risco',
      description: 'Ferramenta preditiva que avalia o risco de acidentes em trechos específicos com base em condições históricas e atuais.',
      icon: <SpeedIcon color="primary" fontSize="large" />
    },
    {
      title: 'Dados Abertos',
      description: 'Utiliza dados oficiais da Polícia Rodoviária Federal, atualizados periodicamente para garantir informações precisas.',
      icon: <DataIcon color="primary" fontSize="large" />
    }
  ];

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Sobre o Projeto
          </Typography>
          
          <Typography variant="body1" paragraph>
            O <strong>PRF Acidentes Dashboard</strong> é uma plataforma de análise e visualização de dados sobre 
            acidentes nas rodovias federais brasileiras. Desenvolvido como uma ferramenta 
            de código aberto, o projeto busca democratizar o acesso a informações vitais sobre segurança viária.
          </Typography>
          
          <Typography variant="body1" paragraph>
            Utilizando dados oficiais disponibilizados pela Polícia Rodoviária Federal (PRF), o dashboard 
            oferece visualizações interativas, mapas de calor, estatísticas detalhadas e ferramentas de previsão 
            para ajudar pesquisadores, gestores públicos e cidadãos a compreender melhor os padrões e causas 
            dos acidentes rodoviários no Brasil.
          </Typography>
        </CardContent>
      </Card>
      
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Objetivos
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Disponibilizar dados sobre acidentes em rodovias federais de forma acessível e interativa" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Identificar pontos críticos e trechos de maior risco nas rodovias brasileiras" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Fornecer insights que possam contribuir para políticas públicas de segurança viária" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Facilitar a pesquisa acadêmica e jornalística sobre o tema" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Metodologia
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Coleta e processamento de dados oficiais da PRF" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Geolocalização e mapeamento de acidentes em todo o território nacional" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Análise estatística para identificação de padrões e tendências" />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <ChartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Criação de modelos preditivos para cálculo de risco em trechos específicos" />
                </ListItem>
              </List>
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                Toda a metodologia e código-fonte estão disponíveis em nosso repositório no GitHub, 
                seguindo princípios de ciência aberta e reprodutibilidade.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Principais Funcionalidades
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                textAlign: 'center'
              }}
            >
              <Box sx={{ mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {feature.description}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Tecnologias Utilizadas
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Frontend
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Next.js / React"
                    secondary="Framework para construção de aplicações web modernas"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Material UI"
                    secondary="Biblioteca de componentes de interface de usuário"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Leaflet"
                    secondary="Biblioteca para visualização de mapas interativos"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Recharts / Chart.js"
                    secondary="Bibliotecas para criação de gráficos e visualizações de dados"
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>
                Backend
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Python / FastAPI"
                    secondary="Linguagem e framework para desenvolvimento de APIs"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Pandas / NumPy"
                    secondary="Bibliotecas para análise e processamento de dados"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="scikit-learn"
                    secondary="Biblioteca para machine learning e modelos preditivos"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="SQLAlchemy"
                    secondary="ORM para interação com banco de dados"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Desenvolvedor
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              alt="Pedro Henrique Arias Oliveira" 
              src="/images/profile.jpg" 
              sx={{ width: 100, height: 100, mr: 3 }}
            />
            <Box>
              <Typography variant="h6">Pedro Henrique Arias Oliveira</Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Desenvolvedor Full Stack especializado em análise de dados e visualização
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<LinkedInIcon />} 
                  size="small"
                  component={MuiLink}
                  href="https://www.linkedin.com/in/pedroarias92/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<GitHubIcon />} 
                  size="small"
                  component={MuiLink}
                  href="https://github.com/pedarias"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<MailIcon />} 
                  size="small"
                  component={MuiLink}
                  href="mailto:pedro.oliveira@sistemafiep.org.br"
                >
                  Email
                </Button>
              </Box>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Typography variant="body2" color="textSecondary" align="center">
            Este projeto é desenvolvido sob licença open source e utiliza dados públicos disponibilizados pela PRF.
            <br />
            © {new Date().getFullYear()} - PRF Acidentes Dashboard
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}