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
  mapMode: 'pontos' | 'heatmap' | 'clusters';
  filter: any;
}

// Resolver problema dos ícones do Leaflet
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/map/marker-icon-2x.png',
    iconUrl: '/images/map/marker-icon.png',
    shadowUrl: '/images/map/marker-shadow.png',
  });
};

// Ícones personalizados para diferentes tipos de acidentes
const createCustomIcon = (mortos: number) => {
  return new L.Icon({
    iconUrl: mortos > 0 
      ? '/images/map/marker-fatal.png' 
      : '/images/map/marker-normal.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: '/images/map/marker-shadow.png',
    shadowSize: [41, 41]
  });
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Tentar resolver o problema dos ícones
      fixLeafletIcons();

      // Inicializar o mapa se ainda não foi feito
      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          center: [-15.793889, -47.882778], // Coordenadas de Brasília
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
          preferCanvas: true
        });

        // Adicionar tile layer (fundo do mapa)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);

        // Escala do mapa
        L.control.scale({ imperial: false, position: 'bottomright' }).addTo(mapRef.current);
        
        // Criar camada de marcadores
        markersLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      // Limpar camadas existentes
      clearLayers();

      // Filtrar pontos com coordenadas válidas
      const validPoints = points.filter(point => (
        typeof point.latitude === 'number' && 
        typeof point.longitude === 'number' && 
        !isNaN(point.latitude) && 
        !isNaN(point.longitude) &&
        point.latitude !== 0 && 
        point.longitude !== 0
      ));

      setPointsCount(validPoints.length);

      // Apenas adicionar pontos se não estiver carregando e houver pontos
      if (!isLoading && validPoints.length > 0) {
        // Renderizar com base no modo selecionado
        switch(mapMode) {
          case 'heatmap':
            renderHeatmap(validPoints);
            break;
          case 'pontos':
            renderPoints(validPoints);
            break;
          case 'clusters':
            renderClusters(validPoints);
            break;
          default:
            renderHeatmap(validPoints);
        }

        // Ajustar o zoom do mapa para mostrar todos os pontos
        fitMapToBounds(validPoints);
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
  }, [points, isLoading, mapMode, filter]);

  // Função para limpar todas as camadas do mapa
  const clearLayers = () => {
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

  // Renderizar mapa de calor
  const renderHeatmap = (validPoints: MapPoint[]) => {
    if (!mapRef.current) return;

    // Preparar dados para heatmap
    const heatData = validPoints.map(point => {
      // Intensidade baseada no número de mortos (acidentes com mortes têm maior intensidade)
      const intensity = point.mortos > 0 ? 0.8 + point.mortos * 0.2 : 0.3;
      return [point.latitude, point.longitude, intensity];
    });

    // Criar o mapa de calor
    if (mapRef.current && heatData.length > 0) {
      // @ts-ignore
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 15,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        gradient: { 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1: 'red' }
      }).addTo(mapRef.current);
    }
  };

  // Renderizar pontos individuais
  const renderPoints = (validPoints: MapPoint[]) => {
    if (!mapRef.current || !markersLayerRef.current) return;
    
    validPoints.forEach(point => {
      const icon = createCustomIcon(point.mortos);
      
      const marker = L.marker([point.latitude, point.longitude], { icon })
        .bindPopup(`
          <div style="font-family: Arial, sans-serif; max-width: 250px;">
            <h3 style="margin: 0 0 8px; color: ${point.mortos > 0 ? '#d32f2f' : '#1976d2'}; font-size: 16px;">
              ${point.tipo_acidente}
            </h3>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; margin-bottom: 8px;">
              <strong>Data:</strong> <span>${new Date(point.data).toLocaleDateString('pt-BR')}</span>
              <strong>Hora:</strong> <span>${point.hora}</span>
              <strong>Local:</strong> <span>BR-${point.br} km ${point.km.toFixed(1)}</span>
              <strong>Município:</strong> <span>${point.municipio}</span>
              <strong>UF:</strong> <span>${point.uf}</span>
            </div>
            <div style="margin: 8px 0; padding: 8px; background: ${point.mortos > 0 ? '#ffebee' : '#e3f2fd'}; border-radius: 4px;">
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
      
      markersLayerRef.current.addLayer(marker);
    });
  };

  // Renderizar clusters
  const renderClusters = (validPoints: MapPoint[]) => {
    if (!mapRef.current) return;
    
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
      const icon = createCustomIcon(point.mortos);
      
      const marker = L.marker([point.latitude, point.longitude], { 
        icon,
        data: point // Armazenar os dados do ponto para uso no iconCreateFunction
      }).bindPopup(`
        <div style="font-family: Arial, sans-serif; max-width: 250px;">
          <h3 style="margin: 0 0 8px; color: ${point.mortos > 0 ? '#d32f2f' : '#1976d2'}; font-size: 16px;">
            ${point.tipo_acidente}
          </h3>
          <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; margin-bottom: 8px;">
            <strong>Data:</strong> <span>${new Date(point.data).toLocaleDateString('pt-BR')}</span>
            <strong>Hora:</strong> <span>${point.hora}</span>
            <strong>Local:</strong> <span>BR-${point.br} km ${point.km.toFixed(1)}</span>
            <strong>Município:</strong> <span>${point.municipio}</span>
            <strong>UF:</strong> <span>${point.uf}</span>
          </div>
          <div style="margin: 8px 0; padding: 8px; background: ${point.mortos > 0 ? '#ffebee' : '#e3f2fd'}; border-radius: 4px;">
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
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
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
          borderRadius: 1
        }} 
      />
    </Box>
  );
};

export default FullScreenMap;