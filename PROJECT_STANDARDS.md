# Project Standards Guide

**Author:** Hafidh Ahmad Fauzan  
**GitHub:** [https://github.com/hafidh2001](https://github.com/hafidh2001)

## Overview
This document outlines the coding standards, architectural decisions, and best practices for the CP-Antrean-Truck project. Following these standards ensures consistency, maintainability, and scalability across the codebase.

## Project Description
CP-Antrean-Truck is a mobile-first React application for warehouse staff to manage truck queues and production codes.

### Tech Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Zustand** for state management
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication

### Key Features
- Truck queue management
- Production code tracking per truck
- Production code entry with jebolan management
- Gate assignment for trucks
- Real-time updates with optimistic UI
- Mobile-first responsive design

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Folder Usage Guidelines](#2-folder-usage-guidelines)
3. [Import Standards](#3-import-standards)
4. [Type Declaration Standards](#4-type-declaration-standards)
5. [Naming Conventions](#5-naming-conventions)
6. [Module Boundaries](#6-module-boundaries)
7. [Best Practices](#7-best-practices)
8. [Module Naming Convention](#8-module-naming-convention)
9. [Data Flow and localStorage Management](#9-data-flow-and-localstorage-management)
10. [Authentication & Encryption](#10-authentication--encryption)
11. [API Integration Standards](#11-api-integration-and-loading-state-standards)
12. [Environment Configuration](#12-environment-configuration)
13. [Common Pitfalls to Avoid](#13-common-pitfalls-to-avoid)

## 1. Project Structure

```
src/
├── pages/              # React page components
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── services/           # API communication layer
├── functions/          # Business logic & helpers
├── utils/              # Pure utility functions
├── hooks/              # Custom React hooks
├── constants/          # App constants
└── components/         # Reusable UI components
```

### Key Principles:
- **Modular Organization**: Group related files by feature/module
- **Clear Separation**: Business logic in `/functions`, utilities in `/utils`
- **Type Safety**: All modules have corresponding type definitions in `/types`
- **Single Responsibility**: Each file has one clear purpose

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
- `/pages/kerani/antreanTruck/` → Module: antreanTruck

### Store and Types Naming
Store and types use the module name, NOT the role name:

```
/store/[moduleName]Store.ts
/types/[moduleName]/
```

Examples:
- `/store/antreanTruckStore.ts` (NOT keraniStore.ts)
- `/types/antreanTruck/` (NOT /types/kerani/)

### URL Routing
URLs should NOT include role names:

```typescript
// ✅ Good
static get antreanTruck() {
  return `/antrean-truck` as const;
}

// ❌ Bad
static get antreanTruck() {
  return `/kerani/antrean-truck` as const;
}
```

### Import Examples
```typescript
// Importing from antreanTruck module (under kerani role)
import { AntreanTruckPage } from '@/pages/kerani/antreanTruck';
import { useAntreanTruckStore } from '@/store/antreanTruckStore';
import type { IAntreanCard } from '@/types/antreanTruck';
```

## 8. Data Flow and localStorage Management

### Mock Data Structure
All mock data is centralized in `/data/kerani-mock-data.json` containing:
- `antreanTruck`: List of trucks in queue
- `productionCodes`: Production codes by nopol (license plate)

### localStorage Keys Convention
```
antrean-truck-data              # List of trucks in queue
production-codes-{nopol}        # Production codes for specific truck
production-code-entry-{nopol}-{id}  # Entry data for specific production code
```

### Data Flow
1. **Initial Load**: Mock data is loaded into localStorage if not present
2. **AntreanTruck Page**: Reads from `antrean-truck-data`
3. **ProductionCode Page**: Reads from `production-codes-{nopol}`
4. **ProductionCodeEntry Page**: 
   - Reads production code data from `production-codes-{nopol}`
   - Saves entry data to `production-code-entry-{nopol}-{id}`
   - Updates completed_entries in parent data

### Store Responsibilities
- **antreanTruckStore**: Manages truck queue list
- **productionCodeStore**: Manages production codes for a specific truck
- Both stores handle localStorage initialization and persistence

### Best Practices for localStorage
- Always initialize with mock data if localStorage is empty
- Use consistent key naming convention
- Update parent data when child data changes
- Clear data appropriately on logout/reset

## 9. Authentication & Session Management

### Encrypted Token Handling
All authenticated pages receive an encrypted token via URL query parameter:
```
/page-name?key={encrypted_token}
```

### Frontend Implementation
```typescript
// Decrypt token from URL
import { decryptAES } from '@/functions/decrypt';
import { sessionService } from '@/services/sessionService';

const encryptedData = searchParams.get('key');
if (!encryptedData) {
  navigate(ROUTES.base);
  return;
}

// Decrypt and store in session
const decrypted = await decryptAES(encryptedData);
await sessionService.setSession({
  user_token: decrypted.user_token,
  warehouse_id: decrypted.warehouse_id
});
```

### Session Management Pattern
```typescript
// Store encrypted token for navigation
sessionStorage.setItem('encrypted_token', encryptedData);

// Retrieve for page navigation
const token = sessionStorage.getItem('encrypted_token');
navigate(`${ROUTES.nextPage}?key=${encodeURIComponent(token)}`);

// Clear on logout
sessionStorage.clear();
```

### Security Best Practices
- Never store decrypted tokens in localStorage or cookies
- Use sessionStorage for temporary session data
- Always validate token presence before API calls
- Clear session data on logout or page unload
- URL encode tokens when passing in navigation

## 10. API Integration and Loading State Standards

### Store State Management
All stores that perform API calls must include these standard states:
```typescript
interface StandardApiStore {
  isLoading: boolean;      // Always start with true for pages with API calls
  error: string | null;    // Error message if API fails
  hasInitialized: boolean; // Prevents double fetching
}
```

### Page Component Pattern
Pages using API calls must follow this pattern to prevent double fetching and loading race conditions:

```typescript
export function SomePage() {
  const { data, isLoading, error, hasInitialized, loadDataFromApi, reset } = useStore();

  useEffect(() => {
    const loadData = async () => {
      if (!hasInitialized) {
        // Get encrypted data from URL query params
        const searchParams = new URLSearchParams(location.search);
        const encryptedData = searchParams.get('key');
        
        if (!encryptedData) {
          navigate(ROUTES.base);
          return;
        }
        
        await loadDataFromApi(encryptedData);
      }
    };
    
    loadData();
  }, [hasInitialized, location.search, navigate]); // ❌ Do NOT include API functions in dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => reset();
  }, [reset]);

  // Early returns for loading and error states
  if (isLoading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return <MainComponent data={data} />;
}
```

### Simple Rules for API Integration:
1. **Simple guard**: Only check `hasInitialized` in store function
2. **Empty dependency array**: Use `[]` in useEffect, no other dependencies  
3. **Early returns**: Use if/return pattern in page components
4. **Cleanup**: Call `reset()` on unmount

### Import Management Rules:
1. **Only import what you use**: Remove any unused imports immediately
2. **No unused hooks**: Don't import `useRef`, `useState`, etc. if not actually used
3. **Clean imports after refactoring**: When changing patterns (e.g., ref → store state), remove old imports
4. **TypeScript warnings**: Always fix "declared but never read" warnings
5. **Import ordering**: Follow the established import order pattern

### Store Implementation Pattern:
```typescript
export const useModuleStore = create<ModuleStore>((set, get) => ({
  data: [],
  isLoading: false,
  error: null,
  hasInitialized: false,

  loadDataFromApi: async (encryptedData: string) => {
    if (get().hasInitialized) return;

    set({ isLoading: true, error: null });
    
    try {
      const decrypted = await decryptAES<DecryptData>(encryptedData);
      const data = await api.getData(decrypted.user_token);
      
      set({ 
        data, 
        isLoading: false,
        hasInitialized: true
      });
    } catch (error) {
      set({
        data: [],
        isLoading: false,
        error: error.message,
        hasInitialized: true
      });
    }
  },

  reset: () => set({
    data: [],
    isLoading: false,
    error: null,
    hasInitialized: false
  })
}));

## 12. Environment Configuration

### Required Environment Variables
All environment variables must be prefixed with `VITE_` to be accessible in the frontend:

```bash
# .env file structure
# Decrypt Configuration
VITE_DECRYPT_SECRET_KEY=your_secret_key_here

# API Configuration
VITE_API_URL=https://your-api-domain.com/cp_fifo/index.php?r=Api
VITE_API_TOKEN=your_api_token_here
```

### Environment Files
- `.env` - Local development environment (never commit)
- `.env.example` - Example configuration (commit this)
- `.env.production` - Production environment (managed by DevOps)

### TypeScript Support
Environment variables are typed in `/src/env.d.ts`:
```typescript
interface ImportMetaEnv {
  readonly VITE_DECRYPT_SECRET_KEY: string
  readonly VITE_API_URL: string
  readonly VITE_API_TOKEN: string
}
```

### Usage in Code
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
const apiToken = import.meta.env.VITE_API_TOKEN;
```

## 13. Common Pitfalls to Avoid

### ❌ DON'T: Hardcode sensitive data
```typescript
// Bad
const API_TOKEN = 'dctfvgybefvgyabdfhwuvjlnsd';
```

### ✅ DO: Use environment variables
```typescript
// Good
const API_TOKEN = import.meta.env.VITE_API_TOKEN;
```

### ❌ DON'T: Create standalone type files
```typescript
// Bad: /src/types/antrean.ts
export interface IAntrean { ... }
```

### ✅ DO: Organize types by module
```typescript
// Good: /src/types/antreanTruck/index.ts
export interface IAntrean { ... }
```

### ❌ DON'T: Mix business logic in utils
```typescript
// Bad: /src/utils/calculatePrice.ts
export function calculateWarehousePrice() { ... }
```

### ✅ DO: Put business logic in functions folder
```typescript
// Good: /src/functions/warehouseCalculations.ts
export function calculateWarehousePrice() { ... }
```

### ❌ DON'T: Use any type
```typescript
// Bad
const handleData = (data: any) => { ... }
```

### ✅ DO: Define proper types
```typescript
// Good
const handleData = (data: IWarehouseData) => { ... }
```

### ❌ DON'T: Forget cleanup in components
```typescript
// Bad
useEffect(() => {
  loadData();
}, []);
```

### ✅ DO: Clean up on unmount
```typescript
// Good
useEffect(() => {
  return () => store.reset();
}, []);
```

## Important Notes

### API Response Handling
1. **Always handle double-encoded JSON**: Some API responses may be double-encoded
2. **Check for error property**: API errors are returned as `{ error: "message" }`
3. **Transform data at the service layer**: Keep components clean

### State Management Rules
1. **One store per module**: Don't share stores between unrelated features
2. **Reset on unmount**: Always clean up store state when leaving a page
3. **Use hasInitialized pattern**: Prevent double API calls in React StrictMode

### Security Best Practices
1. **Never commit .env files**: Only .env.example should be in version control
2. **Validate decrypted data**: Always validate structure after decryption
3. **Use HTTPS**: All API calls must use secure connections

### Performance Guidelines
1. **Lazy load pages**: Use React.lazy for route components
2. **Batch API calls**: Use Promise.all for parallel requests
3. **Implement proper loading states**: Show skeleton screens during data fetch

### UI/UX Standards

#### State Management Patterns
```typescript
// ✅ Optimistic Updates
const handleUpdate = async (data) => {
  // Update UI immediately
  setLocalState(data);
  
  try {
    await api.update(data);
  } catch (error) {
    // Rollback on error
    setLocalState(previousData);
    showToast('Update failed', 'error');
  }
};

// ✅ Loading States
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
return <Content data={data} />;
```

#### Mobile-First Design
```typescript
// ✅ Responsive Container
<div className="max-w-md mx-auto h-screen">
  {/* Mobile-optimized content */}
</div>

// ✅ Touch-Friendly Buttons
<button className="min-h-[44px] px-4 py-2">
  Click Me
</button>
```

#### Toast Notifications
```typescript
// ✅ Toast Implementation
import { showToast } from '@/utils/toast';

// Success notification
showToast('Operation successful', 'success');

// Error notification
showToast('Something went wrong', 'error');

// Custom duration
showToast('Processing...', 'success', { duration: 5000 });
```

### Code Quality Checklist
- [ ] Follows project structure standards
- [ ] TypeScript types properly defined
- [ ] No hardcoded values (use constants/env vars)
- [ ] Proper error handling implemented
- [ ] Loading states for async operations
- [ ] Mobile responsive design
- [ ] No console.log statements
- [ ] Imports are organized and used
- [ ] Components follow naming conventions
- [ ] Store includes reset method

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Build passes without warnings
- [ ] All console.logs removed
- [ ] API endpoints point to production
- [ ] Error handling implemented
- [ ] Loading states working
- [ ] Mobile responsive
- [ ] Performance optimized