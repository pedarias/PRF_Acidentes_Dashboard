# CLAUDE.md - PRF Acidentes Dashboard

## Running the Application
- Create/activate environment: `conda create -n myenv python=3.12` or `python -m venv venv && source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- Run application: `streamlit run app.py`
- Run data ingestion: `python data_ingestionall.py` (downloads and processes all accident data)

## Code Style Guidelines
- **Imports**: Group standard library, then third-party, then local imports
- **Type Hints**: Use type annotations for function parameters and return values
- **Docstrings**: Use triple quotes with parameter descriptions
- **Variable Naming**: Use snake_case for variables and functions; CamelCase for classes
- **Error Handling**: Use try/except blocks with specific exceptions
- **Data Processing**: Prefer pandas vectorized operations over loops
- **Comments**: Document complex data transformations and visualization settings

## Data Processing Patterns
- Use `@st.cache_data` for caching expensive data operations
- Convert numeric columns with: `df[col] = df[col].astype(str).str.replace(',', '.').astype(float, errors='ignore')`
- Fill missing values with median (numeric) or mode (categorical)
- Handle date/time with pandas: `pd.to_datetime(df['column'], format='%H:%M:%S', errors='coerce')`
- Use `pd.cut()` for binning data into categories