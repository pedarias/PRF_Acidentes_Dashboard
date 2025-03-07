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

// Resolver problema dos ícones do Leaflet com Next.js
const fixLeafletIcons = () => {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/images/map/marker-icon-2x.png',
    iconUrl: '/images/map/marker-icon.png',
    shadowUrl: '/images/map/marker-shadow.png',
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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Tentar resolver o problema dos ícones
      fixLeafletIcons();

      // Limpar mapa anterior se existir
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      // Inicializar o mapa
      mapRef.current = L.map(mapContainerRef.current);

      // Adicionar tile layer (fundo do mapa)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Escala do mapa
      L.control.scale({ imperial: false, position: 'bottomright' }).addTo(mapRef.current);

      // Verificar se o trecho tem coordenadas válidas
      if (trecho.coordenadas && trecho.coordenadas.length > 0) {
        // Criar polyline para o trecho
        const polyline = L.polyline(trecho.coordenadas, {
          color: getRiscoColor(trecho.nivel_risco),
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(mapRef.current);

        // Adicionar marcadores no início e fim do trecho
        if (trecho.coordenadas.length >= 2) {
          const startPoint = trecho.coordenadas[0];
          const endPoint = trecho.coordenadas[trecho.coordenadas.length - 1];

          const startIcon = new L.Icon({
            iconUrl: '/images/map/marker-start.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          const endIcon = new L.Icon({
            iconUrl: '/images/map/marker-end.png',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });

          L.marker(startPoint, { icon: startIcon })
            .bindPopup(`<b>Início do Trecho:</b> BR-${trecho.br} Km ${trecho.km_inicial.toFixed(1)}`)
            .addTo(mapRef.current);

          L.marker(endPoint, { icon: endIcon })
            .bindPopup(`<b>Fim do Trecho:</b> BR-${trecho.br} Km ${trecho.km_final.toFixed(1)}`)
            .addTo(mapRef.current);
        }

        // Adicionar um popup com informações gerais do trecho
        const centerPoint = trecho.coordenadas[Math.floor(trecho.coordenadas.length / 2)];
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

        // Ajustar o zoom do mapa para mostrar o trecho inteiro
        mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });
      } else {
        // Se não houver coordenadas, centralizar o mapa com base na média das coordenadas
        const center = L.latLng(-15.793889, -47.882778); // Fallback para Brasília
        mapRef.current.setView(center, 5);
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
  }, [trecho]);

  if (mapError) {
    return (
      <Alert severity="error" sx={{ height: '100%' }}>
        {mapError}
      </Alert>
    );
  }

  return (
    <Box
      ref={mapContainerRef}
      sx={{
        height: '100%',
        width: '100%',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    />
  );
};

export default TrechoMap;