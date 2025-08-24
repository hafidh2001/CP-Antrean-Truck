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

## Routes Documentation

### URL Structure

| Page | URL Pattern | Example | Description |
|------|-------------|---------|-------------|
| Home | `/` | `/` | Homepage dengan daftar warehouse |
| Warehouse Detail | `/warehouse/:warehouseId` | `/warehouse/1` | Detail warehouse untuk editing |
| Warehouse View - Desktop | `/warehouse/:warehouseId/view?mode=desktop` | `/warehouse/1/view?mode=desktop` | View warehouse - desktop mode |
| Warehouse View - Tablet | `/warehouse/:warehouseId/view?mode=tablet` | `/warehouse/1/view?mode=tablet` | View warehouse - tablet mode |
| Decrypt | `/decrypt?key={encrypted}` | `/decrypt?key=3xrOkZST...` | Decrypt AES-256-CBC encrypted data |

### Implementation Details

#### Routes Class (`src/utils/routes.ts`)
```typescript
export class ROUTES {
  static get base() { return `/` as const; }
  static get warehouse() { return `/warehouse` as const; }
  
  static warehouseDetail(warehouseId: string): string {
    return `${this.warehouse}/${warehouseId}` as const;
  }
  
  static warehouseView(warehouseId: string): string {
    return `${this.warehouse}/${warehouseId}/view` as const;
  }
}
```

#### Navigation Usage
```typescript
// Navigate to detail page
navigate(ROUTES.warehouseDetail(String(warehouse.id)));

// Navigate to view page - desktop
navigate(`${ROUTES.warehouseView(String(warehouse.id))}?mode=desktop`);

// Navigate to view page - tablet  
navigate(`${ROUTES.warehouseView(String(warehouse.id))}?mode=tablet`);
```

## Decrypt Page Guide

### Overview
Halaman decrypt digunakan untuk mendekripsi data yang dienkripsi oleh PHP backend menggunakan AES-256-CBC.

### URL Format
```
/decrypt?key={encrypted_data}
```

### Example URL
```
http://localhost:3000/decrypt?key=3xrOkZSTzZ4/P5cOyvKhFY/RwSoj1q8EKRJzR6opgGPdoTEkJAHq/f86y5lt0r9CMoWYLlPNM6hP/ljKz+6CrQ==
```

### Features
1. **Automatic Decryption**: Otomatis decrypt saat halaman dibuka
2. **Professional UI**: Clean design dengan gradient background
3. **JSON Display**: Menampilkan hasil decrypt dalam format JSON
4. **Copy to Clipboard**: Fitur copy untuk user token
5. **Error Handling**: Menampilkan pesan error jika decrypt gagal

### Technical Details
- **Algorithm**: AES-256-CBC
- **Key Derivation**: SHA-256
- **IV**: 16 bytes (included in encrypted data)
- **Secret Key**: Configured for testing environment