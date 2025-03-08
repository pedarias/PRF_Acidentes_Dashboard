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

  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Configurar ícones personalizados
      setupCustomIcons();

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
        // Garantir que as coordenadas estão no formato correto [lat, lng]
        let coordenadasValidas;
        try {
          coordenadasValidas = trecho.coordenadas.map(coord => {
            // Verificar se a coordenada é um array
            if (Array.isArray(coord) && coord.length === 2) {
              return [coord[0], coord[1]];
            } 
            // Se for um objeto {lat, lng}
            else if (coord && typeof coord === 'object' && 'lat' in coord && 'lng' in coord) {
              return [coord.lat, coord.lng];
            }
            // Caso estranho, lançar erro para usar fallback
            else {
              throw new Error('Formato de coordenada inválido');
            }
          });
          
          // Verificar se todas as coordenadas são válidas
          const todasValidas = coordenadasValidas.every(coord => 
            typeof coord[0] === 'number' && 
            typeof coord[1] === 'number' && 
            !isNaN(coord[0]) && 
            !isNaN(coord[1])
          );
          
          if (!todasValidas) throw new Error('Coordenadas com valores inválidos');
          
        } catch (error) {
          console.error('Erro ao processar coordenadas:', error);
          // Fallback: usar coordenadas mockadas para um trecho genérico
          coordenadasValidas = [
            [trecho.uf === 'SP' ? -23.5 : -15.8, trecho.uf === 'SP' ? -46.6 : -47.9],
            [trecho.uf === 'SP' ? -23.6 : -15.9, trecho.uf === 'SP' ? -46.7 : -48.0],
            [trecho.uf === 'SP' ? -23.7 : -16.0, trecho.uf === 'SP' ? -46.8 : -48.1]
          ];
        }
        
        // Criar polyline para o trecho
        const polyline = L.polyline(coordenadasValidas, {
          color: getRiscoColor(trecho.nivel_risco),
          weight: 5,
          opacity: 0.8,
          smoothFactor: 1
        }).addTo(mapRef.current);

        // Adicionar marcadores no início e fim do trecho
        if (coordenadasValidas.length >= 2) {
          const startPoint = coordenadasValidas[0];
          const endPoint = coordenadasValidas[coordenadasValidas.length - 1];

          // Classe de ícone personalizada para pontos de trecho
          const TrechoIcon = L.Icon.extend({
            options: {
              shadowUrl: '/images/map/marker-shadow.png',
              iconSize: [38, 41],      // tamanho do ícone
              shadowSize: [41, 41],    // tamanho da sombra
              iconAnchor: [19, 41],    // ponto do ícone que corresponderá à localização do marcador
              shadowAnchor: [13, 41],  // mesmo para a sombra
              popupAnchor: [0, -45]    // ponto a partir do qual o popup deve abrir
            }
          });
          
          // Criar ícones específicos para início e fim do trecho
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

        // Popup é adicionado abaixo após processar as coordenadas

        // Adicionar um popup com informações gerais do trecho
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