# Project Standards Guide

## 1. Project Structure

```
src/
├── pages/                    # Page components organized by role
│   ├── admin/               # Admin role pages
│   │   ├── warehouseDetail/ # Edit mode page
│   │   │   ├── WarehouseDetailPage.tsx
│   │   │   └── _components/ # Page-specific components
│   │   └── warehouseView/   # View mode page
│   │       ├── WarehouseViewPage.tsx
│   │       └── _components/ # Page-specific components
│   ├── krani/               # Krani role pages
│   │   └── antreanTruck/    # Truck queue page
│   │       ├── AntreanTruckPage.tsx
│   │       └── _components/ # Page-specific components
│   └── home/                # Shared/public pages
│       └── HomePage.tsx
├── store/                   # Zustand stores (one per module)
│   ├── warehouseDetailStore.ts
│   ├── warehouseViewStore.ts
│   ├── antreanTruckStore.ts
│   └── homeStore.ts
├── types/                   # TypeScript types (organized by module)
│   ├── warehouseDetail/     # Types for detail module
│   │   ├── index.ts        # Main types (IWarehouse, IStorageUnit, etc.)
│   │   └── store.ts        # Store-specific types
│   ├── warehouseView/       # Types for view module
│   │   └── index.ts        # Store interface only
│   ├── antreanTruck/        # Types for antrean truck module
│   │   ├── index.ts        # Main types (IAntrean, IAntreanCard)
│   │   └── store.ts        # Store interface
│   └── home/                # Types for home module
│       ├── index.ts        # Main types (IWarehouse)
│       └── store.ts        # Store interface
├── services/                # API services (shared across modules)
│   └── warehouseApi.ts
├── functions/               # Business logic functions (shared)
│   ├── decrypt.ts          # Encryption/decryption logic
│   └── warehouseHelpers.ts # Type guards and helpers
├── utils/                   # Pure utility functions
│   └── routes.ts           # Route constants and helpers
├── hooks/                   # Custom React hooks
│   └── useModal.ts
└── constants/              # Constants (shared)
    └── warehouse.ts

```

## 2. Folder Usage Guidelines

### When to use each folder:

#### `/pages`
- React components that represent full pages/routes
- Each page should have its own folder
- Page-specific components go in `_components` subfolder
- Example: `WarehouseDetailPage.tsx`, `HomePage.tsx`

#### `/store`
- Zustand state management stores
- One store per page/module for isolation
- Named as `[module]Store.ts`
- Example: `warehouseDetailStore.ts`, `homeStore.ts`

#### `/types`
- TypeScript interfaces, types, and enums
- Organized by module/feature
- Shared types go in root `types/index.ts`
- Module-specific types in `types/[module]/`
- Example: `types/warehouseDetail/index.ts`

#### `/services`
- API calls and external service integrations
- HTTP request logic
- Data transformation for API
- Example: `warehouseApi.ts`, `authService.ts`

#### `/functions`
- Business logic functions
- Data processing and transformation
- Complex calculations
- Encryption/decryption logic
- Type guards and validators
- Example: `decrypt.ts`, `warehouseHelpers.ts`, `calculatePrice.ts`

#### `/utils`
- Pure utility functions (no business logic)
- Route configuration
- General-purpose helpers
- No side effects
- Example: `routes.ts`, `formatDate.ts`, `classNames.ts`

#### `/hooks`
- Custom React hooks
- Reusable stateful logic
- Must start with "use"
- Example: `useModal.ts`, `useDebounce.ts`, `useLocalStorage.ts`

#### `/constants`
- Application constants
- Configuration values
- Enum-like objects
- Magic numbers/strings
- Example: `warehouse.ts`, `apiEndpoints.ts`, `colors.ts`

#### `/components`
- Shared React components
- UI components used across multiple pages
- Should be generic and reusable
- Example: `ui/button.tsx`, `layout/AppWrapper.tsx`

