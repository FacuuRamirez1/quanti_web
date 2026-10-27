# Guía de Estilos y Especificaciones UI — Quanti Web

Este documento define la guía del sistema de diseño, la configuración de Tailwind CSS y las reglas visuales extraídas del diseño de Figma de **Quanti**.

---

## 1. Configuración de Tailwind CSS (`tailwind.config.ts`)

Añade los tokens de color, sombras y tipografías personalizadas a la configuración de Tailwind:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        quanti: {
          green: {
            DEFAULT: '#689F38',
            hover: '#558B2F',
            light: '#8BC34A',
            ultraLight: '#F1F8E9',
          },
          dark: {
            DEFAULT: '#0A0A0A',
            overlay: 'rgba(0, 0, 0, 0.45)',
            surface: '#121212',
          },
          gray: {
            bg: '#E5E7EB',
            card: 'rgba(255, 255, 255, 0.18)',
            border: '#D1D5DB',
            subtext: '#6B7280',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        handwriting: ['"Caveat"', '"Pacifico"', 'cursive'], // Para el logo/destacados si aplica
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 2. Tipografía y Jerarquía de Texto

| Rol | Clase Tailwind / Estilos | Peso | Color por Defecto |
| :--- | :--- | :--- | :--- |
| **Título Hero Principal** | `text-3xl md:text-5xl lg:text-6xl tracking-tight` | `font-bold` | `#FFFFFF` |
| **Palabra Clave Destacada** | `text-quanti-green` | `font-bold` | `#689F38` |
| **Subtítulo Hero** | `text-sm md:text-lg leading-relaxed` | `font-medium` | `#FFFFFF` / opacity 90% |
| **Títulos de Sección** | `text-2xl md:text-3xl tracking-wide` | `font-bold` | `#1F2937` |
| **Subtítulos / Items** | `text-base md:text-lg` | `font-semibold` | `#FFFFFF` o `#1F2937` |
| **Cuerpo de Texto** | `text-xs md:text-sm leading-relaxed` | `font-normal` | `#D1D5DB` o `#4B5563` |
| **Labels / Placeholders** | `text-xs md:text-sm` | `font-medium` | `#9CA3AF` |

---

## 3. Especificación Visual por Sección

### A. Hero Section (Fondo Completo)
- **Imagen de fondo**: `/Quanti-4.webp` con `object-cover object-top`.
- **Capa de superposición (Overlay)**: `bg-black/45` o `bg-quanti-dark-overlay` para alto contraste de lectura.
- **Logotipo Principal**: Centrado superior (`public/logo_quanti.svg` o `public/logo_quanti.webp`), ancho relativo `w-44 md:w-60`.

#### Grilla de 4 Beneficios / Pilares
- **Layout**: 4 columnas horizontales en desktop (`grid grid-cols-2 md:grid-cols-4`).
- **Separadores**: Línea vertical divisoria entre columnas (`border-r border-white/20 last:border-r-0`).
- **Alineación**: Texto centrado.
- **Texto Título**: `text-white font-bold text-sm md:text-base`.
- **Texto Descripción**: `text-white/80 font-normal text-xs leading-snug`.

#### Tarjeta de Formulario Glassmorphism
- **Contenedor**:
  ```tsx
  className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 shadow-glass max-w-2xl mx-auto"
  ```
- **Inputs**:
  ```tsx
  className="w-full bg-white/90 text-gray-800 placeholder-gray-500 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quanti-green"
  ```
- **Botón Notificarme**:
  ```tsx
  className="w-full md:w-auto bg-quanti-green hover:bg-quanti-green-hover text-white font-semibold rounded-full px-8 py-2.5 text-sm transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
  ```

---

### B. Sección "Sobre Nosotros"
- **Fondo de sección**: `bg-quanti-gray-bg` (`#E5E7EB`).
- **Layout**: 2 columnas de igual ancho (`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center`).
- **Divisor Central**: Borde vertical continuo en desktop (`border-r border-gray-300`).

#### Columna Izquierda (Información y Redes Sociales)
- **Título**:
  - HTML/JSX: `<h2 className="text-2xl md:text-3xl font-bold text-gray-900">Sobre <span className="text-quanti-green">Nosotros</span></h2>`
  - Decoración: Línea horizontal verde corta inferior (`h-1 w-12 bg-quanti-green mt-2 rounded-full`).
- **Textos de Párrafos**: `text-gray-700 text-sm md:text-base leading-relaxed mb-4`.
- **Botones de Redes Sociales**:
  - Flexbox alineado horizontalmente: `flex items-center gap-4 mt-6`.
  - Estilo de botón/ícono: `flex items-center gap-2 text-gray-800 hover:text-quanti-green transition-colors font-medium text-sm`.
  - Íconos circulares con contorno verde.

#### Columna Derecha (Imagen de Invernadero)
- **Imagen**: `/Quanti-9.webp`.
- **Estilos**: `rounded-2xl shadow-lg object-cover w-full h-[300px] md:h-[400px]`.

---

### C. Footer (Pie de Página)
- **Fondo**: `bg-quanti-dark` (`#0A0A0A`).
- **Padding**: `py-6 px-4`.
- **Texto**: `text-center text-xs md:text-sm text-gray-400`.
- **Estructura**:
  ```html
  <p>© 2026 Quanti. Todos los derechos reservados. - <a href="/admin" className="hover:text-gray-200 transition-colors">Admin</a></p>
  ```

---

## 4. Reglas de Interacción y Accesibilidad

1. **Focus States**: Todo control interactivo (`input`, `button`, `a`) debe incluir anillos de foco visibles (`focus-visible:ring-2 focus-visible:ring-quanti-green`).
2. **Transiciones**:
   - `transition-all duration-200 ease-in-out` en botones, enlaces e inputs.
3. **Imágenes**:
   - `Quanti-4.webp`: Aplicar `object-top` para asegurar la visibilidad superior del cultivo/invernadero.
   - `Quanti-9.webp`: Mantener la proporción y esquinas redondeadas ajustadas a la columna.