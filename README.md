# CP-Antrean-Truck

A modern truck queue management system built with React, TypeScript, and Vite.

## Technology Stack & Specifications

### Core Technologies
- **React**: 18.2.0
- **TypeScript**: 5.3.3
- **Vite**: 5.1.0
- **Node.js**: 18.20.5+ (tested with v18.20.5)
- **npm**: 10.8.2+ (tested with v10.8.2)

### Styling & UI
- **Tailwind CSS**: 3.4.1 - Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI
- **lucide-react**: Icon library
- **class-variance-authority**: For component variants
- **clsx & tailwind-merge**: For className management

### Development Dependencies
- **@vitejs/plugin-react**: 4.2.1
- **@types/react**: 18.2.48
- **@types/react-dom**: 18.2.18
- **PostCSS**: 8.4.33
- **Autoprefixer**: 10.4.17

## Project Structure

```
CP-Antrean-Truck/
├── public/             # Static assets
├── src/                # Source code
│   ├── assets/         # Images, fonts, etc.
│   ├── components/     # Reusable React components
│   │   └── ui/         # shadcn/ui components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions (utils.ts)
│   ├── pages/          # Page components
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main App component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles with Tailwind
├── .gitignore          # Git ignore rules
├── components.json     # shadcn/ui configuration
├── index.html          # HTML template
├── package.json        # Project dependencies
├── postcss.config.js   # PostCSS configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── tsconfig.node.json  # TypeScript configuration for Node
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CP-Antrean-Truck
```

2. Install dependencies:
```bash
npm install
```

## Available Scripts

### Development
```bash
npm run dev
```
Starts the development server at `http://localhost:3000` with hot module replacement (HMR).

### Build
```bash
npm run build
```
Type-checks the code and builds the application for production to the `dist` folder.

### Preview
```bash
npm run preview
```
Locally preview the production build.

### Type Checking
```bash
npm run lint
```
Runs TypeScript compiler in no-emit mode to check for type errors.

## Development Guidelines

### Code Style
- Use TypeScript for all components and utilities
- Follow React best practices and hooks guidelines
- Maintain consistent code formatting
- Use functional components with hooks

### Component Structure
- Place reusable components in `src/components/`
- Page-level components go in `src/pages/`
- Custom hooks should be in `src/hooks/`
- Type definitions belong in `src/types/`

### Styling
- Component-specific styles use CSS modules or styled-components
- Global styles are defined in `src/index.css`
- Follow mobile-first responsive design principles

## Features

This truck queue management system is designed to:
- Manage truck arrivals and departures
- Track queue positions and waiting times
- Provide real-time updates
- Generate reports and analytics

## Environment Requirements

- Node.js 18.20.5 or higher
- npm 10.8.2 or higher
- Modern web browser with ES2020 support

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, you can modify the port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Change to your preferred port
}
```

### TypeScript Errors
Run `npm run lint` to check for TypeScript errors before building.

### Build Issues
Ensure all dependencies are installed correctly:
```bash
rm -rf node_modules package-lock.json
npm install
```

## License

ISC License

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request