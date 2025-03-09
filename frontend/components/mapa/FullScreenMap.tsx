import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Alert, Paper, Tooltip } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

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

interface FullScreenMapProps {
  points: MapPoint[];
  isLoading: boolean;
  mapMode: 'heatmap' | 'clusters';
  filter: any;
}

// Configuração personalizada de ícones para o Leaflet
const setupCustomIcons = () => {
  // Remover as configurações padrão
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

// Classe de ícone personalizada para acidentes
const AcidenteIcon = L.Icon.extend({
  options: {
    shadowUrl: '/images/map/marker-shadow.png',
    iconSize: [38, 41],     // tamanho do ícone
    shadowSize: [41, 41],   // tamanho da sombra
    iconAnchor: [19, 41],   // ponto do ícone que corresponderá à localização do marcador
    shadowAnchor: [13, 41], // mesmo para a sombra
    popupAnchor: [0, -45]   // ponto a partir do qual o popup deve abrir
  }
});

// Criação de ícones para diferentes tipos de acidentes
const createCustomIcon = (mortos: number, feridos: number) => {
  if (mortos > 0) {
    return new AcidenteIcon({
      iconUrl: '/images/map/marker-red.png',
      className: 'acidente-fatal-marker'
    });
  } else if (feridos > 0) {
    return new AcidenteIcon({
      iconUrl: '/images/map/marker-orange.png',
      className: 'acidente-feridos-marker'
    });
  } else {
    return new AcidenteIcon({
      iconUrl: '/images/map/marker-blue.png',
      className: 'acidente-simples-marker'
    });
  }
};

const FullScreenMap: React.FC<FullScreenMapProps> = ({ 
  points = [], 
  isLoading,
  mapMode,
  filter
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const heatLayerRef = useRef<any>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [pointsCount, setPointsCount] = useState<number>(0);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const isZooming = useRef(false);
  const initialViewSetRef = useRef(false);

  // Função para inicializar o mapa
  const initializeMap = () => {
    if (!mapContainerRef.current) return;
    if (!document.body.contains(mapContainerRef.current)) return;

    // Cleanup previous map if exists
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
      
      // Create the map
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-15.793889, -47.882778], // Coordenadas de Brasília
        zoom: 5,
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,
        zoomSnap: 0.5,
        wheelPxPerZoomLevel: 120,
        scrollWheelZoom: true,
        wheelDebounceTime: 200
      });

      // Add base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add scale control
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(mapRef.current);
      
      // Add markers layer
      markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      
      // Add event listeners to track zooming with improved debounce
      mapRef.current.on('zoomstart', () => {
        isZooming.current = true;
        console.log('Zoom started');
      });
      
      mapRef.current.on('movestart', () => {
        isZooming.current = true;
        console.log('Move started');
      });
      
      let zoomTimeout: NodeJS.Timeout;
      
      mapRef.current.on('zoomend moveend', () => {
        console.log('Map interaction ended at zoom level:', mapRef.current?.getZoom());
        
        // Clear any existing timeout
        if (zoomTimeout) clearTimeout(zoomTimeout);
        
        // Set a longer timeout to prevent immediate data refresh after interaction
        zoomTimeout = setTimeout(() => {
          isZooming.current = false;
          console.log('Map is now stable and ready for data updates');
        }, 500); // Increased to 500ms
      });
      
      // Fix possible size issues with a small delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ animate: true });
          setMapReady(true);
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao inicializar o mapa. Por favor, recarregue a página.');
    }
  };

  // Initialize map on mount with delay
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

  // Handle data changes and map mode changes
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    
    // Skip data refresh while zooming
    if (isZooming.current) {
      console.log('Skipping map update during zooming');
      return;
    }
    
    try {
      // Save current view state before clearing layers
      const currentCenter = mapRef.current.getCenter();
      const currentZoom = mapRef.current.getZoom();
      
      // Clear existing layers
      clearLayers();

      // Filter valid points
      const validPoints = points.filter(point => (
        typeof point.latitude === 'number' && 
        typeof point.longitude === 'number' && 
        !isNaN(point.latitude) && 
        !isNaN(point.longitude) &&
        point.latitude !== 0 && 
        point.longitude !== 0
      ));

      setPointsCount(validPoints.length);

      // Only add points if not loading and there are valid points
      if (!isLoading && validPoints.length > 0) {
        // Render based on selected mode
        switch(mapMode) {
          case 'heatmap':
            renderHeatmap(validPoints);
            break;
          case 'clusters':
            renderClusters(validPoints);
            break;
          default:
            renderHeatmap(validPoints);
        }

        // Only fit to bounds on initial load or filter change
        if (!initialViewSetRef.current) {
          fitMapToBounds(validPoints);
          initialViewSetRef.current = true;
        } else {
          // Restore previous view position and zoom
          mapRef.current.setView(currentCenter, currentZoom, { animate: false });
        }
        
        // Force a map update with smooth animation
        mapRef.current.invalidateSize({ animate: true });
      }
    } catch (error) {
      console.error('Error updating map data:', error);
    }
  }, [points, isLoading, mapMode, mapReady]); // Removed filter from dependencies to prevent refreshes on filter change
  
  // Create a separate effect to handle filter changes, which only runs when filters explicitly change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    initialViewSetRef.current = false; // Reset view flag when filter changes
  }, [filter]);
  
  // We've already handled this in the separate effect above, so we can remove this duplicate
  // useEffect(() => {
  //  initialViewSetRef.current = false;
  // }, [filter]);

  // Função para limpar todas as camadas do mapa
  const clearLayers = () => {
    if (!mapRef.current) return;

    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    }

    if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (clusterLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(clusterLayerRef.current);
      clusterLayerRef.current = null;
    }
  };

  // Renderizar mapa de calor com cores mais intensas
  const renderHeatmap = (validPoints: MapPoint[]) => {
    if (!mapRef.current) return;

    // Preparar dados para heatmap com intensidade melhorada
    const heatData = validPoints.map(point => {
      // Intensidade baseada no número de mortos e feridos
      const fatalityFactor = point.mortos > 0 ? point.mortos * 0.7 : 0;
      const injuryFactor = point.feridos > 0 ? point.feridos * 0.15 : 0;
      // Base intensity starts higher for better visualization
      const intensity = 0.25 + fatalityFactor + injuryFactor;
      return [point.latitude, point.longitude, intensity];
    });

    // Criar o mapa de calor com gradiente melhorado
    if (mapRef.current && heatData.length > 0) {
      try {
        // @ts-ignore
        heatLayerRef.current = L.heatLayer(heatData, {
          radius: 20, // Increased radius for better visibility
          blur: 25,   // Slightly higher blur for smoother transitions
          max: 1.0,
          // Enhanced color gradient - red for highest density areas
          gradient: { 
            0.2: 'blue', 
            0.4: 'cyan', 
            0.5: 'lime', 
            0.7: 'yellow', 
            0.8: 'orange',
            1.0: 'red' 
          },
          minOpacity: 0.5 // Increased minimum opacity for better visibility
        }).addTo(mapRef.current);
      } catch (error) {
        console.error('Error creating heatmap:', error);
      }
    }
  };

  // Renderizar pontos individuais - agora simplesmente não renderiza nada
  const renderPoints = (validPoints: MapPoint[]) => {
    // Função vazia - não renderiza pontos individuais conforme solicitado pelo usuário
    return;
  };

  // Renderizar clusters
  const renderClusters = (validPoints: MapPoint[]) => {
    if (!mapRef.current) return;
    
    try {
      // @ts-ignore
      clusterLayerRef.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        iconCreateFunction: function(cluster) {
          const childCount = cluster.getChildCount();
          
          // Verificar se há acidentes fatais no cluster
          let hasFatal = false;
          let fatalCount = 0;
          
          cluster.getAllChildMarkers().forEach(marker => {
            const data = marker.options.data;
            if (data && data.mortos > 0) {
              hasFatal = true;
              fatalCount += data.mortos;
            }
          });
          
          // Diferentes classes CSS com base no tamanho do cluster e se há fatais
          let className = 'marker-cluster ';
          let size = '';
          
          if (childCount < 10) {
            size = 'small';
          } else if (childCount < 100) {
            size = 'medium';
          } else {
            size = 'large';
          }
          
          if (hasFatal) {
            className += 'marker-cluster-fatal-' + size;
          } else {
            className += 'marker-cluster-' + size;
          }
          
          return new L.DivIcon({
            html: `<div><span>${childCount}</span></div>`,
            className: className,
            iconSize: new L.Point(40, 40)
          });
        }
      });
      
      validPoints.forEach(point => {
        const icon = createCustomIcon(point.mortos, point.feridos);
        
        // Determinar cor do cabeçalho do popup com base no tipo de acidente
        let headerColor = '#1976d2'; // azul padrão
        let bgColor = '#e3f2fd';     // fundo azul claro padrão
        
        if (point.mortos > 0) {
          headerColor = '#d32f2f'; // vermelho para fatais
          bgColor = '#ffebee';     // fundo vermelho claro
        } else if (point.feridos > 0) {
          headerColor = '#f57c00'; // laranja para feridos
          bgColor = '#fff3e0';     // fundo laranja claro
        }
        
        const marker = L.marker([point.latitude, point.longitude], { 
          icon,
          data: point // Armazenar os dados do ponto para uso no iconCreateFunction
        }).bindPopup(`
          <div style="font-family: Arial, sans-serif; max-width: 250px;">
            <h3 style="margin: 0 0 8px; color: ${headerColor}; font-size: 16px;">
              ${point.tipo_acidente}
            </h3>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; margin-bottom: 8px;">
              <strong>Data:</strong> <span>${new Date(point.data).toLocaleDateString('pt-BR')}</span>
              <strong>Hora:</strong> <span>${point.hora}</span>
              <strong>Local:</strong> <span>BR-${point.br} km ${point.km.toFixed(1)}</span>
              <strong>Município:</strong> <span>${point.municipio}</span>
              <strong>UF:</strong> <span>${point.uf}</span>
            </div>
            <div style="margin: 8px 0; padding: 8px; background: ${bgColor}; border-radius: 4px;">
              <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px;">
                <strong>Mortos:</strong> <span>${point.mortos}</span>
                <strong>Feridos:</strong> <span>${point.feridos}</span>
              </div>
            </div>
            <div style="margin-top: 8px;">
              <strong>Causa:</strong> ${point.causa_acidente}<br>
              <strong>Condição:</strong> ${point.condicao_metereologica}
            </div>
          </div>
        `);
        
        clusterLayerRef.current.addLayer(marker);
      });
      
      mapRef.current.addLayer(clusterLayerRef.current);
      
      // Adicionar CSS personalizado para os clusters
      const style = document.createElement('style');
      style.textContent = `
        .marker-cluster-small {
          background-color: rgba(181, 226, 140, 0.6);
        }
        .marker-cluster-small div {
          background-color: rgba(110, 204, 57, 0.6);
        }
        .marker-cluster-medium {
          background-color: rgba(241, 211, 87, 0.6);
        }
        .marker-cluster-medium div {
          background-color: rgba(240, 194, 12, 0.6);
        }
        .marker-cluster-large {
          background-color: rgba(253, 156, 115, 0.6);
        }
        .marker-cluster-large div {
          background-color: rgba(241, 128, 23, 0.6);
        }
        .marker-cluster-fatal-small {
          background-color: rgba(255, 152, 150, 0.6);
        }
        .marker-cluster-fatal-small div {
          background-color: rgba(211, 47, 47, 0.6);
        }
        .marker-cluster-fatal-medium {
          background-color: rgba(255, 132, 130, 0.6);
        }
        .marker-cluster-fatal-medium div {
          background-color: rgba(211, 47, 47, 0.7);
        }
        .marker-cluster-fatal-large {
          background-color: rgba(255, 112, 110, 0.6);
        }
        .marker-cluster-fatal-large div {
          background-color: rgba(211, 47, 47, 0.8);
        }
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 20px;
        }
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 15px;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      console.error('Error creating clusters:', error);
    }
  };

  // Ajustar o mapa para mostrar todos os pontos
  const fitMapToBounds = (validPoints: MapPoint[]) => {
    if (!mapRef.current || validPoints.length === 0) return;
    
    try {
      // Filtrar para rodovia específica se houver filtro de BR
      if (filter.br) {
        const brPoints = validPoints.filter(p => p.br === filter.br);
        if (brPoints.length > 0) {
          validPoints = brPoints;
        }
      }
      
      // Filtrar para UF específica se houver filtro de UF
      if (filter.uf) {
        const ufPoints = validPoints.filter(p => p.uf === filter.uf);
        if (ufPoints.length > 0) {
          validPoints = ufPoints;
        }
      }
      
      // Criar um bounds com todos os pontos
      const bounds = L.latLngBounds(validPoints.map(p => [p.latitude, p.longitude]));
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { 
          padding: [50, 50],
          animate: true,
          duration: 0.5
        });
      }
    } catch (e) {
      console.error('Erro ao ajustar bounds do mapa:', e);
    }
  };

  if (mapError) {
    return (
      <Alert severity="error" sx={{ height: '100%' }}>
        {mapError}
      </Alert>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%', width: '100%' }}>
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
      
      {!isLoading && pointsCount === 0 && (
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
            Nenhum acidente encontrado para os filtros selecionados
          </Typography>
        </Box>
      )}
      
      {/* Contador de pontos */}
      {pointsCount > 0 && (
        <Tooltip title="Total de acidentes exibidos no mapa">
          <Paper 
            elevation={3} 
            sx={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              padding: '8px 16px',
              borderRadius: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <Typography variant="body2" color="textSecondary">
              {pointsCount} acidentes
            </Typography>
          </Paper>
        </Tooltip>
      )}
      
      <Box 
        ref={mapContainerRef} 
        sx={{ 
          height: '100%', 
          width: '100%',
          borderRadius: 1,
          visibility: mapReady ? 'visible' : 'hidden'
        }} 
      />
    </Box>
  );
};

export default FullScreenMap;