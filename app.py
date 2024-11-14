# Import libraries
import streamlit as st
import pandas as pd
import altair as alt
import plotly.express as px
import requests

# Page configuration
st.set_page_config(
    page_title="Painel de Acidentes de Trânsito no Brasil",
    page_icon="🚦",
    layout="wide",
    initial_sidebar_state="expanded"
)

alt.themes.enable("dark")

# CSS styling
st.markdown("""
<style>
[data-testid="block-container"] {
    padding: 1rem 2rem 0 2rem;
    margin-bottom: -7rem;
}
[data-testid="stMetric"] {
    background-color: #393939;
    text-align: center;
    padding: 15px 0;
}
[data-testid="stMetricLabel"] {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
""", unsafe_allow_html=True)

# Load data
df = pd.read_csv('datatran_all_years.csv')

# Data preprocessing
df['data_inversa'] = pd.to_datetime(df['data_inversa'])
df['year'] = df['data_inversa'].dt.year

df['horario'] = pd.to_datetime(df['horario'], format='%H:%M:%S', errors='coerce')
df['HORA'] = df['horario'].dt.hour.fillna(-1).astype(int)
df['PERIODO_DIA'] = df['HORA'].apply(
    lambda x: 'MANHÃ' if 5 <= x < 12 else
              'TARDE' if 12 <= x < 18 else
              'NOITE' if 18 <= x < 24 else
              'MADRUGADA' if 0 <= x < 5 else 'DESCONHECIDO'
)

df['km'] = df['km'].astype(str).str.replace(',', '.').astype(float)
df['latitude'] = df['latitude'].astype(str).str.replace(',', '.').astype(float)
df['longitude'] = df['longitude'].astype(str).str.replace(',', '.').astype(float)

df['TOTAL_FERIDOS'] = df['feridos_leves'] + df['feridos_graves']
df['mortos'] = df['mortos'].fillna(0).astype(int)

df = df.drop(['id', 'fase_dia', 'feridos_leves', 'feridos_graves', 'ilesos', 'ignorados',
              'feridos', 'regional', 'delegacia', 'uop'], axis=1, errors='ignore')

df.fillna({'km': df['km'].median(), 'latitude': df['latitude'].median(),
           'longitude': df['longitude'].median(), 'veiculos': df['veiculos'].median(),
           'pessoas': df['pessoas'].median(), 'TOTAL_FERIDOS': df['TOTAL_FERIDOS'].median(),
           'mortos': df['mortos'].median()}, inplace=True)

categorical_cols = ['uf', 'municipio', 'causa_acidente', 'tipo_acidente', 'sentido_via',
                    'condicao_metereologica', 'tipo_pista', 'tracado_via', 'uso_solo',
                    'PERIODO_DIA', 'dia_semana']
for col in categorical_cols:
    df[col] = df[col].fillna(df[col].mode()[0])

#df['PERIODO_DIA'].replace('DESCONHECIDO', df['PERIODO_DIA'].mode()[0], inplace=True)

# Filter only accidents with deaths
df_mortos = df[df['mortos'] > 0]

# Sidebar
with st.sidebar:
    st.title('🚦 Painel de Acidentes de Trânsito no Brasil')

    years = sorted(df['year'].unique(), reverse=True)
    selected_year = st.selectbox('Selecione um Ano', years)
    df_selected_year = df[df['year'] == selected_year]
    df_mortos_selected_year = df_mortos[df_mortos['year'] == selected_year]
    # Ensure latitude and longitude are numeric


    fig = px.scatter(
        df_selected_year,
        x='longitude',
        y='latitude',
        opacity=0.01,
        title='Distribuição Geográfica dos Acidentes',
        labels={'longitude': 'Longitude', 'latitude': 'Latitude'},
        width=500,
        height=400
    )

    fig.update_traces(marker=dict(size=2))
    st.plotly_chart(fig, use_container_width=True)


    temas_cor = {
        'Azul': 'blues',
        'Cividis': 'cividis',
        'Verde': 'greens',
        'Inferno': 'inferno',
        'Magma': 'magma',
        'Plasma': 'plasma',
        'Vermelho': 'reds',
        'Arco-íris': 'rainbow',
        'Turbo': 'turbo',
        'Viridis': 'viridis'
    }
    tema_selecionado = st.selectbox('Selecione um Tema de Cor', list(temas_cor.keys()))
    selected_color_theme = temas_cor[tema_selecionado]

