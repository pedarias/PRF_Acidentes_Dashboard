# Painel de Acidentes de Trânsito no Brasil 🚦
![PRF - Acidentes de Transito Dashboard](images/dashui.png)

Este projeto é uma aplicação web interativa desenvolvida com [Streamlit](https://streamlit.io/) para visualizar e analisar dados de acidentes de trânsito no Brasil.

## Sumário

- [Descrição](#descrição)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Executar](#como-executar)
- [Uso](#uso)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Contribuição](#contribuição)
- [Licença](#licença)

## Descrição

A aplicação permite explorar dados de acidentes de trânsito ocorridos no Brasil, fornecendo visualizações interativas e insights valiosos sobre padrões e tendências.

## Funcionalidades

- **Visualização de Dados:** Gráficos interativos que mostram estatísticas de acidentes por ano, tipo, localização e outros fatores relevantes.
- **Interface Personalizável:** Uso de temas e estilos personalizados para melhorar a experiência do usuário.
- **Interatividade:** Possibilidade de filtrar e explorar os dados em tempo real.

## Pré-requisitos

- Python.
- Gerenciador de pacotes `pip`.
- Ambiente virtual (recomendado).

## Instalação

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seu-usuario/seu-repositorio.git
   cd seu-repositorio
   ```

2. **Crie um ambiente virtual:**
```bash
python -m venv venv
source venv/bin/activate   # No Windows: venv\Scripts\activate

conda create -n myenv -python=3.12
```

3. **Instale as dependências:**
``` bash 
pip install -r requirements.txt
```

## Como Executar
Configure a Aplicação:

1. Certifique-se de que os dados necessários (arquivos CSV dos anos 2021 a 2024) estão na pasta adequada e que o caminho dos arquivos está correto no script ``app.py`` (no mesmo diretorio).
Ao executar arquivo ``data_ingestion.py`` ele faz isso automaticamente (concatena dados de 2021 a 2024). Caso execute o arquivo instale as bibliotecas necessarias como gdown e chartdet.

2. No terminal, inicie o Streamlit:
```bash
streamlit run app.py
```

3. Acesse no Navegador:

Abra o link fornecido no terminal, ``http://localhost:8501``, para visualizar a aplicação.

## Uso
- Navegue pela interface para visualizar diferentes insights dos dados.
- Utilize os controles e filtros disponíveis para personalizar as visualizações.
- Interaja com os gráficos para obter informações detalhadas sobre pontos específicos.

## Tecnologias Utilizadas

- [Streamlit](https://streamlit.io/): Framework para criação de aplicações web em Python.
- [Pandas](https://pandas.pydata.org/): Biblioteca para manipulação e análise de dados.
- [Altair](https://altair-viz.github.io/): Biblioteca declarativa para criação de visualizações estatísticas.
- [Plotly](https://plotly.com/): Biblioteca para criação de gráficos interativos.
- [Requests](https://pypi.org/project/requests/): Biblioteca para realizar requisições HTTP em Python.

## Contribuição
Contribuições são bem-vindas! 

## Contato

##### Pedro Henrique Arias Oliveira: 
<p align="center"> 
  <a href="https://www.linkedin.com/in/pedroarias92/" target="blank">
    <img align="center" src="https://logosmarcas.net/wp-content/uploads/2020/04/Linkedin-Logo.png" height="30" />
  </a> 
  <a href="mailto:pedro.oliveira@sistemafiep.org.br" target="blank">
    <img align="center" src="https://w7.pngwing.com/pngs/995/259/png-transparent-microsoft-outlook-logo-outlook-com-microsoft-outlook-email-microsoft-office-365-outlook-miscellaneous-blue-text.png" height="30" />
  </a>
</p>