import React, { useEffect, useRef, useState } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Trecho {
  uf: string;
  br: string;
  km_inicial: number;
  km_final: number;
  total_acidentes: number;
  total_mortos: number;
  nivel_risco: string;
  coordenadas: [number, number][];
  [key: string]: any;
}

interface TrechoMapProps {
  trecho: Trecho;
}

// Configuração personalizada de ícones para o Leaflet com Next.js
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

// Obter cor de acordo com o nível de risco
const getRiscoColor = (nivel: string): string => {
  switch (nivel.toLowerCase()) {
    case 'muito alto':
      return '#d32f2f'; // vermelho
    case 'alto':
      return '#f57c00'; // laranja
    case 'médio':
      return '#fbc02d'; // amarelo
    case 'baixo':
      return '#388e3c'; // verde
    default:
      return '#757575'; // cinza
  }
};

const TrechoMap: React.FC<TrechoMapProps> = ({ trecho }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState<boolean>(false);
  const isZooming = useRef(false);

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
      
      // Set up custom icons
      setupCustomIcons();
      
      // Create map with explicit options
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-15.793889, -47.882778], // Default to Brasília
        zoom: 5,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Add scale control
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(mapRef.current);
      
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
        }, 500); // 500ms debounce
      });
      
      // Mark map as ready with a small delay
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          setMapReady(true);
        }
      }, 200);
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Erro ao inicializar o mapa. Por favor, recarregue a página.');
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

  // Update map with trecho data when ready
  useEffect(() => {
    if (!mapReady || !mapRef.current || !trecho) return;
    
    // Skip updates during zooming/panning
    if (isZooming.current) {
      console.log('Skipping map update during interaction');
      return;
    }

    try {
      // Save current view state before clearing layers
      const currentCenter = mapRef.current.getCenter();
      const currentZoom = mapRef.current.getZoom();
      const hadPreviousLayers = mapRef.current.getLayers().length > 1; // Check if we had data before
      
      // Clear existing layers first
      mapRef.current.eachLayer(layer => {
        if (layer instanceof L.TileLayer) return; // Keep the base tile layer
        mapRef.current?.removeLayer(layer);
      });

      // Verify if the trecho has valid coordinates
      if (trecho.coordenadas && trecho.coordenadas.length > 0) {
        // Ensure coordinates are in the correct format [lat, lng]
        let coordenadasValidas;
        try {
          coordenadasValidas = trecho.coordenadas.map(coord => {
            // Check if coordinate is an array
            if (Array.isArray(coord) && coord.length === 2) {
              return [coord[0], coord[1]];
            } 
            // If it's an object {lat, lng}
            else if (coord && typeof coord === 'object' && 'lat' in coord && 'lng' in coord) {
              return [coord.lat, coord.lng];
            }
            // Fallback case
            else {
              throw new Error('Invalid coordinate format');
            }
          });
          
          // Check if all coordinates are valid
          const todasValidas = coordenadasValidas.every(coord => 
            typeof coord[0] === 'number' && 
            typeof coord[1] === 'number' && 
            !isNaN(coord[0]) && 
            !isNaN(coord[1])
          );
          
          if (!todasValidas) throw new Error('Coordinates with invalid values');
          
        } catch (error) {
          console.error('Error processing coordinates:', error);
          // Fallback: use mocked coordinates for a generic route
          coordenadasValidas = [
            [trecho.uf === 'SP' ? -23.5 : -15.8, trecho.uf === 'SP' ? -46.6 : -47.9],
            [trecho.uf === 'SP' ? -23.6 : -15.9, trecho.uf === 'SP' ? -46.7 : -48.0],
            [trecho.uf === 'SP' ? -23.7 : -16.0, trecho.uf === 'SP' ? -46.8 : -48.1]
          ];
        }
        
        // Create polyline for the route
        const polyline = L.polyline(coordenadasValidas, {
          color: getRiscoColor(trecho.nivel_risco),
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(mapRef.current);

        // Add markers at the start and end of the route
        if (coordenadasValidas.length >= 2) {
          const startPoint = coordenadasValidas[0];
          const endPoint = coordenadasValidas[coordenadasValidas.length - 1];

          // Custom icon class for route points
          const TrechoIcon = L.Icon.extend({
            options: {
              shadowUrl: '/images/map/marker-shadow.png',
              iconSize: [38, 41],
              shadowSize: [41, 41],
              iconAnchor: [19, 41],
              shadowAnchor: [13, 41],
              popupAnchor: [0, -45]
            }
          });
          
          // Create specific icons for start and end of route
          const startIcon = new TrechoIcon({
            iconUrl: '/images/map/marker-green.png',
            className: 'trecho-inicio-marker'
          });

          const endIcon = new TrechoIcon({
            iconUrl: '/images/map/marker-orange.png',
            className: 'trecho-fim-marker'
          });

          L.marker(startPoint, { icon: startIcon })
            .bindPopup(`<b>Início do Trecho:</b> BR-${trecho.br} Km ${trecho.km_inicial.toFixed(1)}`)
            .addTo(mapRef.current);

          L.marker(endPoint, { icon: endIcon })
            .bindPopup(`<b>Fim do Trecho:</b> BR-${trecho.br} Km ${trecho.km_final.toFixed(1)}`)
            .addTo(mapRef.current);
        }

        // Add a popup with general route information
        const centerPoint = coordenadasValidas[Math.floor(coordenadasValidas.length / 2)];
        L.popup()
          .setLatLng(centerPoint)
          .setContent(`
            <div style="font-family: Arial, sans-serif;">
              <h3 style="margin: 0 0 8px;">Trecho de Risco ${trecho.nivel_risco}</h3>
              <p><strong>BR-${trecho.br}:</strong> Km ${trecho.km_inicial.toFixed(1)} a ${trecho.km_final.toFixed(1)}</p>
              <p><strong>Acidentes:</strong> ${trecho.total_acidentes} | <strong>Mortos:</strong> ${trecho.total_mortos}</p>
            </div>
          `)
          .openOn(mapRef.current);
          
        // Only fit to bounds if this is the first data load or if trecho changed
        if (!hadPreviousLayers) {
          mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        } else {
          // Restore previous view position and zoom
          mapRef.current.setView(currentCenter, currentZoom, { animate: false });
        }
        
        // Ensure the map is properly sized
        mapRef.current.invalidateSize();
      } else {
        // If there are no coordinates, center the map based on the average coordinates
        if (!hadPreviousLayers) {
          const center = L.latLng(-15.793889, -47.882778); // Fallback to Brasília
          mapRef.current.setView(center, 5);
        } else {
          // Restore previous view position and zoom
          mapRef.current.setView(currentCenter, currentZoom, { animate: false });
        }
      }
    } catch (error) {
      console.error('Error rendering route on map:', error);
      setMapError('Erro ao renderizar trecho no mapa. Por favor, recarregue a página.');
    }
  }, [trecho, mapReady]);

  if (mapError) {
    return (
      <Alert severity="error" sx={{ height: '100%' }}>
        {mapError}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex'
      }}
    >
      {!mapReady && (
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
      
      <Box
        ref={mapContainerRef}
        sx={{
          height: '100%',
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          visibility: mapReady ? 'visible' : 'hidden'
        }}
      />
    </Box>
  );
};

export default TrechoMap;