# Helper functions
def make_choropleth(input_df, input_column, input_color_theme):
    url = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson'
    geojson_data = requests.get(url).json()
    state_name_to_code = {
        'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
        'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
        'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
        'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
        'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
        'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
        'Sergipe': 'SE', 'Tocantins': 'TO'
    }
    for feature in geojson_data['features']:
        state_name = feature['properties']['name']
        uf = state_name_to_code.get(state_name)
        feature['properties']['uf'] = uf

    state_counts = input_df.groupby('uf')[input_column].mean().reset_index()
    state_counts.columns = ['uf', input_column]

    choropleth = px.choropleth(
        state_counts,
        geojson=geojson_data,
        locations='uf',
        color=input_column,
        featureidkey='properties.uf',
        color_continuous_scale=input_color_theme,
        scope='south america',
        labels={input_column: 'Média de Mortos por Acidente'}
    )
    choropleth.update_geos(fitbounds="locations", visible=False)
    choropleth.update_layout(
        template='plotly_dark',
        margin=dict(l=0, r=0, t=0, b=0),
        height=350
    )
    return choropleth

#  Format number with K and M
def format_number(num):
    if num >= 1_000_000:
        return f'{num / 1_000_000:.1f} M'
    elif num >= 1_000:
        return f'{num / 1_000:.1f} K'
    else:
        return str(num)

def calculate_diff_mortos(df, selected_year):
    if selected_year - 1 in df['year'].unique():
        mortos_previous_year = df[df['year'] == selected_year - 1]['mortos'].sum()
        mortos_selected_year = df[df['year'] == selected_year]['mortos'].sum()
        diff_mortos = mortos_selected_year - mortos_previous_year
        diff_mortos_percentage = (diff_mortos / mortos_previous_year) * 100 if mortos_previous_year else 0
        return diff_mortos, diff_mortos_percentage
    return 0, 0

# Dashboard Main Panel
col1, col2, col3 = st.columns((1.5, 4.5, 2), gap='medium')

with col1:
    st.markdown('#### Métricas Principais')
    total_accidents = df_selected_year.shape[0]
    st.metric(label='Total de Acidentes', value=format_number(total_accidents))
    total_mortos = df_selected_year['mortos'].sum()
    st.metric(label='Total de Mortos', value=int(total_mortos))
    media_mortos = df_selected_year['mortos'].mean() if total_accidents > 0 else 0
    st.metric(label='Média de Mortos por Acidente', value=f"{media_mortos:.2f}")
    diff_mortos, diff_percentage = calculate_diff_mortos(df, selected_year)
    delta_text = f"{diff_percentage:.2f}%"
    st.metric(label='Diferença de Mortos', value=format_number(diff_mortos), delta=delta_text)

    st.markdown('#### Acidentes com Mortes por Tipo de Dia')
    if not df_mortos_selected_year.empty:
        # Create a copy to avoid SettingWithCopyWarning
        df_mortos_tipo_dia = df_mortos_selected_year.copy()
        df_mortos_tipo_dia['dia_semana'] = df_mortos_tipo_dia['dia_semana'].str.upper()
        df_mortos_tipo_dia['Tipo de Dia'] = df_mortos_tipo_dia['dia_semana'].apply(
            lambda x: 'Fim de Semana' if x in ['SÁBADO', 'DOMINGO'] else 'Dia Útil'
        )
        tipo_dia_counts = df_mortos_tipo_dia['Tipo de Dia'].value_counts().reset_index()
        tipo_dia_counts.columns = ['Tipo de Dia', 'Contagem']
        pie_chart = px.pie(
            tipo_dia_counts,
            names='Tipo de Dia',
            values='Contagem',
            color='Tipo de Dia',
            color_discrete_sequence=px.colors.sequential.Plasma_r,
            height=300  # Reduced height to shrink the pie chart
        )
        pie_chart.update_layout(
            template='plotly_dark',
            legend_font_size=12,
            legend_title_font_size=10,
            legend=dict(yanchor="top", y=0.95, xanchor="left", x=0.05)
        )
        st.plotly_chart(pie_chart, use_container_width=False, width=300)  # Reduced width to shrink the pie chart
    else:
        st.write("Sem dados disponíveis para o gráfico.")


