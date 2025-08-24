# CP-Antrean-Truck

A modern warehouse management system with visual storage unit management built with React, TypeScript, and Vite.

## Technology Stack & Specifications

### Core Technologies
- **React**: 18.2.0
- **TypeScript**: 5.3.3
- **Vite**: 5.1.0
- **Node.js**: 18.20.5+ (tested with v18.20.5)
- **npm**: 10.8.2+ (tested with v10.8.2)

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

3. Create .env file from example:
```bash
cp .env.example .env
```

4. **REQUIRED**: Update the decrypt secret key in .env:
```
VITE_DECRYPT_SECRET_KEY=your_secret_key_here
```
⚠️ **Important**: The application will not work without this environment variable. Make sure it matches the secret key used by your PHP backend.

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

## Usage

### Warehouse Management
The application provides two modes for warehouse interaction:

1. **Edit Mode** - Requires encrypted authentication
   - URL: `/warehouse?key={encrypted_data}`
   - Full CRUD operations on warehouse layout
   
2. **View Mode** - Public read-only access
   - URL: `/warehouse/:id/view?mode=desktop|tablet`
   - Display warehouse layout without editing

### Authentication
Edit mode requires encrypted data containing user credentials. The data is decrypted using AES-256-CBC encryption with the configured secret key.

## Architecture

The application follows a modular architecture with separate stores per page:
- **warehouseDetailStore** - Manages authenticated editing operations
- **warehouseViewStore** - Handles read-only warehouse display

This separation ensures clear boundaries between authenticated and public access, following microservice principles.

## Development

See [PROJECT_STANDARDS.md](./PROJECT_STANDARDS.md) for coding standards and project structure guidelines.