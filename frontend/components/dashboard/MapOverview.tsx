import React, { useEffect, useRef, useState } from 'react';
import { Box, Skeleton, Typography, CircularProgress, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

// Tipagem para os pontos do mapa
interface MapPoint {
  id: number;
  latitude: number;
  longitude: number;
  data: string;
  hora: string;
  uf: string;
  br: string;
  km: number;
  tipo_acidente: string;
  causa_acidente: string;
  mortos: number;
  feridos: number;
  municipio?: string;
  [key: string]: any;
}

interface MapOverviewProps {
  points: MapPoint[];
  isLoading: boolean;
  height?: number;
}

// Configuração personalizada de ícones para o Leaflet
// Essa função será chamada depois que o componente for montado no cliente
const setupCustomIcons = () => {
  // @ts-ignore - necessário para resolver problema de tipagem do Leaflet com Next.js
  delete L.Icon.Default.prototype._getIconUrl;
  
  // Definindo nosso próprio ícone padrão personalizado
  L.Icon.Default.mergeOptions({
    iconUrl: '/images/map/marker-blue.png',
    shadowUrl: '/images/map/marker-shadow.png',
    iconSize: [38, 41],
    shadowSize: [41, 41],
    iconAnchor: [19, 41],
    shadowAnchor: [13, 41],
    popupAnchor: [0, -45]
  });
};

const MapOverview: React.FC<MapOverviewProps> = ({ points = [], isLoading, height = 500 }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Configurar ícones personalizados
      setupCustomIcons();

      // Inicializar o mapa se ainda não foi feito
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current).setView([-15.793889, -47.882778], 5); // Coordenadas de Brasília

        // Adicionar tile layer (fundo do mapa)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Criar camada de marcadores
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      // Limpar marcadores existentes
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }

      // Limpar heatmap existente
      if (heatLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
      }

      // Apenas adicionar pontos se não estiver carregando e houver pontos
      if (!isLoading && points.length > 0) {
        // Preparar dados para heatmap
        const heatData = points
          .filter(point => point.latitude && point.longitude)
          .map(point => {
            // Intensidade baseada no número de mortos (acidentes com mortes têm maior intensidade)
            const intensity = 0.5 + (point.mortos > 0 ? point.mortos * 0.5 : 0);
            return [point.latitude, point.longitude, intensity];
          });

        // Criar o mapa de calor com configurações melhoradas
        if (mapRef.current && heatData.length > 0) {
          // @ts-ignore - leaflet.heat não tem tipos definidos
          heatLayerRef.current = L.heatLayer(heatData, {
            radius: 25,  // Aumentar raio para melhor visualização
            blur: 20,    // Aumentar blur para transições mais suaves
            maxZoom: 12, // Permitir mais zoom antes de desativar o heatmap
            // Cores mais distintas para melhor visualização
            gradient: { 0.3: '#0000ff', 0.5: '#00ff00', 0.7: '#ffff00', 0.9: '#ff8000', 1.0: '#ff0000' },
            minOpacity: 0.5  // Garantir que pontos sejam sempre visíveis
          }).addTo(mapRef.current);

          // Ajustar o zoom do mapa para mostrar todos os pontos
          if (points.length > 0) {
            try {
              // Criar um bounds com todos os pontos
              const bounds = L.latLngBounds(points.map(p => [p.latitude, p.longitude]));
              if (bounds.isValid()) {
                mapRef.current.fitBounds(bounds);
              }
            } catch (e) {
              console.error('Erro ao ajustar bounds do mapa:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
      setMapError('Erro ao carregar o mapa. Por favor, recarregue a página.');
    }

    // Cleanup ao desmontar o componente
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points, isLoading]);

  if (mapError) {
    return (
      <Alert severity="error" sx={{ height: height }}>
        {mapError}
      </Alert>
    );
  }

  return (
    <Box 
      sx={{ 
        position: 'relative', 
        height: height, 
        width: '100%', 
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      {isLoading && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.7)'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      {!isLoading && points.length === 0 && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Typography variant="body1" color="textSecondary">
            Nenhum dado disponível para os filtros selecionados
          </Typography>
        </Box>
      )}
      
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          height: '100%', 
          width: '100%' 
        }} 
      />

      {/* Legenda do Mapa */}
      {!isLoading && points.length > 0 && (
        <Box 
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            padding: 1,
            borderRadius: 1,
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            zIndex: 500,
            minWidth: 150
          }}
        >
          <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Intensidade de acidentes
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#0000ff', borderRadius: '50%' }} />
            <Typography variant="caption">Baixa</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#00ff00', borderRadius: '50%' }} />
            <Typography variant="caption">Média</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ffff00', borderRadius: '50%' }} />
            <Typography variant="caption">Alta</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ff0000', borderRadius: '50%' }} />
            <Typography variant="caption">Muito alta</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MapOverview;