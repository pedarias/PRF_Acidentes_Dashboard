import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

interface LoadingIndicatorProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
  transparent?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  text = 'Carregando...', 
  size = 'medium',
  fullPage = false,
  transparent = false
}) => {
  // Determinar tamanho do indicador com base no parâmetro size
  const getProgressSize = (): number => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      case 'medium':
      default: return 40;
    }
  };

  // Conteúdo básico do indicador
  const loadingContent = (
    <>
      <CircularProgress 
        size={getProgressSize()} 
        color="primary" 
        sx={{ mb: text ? 2 : 0 }} 
      />
      {text && (
        <Typography 
          variant={size === 'large' ? 'h6' : 'body2'} 
          color="textSecondary"
        >
          {text}
        </Typography>
      )}
    </>
  );

  // Renderização para ocupar toda a página
  if (fullPage) {
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backgroundColor: transparent ? 'rgba(255, 255, 255, 0.7)' : 'background.paper'
        }}
      >
        {loadingContent}
      </Box>
    );
  }

  // Renderização para um componente específico
  return transparent ? (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        height: '100%',
        width: '100%',
        minHeight: 200
      }}
    >
      {loadingContent}
    </Box>
  ) : (
    <Paper 
      elevation={2} 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        minHeight: 200
      }}
    >
      {loadingContent}
    </Paper>
  );
};

export default LoadingIndicator;