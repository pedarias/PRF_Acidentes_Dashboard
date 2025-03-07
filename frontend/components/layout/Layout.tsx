import React, { ReactNode, useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Map as MapIcon,
  BarChart as ChartIcon,
  DirectionsCar as CarIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface LayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 240;

// Informações dos itens do menu
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Mapa de Acidentes', icon: <MapIcon />, path: '/mapa' },
  { text: 'Análises', icon: <ChartIcon />, path: '/analises' },
  { text: 'Perfil de Risco', icon: <WarningIcon />, path: '/risco' },
  { text: 'Prevenção', icon: <CarIcon />, path: '/prevencao' },
  { text: 'Sobre', icon: <InfoIcon />, path: '/sobre' },
];

export const Layout = ({ children }: LayoutProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          PRF Acidentes
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} size="small">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => {
          const isActive = router.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              component={Link}
              href={item.path}
              onClick={isMobile ? handleDrawerToggle : undefined}
              selected={isActive}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.50',
                  borderRight: '4px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.100',
                  },
                },
                '&:hover': {
                  backgroundColor: 'primary.50',
                },
              }}
            >
              <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isActive ? 'bold' : 'regular'
                }}
              />
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Dados: PRF 2014-2024
        </Typography>
      </Box>
    </>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
              Painel de Acidentes de Trânsito
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Versão móvel */}
        {isMobile && (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Melhor desempenho em dispositivos móveis
            }}
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                backgroundColor: 'background.default'
              },
            }}
          >
            {drawer}
          </Drawer>
        )}
        
        {/* Versão desktop */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                backgroundColor: 'background.default',
                border: 'none',
                boxShadow: '1px 0 5px rgba(0, 0, 0, 0.05)'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          marginTop: '64px', // Altura da AppBar
          backgroundColor: 'background.default'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};