### Decision Flow:
1. **Is it a full page?** → `/pages`
2. **Is it state management?** → `/store`
3. **Is it a type definition?** → `/types`
4. **Is it an API call?** → `/services`
5. **Is it business logic or data processing?** → `/functions`
6. **Is it a pure utility with no business logic?** → `/utils`
7. **Is it a reusable React hook?** → `/hooks`
8. **Is it a constant value?** → `/constants`
9. **Is it a reusable UI component?** → `/components`

## 2. Import Standards

### Order of Imports
1. External libraries (React, Zustand, etc.)
2. Types from the same module
3. Types from other modules (only if necessary)
4. Utilities and services
5. Components

### Example:
```typescript
// External libraries
import { create } from 'zustand';

// Module-specific types
import type { WarehouseDetailStore } from '@/types/warehouseDetail/store';

// Shared types (only what's needed)
import { ElementTypeEnum } from '@/types';

// Services and utilities
import { warehouseApi } from '@/services/warehouseApi';
import { decryptAES } from '@/utils/decrypt';
```

## 3. Type Declaration Standards

### Store Types
- Each module should have its own store interface in `types/[module]/store.ts`
- Import only the types you actually use in the implementation
- Use `type` imports when possible to avoid runtime overhead

### Shared Types
- Common enums and interfaces go in `@/types/index.ts`
- Module-specific types go in `@/types/[module]/index.ts`

## 4. Naming Conventions

### Files
- Components: PascalCase (e.g., `WarehouseDetailPage.tsx`)
- Stores: camelCase with "Store" suffix (e.g., `warehouseDetailStore.ts`)
- Types: camelCase folders, PascalCase interfaces
- Utils: camelCase (e.g., `decrypt.ts`)

### Types/Interfaces
- Interfaces: Prefix with "I" (e.g., `IWarehouse`)
- Types: Prefix with "T" (e.g., `TAnyStorageUnit`)
- Enums: Suffix with "Enum" (e.g., `StorageTypeEnum`)

## 5. Module Boundaries

### Warehouse Detail Module
- Purpose: Authenticated editing of warehouse layouts
- Store: `warehouseDetailStore`
- Types: `/types/warehouseDetail/`
- Dependencies: Can import from shared services and utils

### Warehouse View Module
- Purpose: Public read-only display
- Store: `warehouseViewStore`
- Types: `/types/warehouseView/`
- Dependencies: Minimal, only what's needed for display

## 6. Best Practices

### Imports
- Only import what you use
- Prefer named imports over default imports
- Use type imports for TypeScript types: `import type { ... }`

### State Management
- Each page/module has its own store
- Stores should be self-contained
- Clean up state on unmount with `reset()` method

### Type Safety
- Always define return types for functions
- Use proper type assertions when necessary
- Avoid `any` type

### Code Organization
- Keep related code together (by feature/module)
- Shared code goes in appropriate shared folders
- Page-specific code stays in page folders

## 7. Module Naming Convention

### Page Organization by Role
Pages are organized under role directories, but module naming follows functionality:

```
/pages/[role]/[moduleName]/
```

Examples:
- `/pages/admin/warehouseDetail/` → Module: warehouseDetail
- `/pages/admin/warehouseView/` → Module: warehouseView  
- `/pages/krani/antreanTruck/` → Module: antreanTruck

### Store and Types Naming
Store and types use the module name, NOT the role name:

```
/store/[moduleName]Store.ts
/types/[moduleName]/
```

Examples:
- `/store/antreanTruckStore.ts` (NOT kraniStore.ts)
- `/types/antreanTruck/` (NOT /types/krani/)

### URL Routing
URLs should NOT include role names:

```typescript
// ✅ Good
static get antreanTruck() {
  return `/antrean-truck` as const;
}

// ❌ Bad
static get antreanTruck() {
  return `/krani/antrean-truck` as const;
}
```

### Import Examples
```typescript
// Importing from antreanTruck module (under krani role)
import { AntreanTruckPage } from '@/pages/krani/antreanTruck';
import { useAntreanTruckStore } from '@/store/antreanTruckStore';
import type { IAntreanCard } from '@/types/antreanTruck';
```