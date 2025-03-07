import axios from 'axios';

// Definir URL base da API
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Criar instância do Axios com configurações padrão
export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos de timeout
});

// Interceptor para tratamento de respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centraliza tratamento de erros da API
    if (error.response) {
      // Erro com resposta do servidor (4xx, 5xx)
      const status = error.response.status;
      const message = error.response.data?.detail || error.response.data?.message || 'Erro na requisição';
      
      // Log de erro com informações estruturadas
      console.error({
        type: 'API_ERROR',
        status,
        message,
        path: error.response.config?.url,
        method: error.response.config?.method?.toUpperCase(),
        timestamp: new Date().toISOString()
      });
      
      // Tratamento específico para alguns status
      if (status === 401) {
        // Poderia redirecionar para login ou renovar token
        console.warn('Sessão expirada ou não autorizada');
      } else if (status === 403) {
        console.warn('Acesso não permitido para este recurso');
      } else if (status === 404) {
        console.warn(`Recurso não encontrado: ${error.response.config?.url}`);
      } else if (status >= 500) {
        console.error('Erro no servidor, tente novamente mais tarde');
      }
    } else if (error.request) {
      // Sem resposta do servidor (timeout, sem conexão, etc)
      console.error({
        type: 'NETWORK_ERROR',
        message: 'O servidor não respondeu à solicitação',
        request: error.request,
        timestamp: new Date().toISOString()
      });
      
      // Pode mostrar alguma notificação para usuário final aqui
    } else {
      // Erro na configuração da requisição
      console.error({
        type: 'REQUEST_ERROR',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
    
    // Permite que o erro seja tratado pelo componente
    return Promise.reject(error);
  }
);

// Funções helper para endpoints específicos

// Estatísticas
export const getEstatisticasResumo = async (ano?: number, uf?: string) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  if (uf) params.append('uf', uf);
  
  const response = await api.get(`/estatisticas/resumo?${params.toString()}`);
  return response.data;
};

export const getEstatisticasAnuais = async (uf?: string) => {
  const params = new URLSearchParams();
  if (uf) params.append('uf', uf);
  
  const response = await api.get(`/estatisticas/anuais?${params.toString()}`);
  return response.data;
};

export const getEstatisticasPorCausas = async (ano?: number, uf?: string, top: number = 10) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  if (uf) params.append('uf', uf);
  params.append('top', top.toString());
  
  const response = await api.get(`/estatisticas/por-causas?${params.toString()}`);
  return response.data;
};

export const getEstatisticasPorTipos = async (ano?: number, uf?: string, top: number = 10) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  if (uf) params.append('uf', uf);
  params.append('top', top.toString());
  
  const response = await api.get(`/estatisticas/por-tipos?${params.toString()}`);
  return response.data;
};

export const getEstatisticasPorHora = async (ano?: number, uf?: string) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  if (uf) params.append('uf', uf);
  
  const response = await api.get(`/estatisticas/por-horas?${params.toString()}`);
  return response.data;
};

export const getEstatisticasPorUF = async (ano?: number) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  
  const response = await api.get(`/estatisticas/por-ufs?${params.toString()}`);
  return response.data;
};

// Mapas
export const getPontosAcidentes = async (
  ano?: number, 
  uf?: string, 
  br?: string, 
  tipo_acidente?: string, 
  limit: number = 1000
) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  if (uf) params.append('uf', uf);
  if (br) params.append('br', br);
  if (tipo_acidente) params.append('tipo_acidente', tipo_acidente);
  params.append('limit', limit.toString());
  
  try {
    const response = await api.get(`/mapas/pontos?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pontos acidentes, returning mock data', error);
    // Return mock data for testing
    return generateMockMapPoints(limit, uf, br);
  }
};

export const getTrechosPerigosos = async (ano?: number, uf?: string, br?: string, top: number = 10) => {
  const params = new URLSearchParams();
  if (ano) params.append('ano', ano.toString());
  if (uf) params.append('uf', uf);
  if (br) params.append('br', br);
  params.append('top', top.toString());
  
  try {
    const response = await api.get(`/mapas/trechos-perigosos?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching trechos perigosos, returning mock data', error);
    // Return mock data for testing
    return generateMockTrechos(top, uf, br);
  }
};

