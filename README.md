# Alon Memorial Site

A Hebrew memorial website honoring Alon Avraham Chai Bivian (אלון אברהם חי בביאן ז"ל), one of 73 soldiers who died in the 1997 Israeli helicopter disaster.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/            # Page components
├── App.tsx           # Main app with routing
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start dev server at `localhost:5173` |
| `npm run build` | Build for production to `./dist/` |
| `npm run preview` | Preview production build locally |

## Features

- RTL Hebrew layout
- Responsive design
- Photo carousels and galleries
- Memorial audio player
- Filterable content (gallery, letters)
- Print-friendly styles