with col2:
    st.markdown('#### Média de Mortos por Estado')
    if not df_selected_year.empty:
        choropleth = make_choropleth(df_selected_year, 'mortos', selected_color_theme)
        st.plotly_chart(choropleth, use_container_width=True)
    else:
        st.write("Sem dados disponíveis para o mapa.")

    st.markdown('#### Acidentes com Mortes por Hora do Dia')
    df_mortos_hour = df_mortos_selected_year.copy()
    if not df_mortos_hour.empty:
        hour_weather = df_mortos_hour.groupby(['HORA', 'condicao_metereologica']).size().reset_index(name='Contagem')
        bar_chart = alt.Chart(hour_weather).mark_bar().encode(
            x=alt.X('HORA:O', title='Hora do Dia'),
            y=alt.Y('Contagem:Q', title='Número de Acidentes com Mortes'),
            color=alt.Color('condicao_metereologica:N', title='Condição Meteorológica'),
            tooltip=['HORA', 'condicao_metereologica', 'Contagem']
        ).properties(
            width=800,
            height=400
        )
        st.altair_chart(bar_chart, use_container_width=True)
    else:
        st.write("Sem dados disponíveis para o gráfico.")

    # Create sub-columns within col3
    with col2:
        st.markdown('#### Principais Causas de Acidentes')

        subcol1, subcol2 = st.columns(2)

        with subcol1:
            st.markdown('##### Principais Causas de Acidentes')
            cause = df_selected_year['causa_acidente'].value_counts().nlargest(5).reset_index()
            cause.columns = ['Causa', 'Contagem']
            cause_sorted = cause.sort_values('Contagem', ascending=False)

            st.dataframe(
                cause_sorted,
                hide_index=True,
                column_config={
                    "Causa": st.column_config.TextColumn("Causa"),
                    "Contagem": st.column_config.ProgressColumn(
                        "Contagem",
                        format="%d",
                        min_value=0,
                        max_value=int(cause_sorted['Contagem'].max()),
                    ),
                },
            )

        with subcol2:
            st.markdown('##### Principais Causas relacionadas a Acidentes Fatais')
            cause_fatal = df_selected_year.groupby('causa_acidente')['mortos'].mean().nlargest(5).reset_index()
            cause_fatal.columns = ['Causa', 'Taxa de Acidentes Fatais']
            cause_fatal_sorted = cause_fatal.sort_values('Taxa de Acidentes Fatais', ascending=False)

            st.dataframe(
                cause_fatal_sorted,
                hide_index=True,
                column_config={
                    "Causa": st.column_config.TextColumn("Causa"),
                    "Taxa de Acidentes Fatais": st.column_config.ProgressColumn(
                        "Taxa de Acidentes Fatais",
                        format="%.2f",
                        min_value=0,
                        max_value=cause_fatal_sorted['Taxa de Acidentes Fatais'].max(),
                    ),
                },
            )

        st.markdown('#### Principais Tipos de Acidentes')

        subcol3, subcol4 = st.columns(2)

        with subcol3:
            st.markdown('##### Principais Tipos de Acidentes')
            tipo = df_selected_year['tipo_acidente'].value_counts().nlargest(5).reset_index()
            tipo.columns = ['Tipo', 'Contagem']
            tipo_sorted = tipo.sort_values('Contagem', ascending=False)

            st.dataframe(
                tipo_sorted,
                hide_index=True,
                column_config={
                    "Tipo": st.column_config.TextColumn("Tipo"),
                    "Contagem": st.column_config.ProgressColumn(
                        "Contagem",
                        format="%d",
                        min_value=0,
                        max_value=int(tipo_sorted['Contagem'].max()),
                    ),
                },
            )

        with subcol4:
            st.markdown('##### Principais Tipos relacionados a Acidentes Fatais')
            tipo_fatal = df_selected_year.groupby('tipo_acidente')['mortos'].mean().nlargest(5).reset_index()
            tipo_fatal.columns = ['Tipo', 'Taxa de Acidentes Fatais']
            tipo_fatal_sorted = tipo_fatal.sort_values('Taxa de Acidentes Fatais', ascending=False)

            st.dataframe(
                tipo_fatal_sorted,
                hide_index=True,
                column_config={
                    "Tipo": st.column_config.TextColumn("Tipo"),
                    "Taxa de Acidentes Fatais": st.column_config.ProgressColumn(
                        "Taxa de Acidentes Fatais",
                        format="%.2f",
                        min_value=0,
                        max_value=tipo_fatal_sorted['Taxa de Acidentes Fatais'].max(),
                    ),
                },
            )

    
