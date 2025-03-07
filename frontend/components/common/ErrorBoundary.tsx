import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para que a próxima renderização mostre a UI alternativa
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Você pode registrar o erro em um serviço de relatório de erros
    console.error("Erro capturado pelo ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Aqui poderia enviar para um serviço como Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Renderiza qualquer fallback UI customizada
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          p: 4
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              maxWidth: 600, 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              backgroundColor: 'error.light',
              color: 'error.contrastText'
            }}
          >
            <ErrorIcon sx={{ fontSize: 60, mb: 2, color: 'error.main' }} />
            
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Oops! Algo deu errado.
            </Typography>
            
            <Typography variant="body1" align="center" sx={{ mb: 3 }}>
              Desculpe pela inconveniência. Ocorreu um erro ao carregar este componente.
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'background.paper', 
                color: 'text.primary',
                borderRadius: 1,
                width: '100%',
                overflowX: 'auto'
              }}>
                <Typography variant="subtitle2" gutterBottom>
                  Detalhes do erro (apenas visível em ambiente de desenvolvimento):
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </Typography>
                
                {this.state.errorInfo && (
                  <Typography variant="body2" component="pre" sx={{ mt: 2, whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<RefreshIcon />}
                onClick={this.handleReset}
              >
                Tentar Novamente
              </Button>
              
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => window.location.href = '/'}
              >
                Voltar para a Página Inicial
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;