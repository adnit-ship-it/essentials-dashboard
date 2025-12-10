# Components Directory Structure

This directory follows a scalable component organization pattern that separates concerns and makes the codebase easier to maintain and scale.

## Directory Structure

```
components/
├── index.ts                 # Main export file for all components
├── layout/                  # Layout-related components
│   ├── index.ts
│   ├── dashboard-layout.tsx
│   └── sidebar.tsx
├── features/                # Feature-specific components
│   ├── organization/        # Organization management features
│   │   ├── index.ts
│   │   ├── organization-modal.tsx
│   │   └── organization-dropdown.tsx
│   └── auth/               # Authentication features
│       ├── index.ts
│       └── auth-wrapper.tsx
├── pages/                  # Page-level components (dashboard sections)
│   ├── index.ts
│   └── sections/
│       ├── brand-design-section.tsx
│       ├── content-management-section.tsx
│       ├── forms-section.tsx
│       ├── images-assets-section.tsx
│       └── reviews-section.tsx
└── ui/                     # Reusable UI components
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── scroll-area.tsx
    ├── select.tsx
    ├── switch.tsx
    └── textarea.tsx
```

## Organization Principles

### 1. **Layout Components** (`/layout`)
- Components that define the overall structure and layout of the application
- Examples: `DashboardLayout`, `Sidebar`
- These are high-level structural components

### 2. **Feature Components** (`/features`)
- Components grouped by business domain/feature
- Each feature has its own subdirectory
- Examples: Organization management, Authentication
- These components are specific to particular business logic

### 3. **Page Components** (`/pages`)
- Components that represent entire pages or major sections
- Often composed of multiple feature components
- Examples: Dashboard sections, page-specific layouts

### 4. **UI Components** (`/ui`)
- Reusable, generic UI components
- Should be framework-agnostic and highly reusable
- Examples: Buttons, inputs, cards, modals

## Import Patterns

### Recommended Import Style
```typescript
// Import from specific feature/layout
import { DashboardLayout } from "@/components/layout"
import { OrganizationModal } from "@/components/features/organization"

// Or import from main index (for convenience)
import { DashboardLayout, OrganizationModal } from "@/components"
```

### Benefits of This Structure

1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Clear separation of concerns
3. **Discoverability**: Developers know where to find components
4. **Reusability**: UI components are clearly separated from business logic
5. **Team Collaboration**: Different teams can work on different features
6. **Testing**: Easier to write focused tests for each layer

## Adding New Components

### For a new feature:
1. Create a new directory under `/features/[feature-name]/`
2. Add an `index.ts` file for exports
3. Update the main `/components/index.ts` to export the new feature

### For a new UI component:
1. Add the component to `/ui/`
2. Update `/ui/index.ts` if needed
3. The main index will automatically pick it up

### For a new layout component:
1. Add to `/layout/`
2. Update `/layout/index.ts`
3. Update main index if needed