with col3:

    # Distribuição da classificação de acidentes
    st.markdown('#### Distribuição de Classificação de Acidentes')
    class_counts = df_selected_year['classificacao_acidente'].value_counts().reset_index()
    class_counts.columns = ['Classificação', 'Contagem']
    bar_chart = alt.Chart(class_counts).mark_bar().encode(
        x=alt.X('Classificação:O', title='Classificação do Acidente'),
        y=alt.Y('Contagem:Q', title='Número de Acidentes'),
        tooltip=['Classificação', 'Contagem']
    ).properties(
        width=300,
        height=300
    )
    st.altair_chart(bar_chart)

    st.markdown('#### Taxa de Acidentes Fatais por Período do Dia')
    period_fatal = df_selected_year.groupby('PERIODO_DIA')['mortos'].mean().reset_index()
    period_fatal.columns = ['Período do Dia', 'Taxa de Mortos']
    period_chart = alt.Chart(period_fatal).mark_bar().encode(
        x=alt.X('Período do Dia:O', title='Período do Dia'),
        y=alt.Y('Taxa de Mortos:Q', title='Média de Mortos'),
        tooltip=['Período do Dia', alt.Tooltip('Taxa de Mortos:Q', format='.2f')]
    ).properties(
        width=300,
        height=300
    )
    st.altair_chart(period_chart)


    with col3.expander('Sobre', expanded=True):
        st.write('''
            - **Fonte de Dados**: [Portal de Dados Abertos da PRF](https://portal.prf.gov.br/dados-abertos-acidentes).
            - **Descrição**: Este painel apresenta uma análise dos acidentes de trânsito no Brasil.
            - **Uso**: Selecione o ano desejado e tema de cor na barra lateral para atualizar as visualizações.
            - **Análises Adicionais**:
                - **Acidentes com Mortes por Hora do Dia**: Visualiza os acidentes fatais ao longo do dia, considerando as condições meteorológicas.
                - **Taxa de Acidentes Fatais por Período do Dia**: Média de mortos por período do dia.
                - **Principais Causas de Acidentes**: Top 5 causas com maior número de acidentes.
                - **Taxa de Acidentes Fatais por Causa**: Top 5 causas com maior média de mortos por acidente.
        ''')