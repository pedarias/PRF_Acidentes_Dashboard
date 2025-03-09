import React, { useState, useEffect } from 'react';
import { Box, Grid, FormControl, InputLabel, Select, MenuItem, TextField, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

// Estados brasileiros para o filtro de UF
const ESTADOS_BR = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

// Obter o ano atual para o range do filtro de ano
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_RANGE = Array.from({ length: CURRENT_YEAR - 2013 }, (_, i) => 2014 + i);

interface FilterPanelProps {
  onFilterChange: (filter: any) => void;
  filter: any;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange, filter }) => {
  // Estado local para evitar múltiplas atualizações
  const [localFilter, setLocalFilter] = useState(filter);

  // Atualiza o estado local quando os filtros externos mudam
  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  // Manipuladores de eventos para mudanças nos filtros
  const handleYearChange = (event) => {
    const newFilter = { ...localFilter, year: event.target.value };
    setLocalFilter(newFilter);
  };

  const handleUfChange = (event) => {
    const newFilter = { ...localFilter, uf: event.target.value };
    setLocalFilter(newFilter);
  };

  // Aplicar filtros
  const handleApplyFilters = () => {
    onFilterChange(localFilter);
  };

  // Limpar filtros
  const handleClearFilters = () => {
    const defaultFilter = {
      year: CURRENT_YEAR - 1,
      uf: ''
    };
    setLocalFilter(defaultFilter);
    onFilterChange(defaultFilter);
  };
  
  // Apply filters immediately when they change
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange(localFilter);
    }, 300); // Small delay to avoid too many requests
    
    return () => {
      clearTimeout(handler);
    };
  }, [localFilter, onFilterChange]);

  return (
    <Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={3} lg={2}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="year-select-label">Ano</InputLabel>
            <Select
              labelId="year-select-label"
              id="year-select"
              value={localFilter.year}
              onChange={handleYearChange}
              label="Ano"
            >
              {YEAR_RANGE.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={4}>
          <FormControl fullWidth variant="outlined" size="small">
            <InputLabel id="uf-select-label">Estado (UF)</InputLabel>
            <Select
              labelId="uf-select-label"
              id="uf-select"
              value={localFilter.uf}
              onChange={handleUfChange}
              label="Estado (UF)"
            >
              <MenuItem value="">Todos os estados</MenuItem>
              {ESTADOS_BR.map((estado) => (
                <MenuItem key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} - {estado.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={12} md={4} lg={6} display="flex" gap={1}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleApplyFilters}
            fullWidth
          >
            Aplicar
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleClearFilters}
          >
            Limpar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FilterPanel;