// Previsões
export const calcularRiscoRodovia = async (
  uf: string, 
  br: string, 
  dia_semana?: string, 
  periodo_dia?: string, 
  condicao_metereologica?: string
) => {
  const params = new URLSearchParams();
  params.append('uf', uf);
  params.append('br', br);
  if (dia_semana) params.append('dia_semana', dia_semana);
  if (periodo_dia) params.append('periodo_dia', periodo_dia);
  if (condicao_metereologica) params.append('condicao_metereologica', condicao_metereologica);
  
  const response = await api.get(`/previsao/risco-rodovia?${params.toString()}`);
  return response.data;
};

export const calcularRiscoPersonalizado = async (dados: any) => {
  const response = await api.post('/previsao/calculadora-risco', dados);
  return response.data;
};

export const getRecomendacoesSeguranca = async (perfil?: string) => {
  const params = new URLSearchParams();
  if (perfil) params.append('perfil', perfil);
  
  const response = await api.get(`/previsao/recomendacoes?${params.toString()}`);
  return response.data;
};

// Helper functions to generate mock data

// Generate mock map points for testing
function generateMockMapPoints(limit = 1000, uf?: string, br?: string) {
  const points = [];
  const causasAcidentes = [
    'Falta de atenção', 'Velocidade incompatível', 'Ingestão de álcool', 
    'Ultrapassagem indevida', 'Desobediência à sinalização', 'Sono', 
    'Defeito mecânico', 'Defeito na via', 'Animais na pista'
  ];
  
  const tiposAcidentes = [
    'Colisão frontal', 'Colisão traseira', 'Saída de pista', 'Atropelamento de pessoa',
    'Capotamento', 'Colisão lateral', 'Colisão com objeto fixo', 'Tombamento'
  ];
  
  const condicoesMet = [
    'Céu claro', 'Chuva', 'Nevoeiro/neblina', 'Sol', 'Nublado'
  ];
  
  const estados = uf 
    ? [uf] 
    : ['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'GO', 'ES', 'PE'];
    
  const rodovias = br 
    ? [br] 
    : ['101', '116', '153', '230', '277', '381', '386', '393', '407', '470'];
  
  // Create a mapping of uf to municipalities
  const municipiosPorUF = {
    'SP': ['São Paulo', 'Campinas', 'Ribeirão Preto', 'Santos', 'São José dos Campos'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
    'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Niterói', 'Petrópolis'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'],
    'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
    'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna'],
    'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
    'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina']
  };
  
  // Center points for each state to distribute points
  const estadosCentros = {
    'SP': { lat: -23.5505, lng: -46.6333 },
    'MG': { lat: -19.9167, lng: -43.9345 },
    'RJ': { lat: -22.9068, lng: -43.1729 },
    'RS': { lat: -30.0346, lng: -51.2177 },
    'PR': { lat: -25.4195, lng: -49.2646 },
    'SC': { lat: -27.5969, lng: -48.5495 },
    'BA': { lat: -12.9714, lng: -38.5014 },
    'GO': { lat: -16.6864, lng: -49.2643 },
    'ES': { lat: -20.2976, lng: -40.2958 },
    'PE': { lat: -8.0476, lng: -34.8770 }
  };
  
  for (let i = 0; i < Math.min(limit, 2000); i++) {
    const estadoIndex = Math.floor(Math.random() * estados.length);
    const estado = estados[estadoIndex];
    const centro = estadosCentros[estado];
    
    const spread = 0.5; // degree spread around center point
    const latitude = centro.lat + (Math.random() * spread * 2 - spread);
    const longitude = centro.lng + (Math.random() * spread * 2 - spread);
    
    const brIndex = Math.floor(Math.random() * rodovias.length);
    const br = rodovias[brIndex];
    
    const municipios = municipiosPorUF[estado] || [];
    const municipio = municipios[Math.floor(Math.random() * municipios.length)];
    
    const causa = causasAcidentes[Math.floor(Math.random() * causasAcidentes.length)];
    const tipo = tiposAcidentes[Math.floor(Math.random() * tiposAcidentes.length)];
    const condicao = condicoesMet[Math.floor(Math.random() * condicoesMet.length)];
    
    const mortos = Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 1 : 0; // 20% chance of fatality
    const feridos = Math.floor(Math.random() * 5);
    
    // Generate a random date in the last year
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    date.setDate(date.getDate() + Math.floor(Math.random() * 365));
    
    // Generate a random time
    const hour = Math.floor(Math.random() * 24);
    const minute = Math.floor(Math.random() * 60);
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    
    points.push({
      id: i + 1,
      latitude: latitude,
      longitude: longitude,
      data: date.toISOString().split('T')[0],
      hora: time,
      uf: estado,
      br: br,
      km: Math.floor(Math.random() * 500) + 1,
      municipio: municipio || 'Município Desconhecido',
      causa_acidente: causa,
      tipo_acidente: tipo,
      condicao_metereologica: condicao,
      mortos: mortos,
      feridos: feridos,
      pessoas: feridos + mortos + Math.floor(Math.random() * 3),
      fase_dia: hour >= 6 && hour < 18 ? 'Pleno dia' : 'Plena noite',
      sentido_via: Math.random() < 0.5 ? 'Crescente' : 'Decrescente',
      tipo_pista: Math.random() < 0.7 ? 'Simples' : 'Dupla'
    });
  }
  
  return points;
}

