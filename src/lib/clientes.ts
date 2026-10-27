/**
 * Lista fija de logos de clientes — C-01 foundation-infra.
 *
 * Contenido estático versionado (decisión `08`): sin CMS en el MVP, la lista
 * vive en git y los archivos en `public/clientes/` (`.webp` optimizados desde
 * C-06; en C-01 un SVG placeholder). Doble placement y carrusel llegan en C-06.
 * Los logos se renderizan con `next/image` + `alt` = nombre del cliente (R6).
 */
export interface Cliente {
  /** Nombre del cliente (se usa como `alt` del logo). */
  nombre: string;
  /** Ruta pública del logo, ej. `/clientes/mi-cliente.webp`. */
  logo: string;
}

export const clientes: Cliente[] = [
  {
    nombre: "Cliente ejemplo",
    logo: "/clientes/placeholder.svg",
  },
];
