# CLAUDE.md - PRF Acidentes Dashboard (Frontend)

## Build and Development Commands
- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm run start`
- Lint code: `npm run lint`

## Code Style Guidelines
- **Imports**: Group React imports, then external libraries, then internal imports with `@/` prefix
- **Component Structure**: Use functional components with TypeScript interfaces for props
- **State Management**: Use React hooks (useState, useEffect, custom hooks) 
- **Data Fetching**: Use TanStack Query (useQuery hook) for API requests
- **Error Handling**: Use try/catch blocks and provide fallback UIs with Skeleton components
- **CSS Styling**: Use MUI components with sx prop for custom styling
- **Naming Conventions**: PascalCase for components, camelCase for variables/functions
- **Types**: Define TypeScript interfaces for data structures and component props
- **Comments**: Document complex data transformations and component props

## API Integration Patterns
- Use the `api.ts` service for all API calls
- Handle loading states with Skeleton components
- Provide mock/fallback data when API calls fail
- Use URLSearchParams for query parameters
- Always handle errors with appropriate user feedback