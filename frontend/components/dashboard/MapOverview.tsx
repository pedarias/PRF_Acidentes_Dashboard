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
  [key: string]: any;
}

interface MapOverviewProps {
  points: MapPoint[];
  isLoading: boolean;
  height?: number;
}

// Precisamos resolver o problema dos ícones do Leaflet com Next.js
// Essa função será chamada depois que o componente for montado no cliente
const fixLeafletIcons = () => {
  // @ts-ignore - necessário para resolver problema de tipagem do Leaflet com Next.js
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/map/marker-icon-2x.png',
    iconUrl: '/images/map/marker-icon.png',
    shadowUrl: '/images/map/marker-shadow.png',
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
      // Tentar resolver o problema dos ícones
      fixLeafletIcons();

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

        // Criar o mapa de calor
        if (mapRef.current && heatData.length > 0) {
          // @ts-ignore - leaflet.heat não tem tipos definidos
          heatLayerRef.current = L.heatLayer(heatData, {
            radius: 20,
            blur: 15,
            maxZoom: 10,
            gradient: { 0.4: 'blue', 0.65: 'lime', 0.9: 'yellow', 1.0: 'red' }
          }).addTo(mapRef.current);

          // Adicionar marcadores para pontos com mortes
          points
            .filter(point => point.latitude && point.longitude && point.mortos > 0)
            .forEach(point => {
              const marker = L.marker([point.latitude, point.longitude])
                .bindPopup(`
                  <div>
                    <b>${point.tipo_acidente}</b><br/>
                    Data: ${new Date(point.data).toLocaleDateString('pt-BR')}<br/>
                    Hora: ${point.hora}<br/>
                    BR-${point.br} km ${point.km}<br/>
                    <b>Mortos: ${point.mortos}</b><br/>
                    Feridos: ${point.feridos}<br/>
                    Causa: ${point.causa_acidente}
                  </div>
                `);
              
              if (markersLayerRef.current) {
                markersLayerRef.current.addLayer(marker);
              }
            });

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
    </Box>
  );
};

export default MapOverview;