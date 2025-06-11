# AGENT.md - Development Guidelines

## Commands
- **Dev server**: `npm run dev` 
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Start production**: `npm run start`
- **No test runner configured** - add tests using Jest or similar if needed

## Project Structure
- Next.js 15 app with App Router in `src/app/`
- Components in `src/components/` and `src/app/components/`
- UI components (shadcn/ui) in `src/components/ui/`
- Utilities in `src/lib/`
- Path alias `@/*` maps to `src/*`

## Code Style
- **File naming**: `.jsx` for React components, `.js` for regular JS
- **Component format**: Use default exports for components
- **Client components**: Use `"use client"` directive at top
- **Imports**: Use `@/` alias for internal imports, group imports (React, Next.js, then locals)
- **Styling**: Tailwind CSS with CSS variables, use `cn()` utility from `@/lib/utils`
- **UI components**: Use shadcn/ui pattern with `cva` for variants
- **State management**: React Context pattern (see CartContext)
- **Animation**: Framer Motion for animations
- **Font**: Poppins via next/font/google with CSS variables