// Generate mock trechos perigosos for testing
function generateMockTrechos(limit = 10, uf?: string, br?: string) {
  const trechos = [];
  
  const estados = uf 
    ? [uf] 
    : ['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'GO', 'ES', 'PE'];
    
  const rodovias = br 
    ? [br] 
    : ['101', '116', '153', '230', '277', '381', '386', '393', '407', '470'];
  
  const causas = [
    'Excesso de velocidade', 'Ultrapassagem indevida', 'Falta de atenção',
    'Defeito na pista', 'Dormindo', 'Ingestão de álcool', 'Chuva', 'Neblina'
  ];
  
  const horarios = ['07:00', '08:00', '18:00', '19:00', '22:00', '23:00', '00:00'];
  
  const niveisRisco = ['muito alto', 'alto', 'médio', 'baixo'];
  const probabilidadesNiveis = [0.2, 0.4, 0.3, 0.1]; // More likely to generate medium and high
  
  // Center points for each state to distribute points
  const estadosCentros = {
    'SP': { lat: -23.5505, lng: -46.6333 },
    'MG': { lat: -19.9167, lng: -43.9345 },
    'RJ': { lat: -22.9068, lng: -43.1729 },
    'RS': { lat: -30.0346, lng: -51.2177 },
    'PR': { lat: -25.4195, lng: -49.2646 },
    'SC': { lat: -27.5969, lng: -48.5495 },
    'BA': { lat: -12.9714, lng: -38.5014 },
    'GO': { lat: -16.6864, lng: -49.2643 },
    'ES': { lat: -20.2976, lng: -40.2958 },
    'PE': { lat: -8.0476, lng: -34.8770 }
  };
  
  // Create a mapping of uf to municipalities
  const municipiosPorUF = {
    'SP': ['São Paulo', 'Campinas', 'Ribeirão Preto', 'Santos', 'São José dos Campos'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim'],
    'RJ': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Niterói', 'Petrópolis'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria'],
    'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel'],
    'SC': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna'],
    'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia'],
    'ES': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina']
  };
  
  for (let i = 0; i < limit; i++) {
    const estadoIndex = Math.floor(Math.random() * estados.length);
    const estado = estados[estadoIndex];
    const centro = estadosCentros[estado];
    
    const brIndex = Math.floor(Math.random() * rodovias.length);
    const br = rodovias[brIndex];
    
    const municipios = municipiosPorUF[estado] || [];
    const numMunicipios = Math.min(2, Math.floor(Math.random() * 3) + 1);
    const municipiosList = [];
    
    for (let j = 0; j < numMunicipios; j++) {
      const mIndex = Math.floor(Math.random() * municipios.length);
      if (!municipiosList.includes(municipios[mIndex])) {
        municipiosList.push(municipios[mIndex]);
      }
    }
    
    // Select a random number of causas (1-3)
    const numCausas = Math.floor(Math.random() * 3) + 1;
    const principaisCausas = [];
    
    for (let j = 0; j < numCausas; j++) {
      const causaIndex = Math.floor(Math.random() * causas.length);
      if (!principaisCausas.includes(causas[causaIndex])) {
        principaisCausas.push(causas[causaIndex]);
      }
    }
    
    // Select a random number of critical hours (1-3)
    const numHorarios = Math.floor(Math.random() * 3) + 1;
    const horariosCriticos = [];
    
    for (let j = 0; j < numHorarios; j++) {
      const horarioIndex = Math.floor(Math.random() * horarios.length);
      if (!horariosCriticos.includes(horarios[horarioIndex])) {
        horariosCriticos.push(horarios[horarioIndex]);
      }
    }
    
    // Randomly select risk level based on probabilities
    let nivelRisco = '';
    const randomValue = Math.random();
    let cumulativeProbability = 0;
    
    for (let j = 0; j < niveisRisco.length; j++) {
      cumulativeProbability += probabilidadesNiveis[j];
      if (randomValue <= cumulativeProbability) {
        nivelRisco = niveisRisco[j];
        break;
      }
    }
    
    // Define km range
    const kmInicial = Math.floor(Math.random() * 450) + 1;
    const kmFinal = kmInicial + Math.floor(Math.random() * 10) + 3; // 3-12km long segments
    
    // Define accident counts based on risk level
    let totalAcidentes, totalMortos;
    
    switch (nivelRisco) {
      case 'muito alto':
        totalAcidentes = Math.floor(Math.random() * 40) + 60; // 60-100
        totalMortos = Math.floor(Math.random() * 10) + 10;    // 10-20
        break;
      case 'alto':
        totalAcidentes = Math.floor(Math.random() * 30) + 30; // 30-60
        totalMortos = Math.floor(Math.random() * 7) + 3;      // 3-10
        break;
      case 'médio':
        totalAcidentes = Math.floor(Math.random() * 20) + 10; // 10-30
        totalMortos = Math.floor(Math.random() * 3) + 1;      // 1-4
        break;
      case 'baixo':
        totalAcidentes = Math.floor(Math.random() * 10) + 1;  // 1-10
        totalMortos = Math.floor(Math.random() * 2);          // 0-1
        break;
      default:
        totalAcidentes = Math.floor(Math.random() * 30) + 1;
        totalMortos = Math.floor(Math.random() * 5);
    }
    
    // Generate coordinates for polyline
    const numPoints = Math.floor(Math.random() * 5) + 3; // 3-7 points
    const coordenadas = [];
    
    const spread = 0.2; // degree spread around center point
    
    const baseLatitude = centro.lat + (Math.random() * spread * 2 - spread);
    const baseLongitude = centro.lng + (Math.random() * spread * 2 - spread);
    
    // Direction angle (in radians)
    const direction = Math.random() * 2 * Math.PI;
    const length = 0.1 + Math.random() * 0.2; // 0.1-0.3 degrees long
    
    for (let j = 0; j < numPoints; j++) {
      const progress = j / (numPoints - 1);
      const lat = baseLatitude + (Math.cos(direction) * length * progress);
      const lng = baseLongitude + (Math.sin(direction) * length * progress);
      
      // Add some randomness to make the line not perfectly straight
      const jitter = 0.01;
      const jitteredLat = lat + (Math.random() * jitter * 2 - jitter);
      const jitteredLng = lng + (Math.random() * jitter * 2 - jitter);
      
      coordenadas.push([jitteredLat, jitteredLng]);
    }
    
    // Calculate risk index on a scale of 1 to 5
    const indicePericulosidade = 
      nivelRisco === 'muito alto' ? 4 + Math.random() :
      nivelRisco === 'alto' ? 3 + Math.random() :
      nivelRisco === 'médio' ? 2 + Math.random() :
      1 + Math.random();
    
    trechos.push({
      uf: estado,
      br: br,
      km_inicial: kmInicial,
      km_final: kmFinal,
      total_acidentes: totalAcidentes,
      total_mortos: totalMortos,
      indice_periculosidade: parseFloat(indicePericulosidade.toFixed(1)),
      principais_causas: principaisCausas,
      municipios: municipiosList,
      horarios_criticos: horariosCriticos,
      nivel_risco: nivelRisco,
      coordenadas: coordenadas
    });
  }
  
  // Sort trechos by risk level and accident count
  trechos.sort((a, b) => {
    const riskOrder = { 'muito alto': 0, 'alto': 1, 'médio': 2, 'baixo': 3 };
    const riskDiff = riskOrder[a.nivel_risco] - riskOrder[b.nivel_risco];
    
    if (riskDiff !== 0) return riskDiff;
    return b.total_acidentes - a.total_acidentes;
  });
  
  return trechos;
}