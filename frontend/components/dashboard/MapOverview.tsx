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
  const initialFitDoneRef = useRef<boolean>(false);
  const isZooming = useRef<boolean>(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);

  // Function to initialize the map
  const initializeMap = () => {
    if (!mapContainerRef.current) return;
    if (!document.body.contains(mapContainerRef.current)) return;

    // Clean up any existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    try {
      // Force layout calculation to ensure container has size
      const containerRect = mapContainerRef.current.getBoundingClientRect();
      if (containerRect.width === 0 || containerRect.height === 0) {
        console.warn('Map container has no dimensions');
        return;
      }
      
      // Setup custom icons
      setupCustomIcons();
      
      // Create map with explicit options
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-15.793889, -47.882778], // Brasília
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 120,
        scrollWheelZoom: true,
        wheelDebounceTime: 200
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Create markers layer
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      // Add event listeners to track zooming
      mapRef.current.on('zoomstart', () => {
        isZooming.current = true;
        console.log('Zoom started');
      });
      
      mapRef.current.on('zoomend', () => {
        console.log('Zoom ended at level:', mapRef.current?.getZoom());
        // Set a timeout to prevent immediate data refresh during zoom operations
        setTimeout(() => {
          isZooming.current = false;
        }, 300);
      });
      
      // Mark map as ready and invalidate size
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ animate: true });
          setMapReady(true);
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao carregar o mapa. Por favor, recarregue a página.');
    }
  };

  // Initialize map on component mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeMap();
    }, 500);
    
    return () => {
      clearTimeout(timeoutId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map data when points or loading state changes, but not on zoom/pan
  useEffect(() => {
    if (!mapReady || !mapRef.current || isZooming.current) return;

    try {
      // Save current view state before clearing layers
      const currentCenter = mapRef.current.getCenter();
      const currentZoom = mapRef.current.getZoom();
      
      // Clear existing layers
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
      }

      if (heatLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }

      // Only add points if not loading and there are points
      if (!isLoading && points.length > 0) {
        // Filter valid points first
        const validPoints = points.filter(point => 
          point.latitude && point.longitude && 
          !isNaN(point.latitude) && !isNaN(point.longitude)
        );
        
        if (validPoints.length > 0) {
          try {
            // Prepare heatmap data with enhanced intensity for better visualization
            const heatData = validPoints.map(point => {
              // Enhanced intensity based on number of deaths and injuries
              const fatalityFactor = point.mortos > 0 ? point.mortos * 0.8 : 0;
              const injuryFactor = point.feridos > 0 ? point.feridos * 0.2 : 0;
              const intensity = 0.3 + fatalityFactor + injuryFactor;
              return [point.latitude, point.longitude, intensity];
            });

            // Create heatmap with improved color gradient (red for highest density)
            // @ts-ignore - leaflet.heat doesn't have type definitions
            heatLayerRef.current = L.heatLayer(heatData, {
              radius: 25,
              blur: 20,
              gradient: { 
                0.2: 'blue', 
                0.4: 'cyan', 
                0.6: 'lime', 
                0.7: 'yellow', 
                0.8: 'orange',
                1.0: 'red' 
              },
              minOpacity: 0.5
            }).addTo(mapRef.current);

            // Fit map to data points only on initial load
            if (!initialFitDoneRef.current) {
              try {
                const bounds = L.latLngBounds(validPoints.map(p => [p.latitude, p.longitude]));
                if (bounds.isValid()) {
                  mapRef.current.fitBounds(bounds, { 
                    padding: [50, 50],
                    animate: true,
                    duration: 0.5
                  });
                  initialFitDoneRef.current = true; // Mark as done
                }
              } catch (e) {
                console.error('Error adjusting map bounds:', e);
              }
            } else {
              // Restore previous view position and zoom
              mapRef.current.setView(currentCenter, currentZoom, { animate: false });
            }
            
            // Force a map update with smooth animation
            mapRef.current.invalidateSize({ animate: true });
          } catch (error) {
            console.error('Error creating heatmap:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error updating map data:', error);
    }
  }, [points, isLoading, mapReady]);

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
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
          width: '100%',
          visibility: mapReady ? 'visible' : 'hidden'
        }} 
      />

      {/* Map Legend */}
      {!isLoading && points.length > 0 && mapReady && (
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
            <Typography variant="caption">Muito baixa</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#00ffff', borderRadius: '50%' }} />
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ff8000', borderRadius: '50%' }} />
            <Typography variant="caption">Muito alta</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#ff0000', borderRadius: '50%' }} />
            <Typography variant="caption">Crítica</Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MapOverview;