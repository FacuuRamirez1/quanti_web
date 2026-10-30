/**
 * Landing "Próximamente" — spec `design_system_ui_spec.md` + contratos C-04
 * (`openspec/changes/c-04-landing-captura-politicas/`), que PREVALECEN sobre la
 * spec visual donde divergen (checkbox `acepta_politicas` + honeypot + action
 * `registrarLead` intactos; ver divergencias abajo).
 *
 * A. Hero full-bleed: `Quanti-5.webp` `fill` + `object-cover` con
 *    overlay exacto `rgba(0,0,0,.45)`; logo blanco centrado; h1 ÚNICO
 *    "Estamos trabajando en algo increíble" (`increíble` en #689F38);
 *    subtítulo; grilla de 4 pilares con divisores verticales (solo `lg`,
 *    donde es una sola fila); form card glassmorphism
 *    (`rgba(255,255,255,.18)` + `backdrop-blur-md`) con `LeadForm`.
 * B. About `bg #E5E7EB`: 2 columnas con divisor vertical fino; izquierda con
 *    título ("Nosotros" en verde + subrayado corto), 2 párrafos verbatim de la
 *    spec e IG/FB (sin URLs propias en el repo: dominios raíz provisorios);
 *    derecha `Quanti-9.webp` rounded + `object-cover`.
 * C. `FooterNegro`: fondo negro + texto de derechos reservados.
 *
 * Accesibilidad (C-03 3.4 + spec §4): `lang="es"` + skip-link + `main` en el
 * root layout; hovers solo transform/opacity (+ `prefers-reduced-motion` en
 * `globals.css`); semántica `section`/`footer`/`form`; `next/image` con
 * `sizes` reales y alt en español, cero `<img>` crudo (R6). Sin precios (R4),
 * redes solo IG/FB (R7), cero queries cliente (R1).
 */
import Image from "next/image";
import { LeadForm } from "@/components/lead-form";
import { FooterNegro } from "@/components/footer-negro";

const PILARES = [
  {
    titulo: "100% Hidropónicos",
    descripcion: "Cultivamos sin tierra, con agua y nutrientes.",
  },
  {
    titulo: "Más frescos",
    descripcion: "Vegetales siempre frescos, directo del cultivo a tu mesa.",
  },
  {
    titulo: "Sustentables",
    descripcion: "Cuidamos el medio ambiente con procesos responsables.",
  },
  {
    titulo: "Saludables",
    descripcion: "Alimentos naturales, sin pesticidas ni químicos.",
  },
] as const;

function IconoInstagram() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="h-8 w-8"
    >
      <rect x={2.5} y={2.5} width={19} height={19} rx={5.5} />
      <circle cx={12} cy={12} r={4.25} />
      <circle cx={17.4} cy={6.6} r={1.4} fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoFacebook() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
      <path d="M13.5 21.5v-7.2h2.42l.36-2.8H13.5V9.7c0-.81.23-1.36 1.4-1.36h1.5V5.83c-.26-.03-1.15-.11-2.19-.11-2.17 0-3.65 1.32-3.65 3.75v2.03H8.13v2.8h2.43v7.2h2.94Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section
        aria-labelledby="titulo"
        className="relative overflow-hidden bg-black text-white"
      >
        <Image
          src="/Quanti-5.webp"
          alt="Cultivos hidropónicos de hoja verde en invernadero"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgba(0,0,0,0.70)]"
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 md:pb-20 lg:px-8">
          <Image
            src="/quanti-logo.png"
            alt="Logotipo de Quanti — Vegetales Hidropónicos"
            width={1254}
            height={565}
            sizes="(max-width: 640px) 724px, (max-width: 868px) 788px, 620px"
            className="mx-auto mt-7 h-auto w-86 rounded-2xl object-contain sm:w-120 md:w-140"
          />
          <h1
            id="titulo"
            className="mt-8 text-center text-4xl font-bold tracking-tight md:text-6xl"
          >
            Estamos trabajando en algo{" "}
            <span className="text-[#689F38]">increíble</span>
          </h1>
          <p className="mt-4 text-center text-lg text-white/90 md:text-xl">
            Nuestra página web estará disponible muy pronto
            <br />
            ¡Gracias por tu paciencia!
          </p>

          
          <ul className="mx-auto m-30 grid max-w-5xl grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {PILARES.map((pilar) => (
              <li
                key={pilar.titulo}
                className="border-white/25 px-2 py-6 text-center not-first:border-t first:pt-0 last:pb-0 sm:px-6 sm:even:border-l sm:nth-2:border-t-0 sm:nth-2:pt-0 sm:nth-3:pb-0 lg:not-first:border-t-0 lg:py-0 lg:not-first:border-l"
              >
                <p className="text-lg font-semibold">{pilar.titulo}</p>
                <p className="mt-2 text-sm font-light leading-relaxed text-white">
                  {pilar.descripcion}
                </p>
              </li>
            ))}
          </ul>

          <div
            id="aviso"
            className="mx-auto mt-12 max-w-2xl scroll-mt-8 rounded-2xl border border-white/25 bg-[rgba(255,255,255,0.18)] p-6 shadow-2xl backdrop-blur-md sm:p-8"
          >
            <h2
              id="titulo-aviso"
              className="text-center text-lg font-semibold md:text-xl"
            >
              Dejanos tus datos y te avisamos cuando estemos online.
            </h2>
            <div className="mt-6">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="titulo-nosotros"
        className="bg-[#E5E7EB] text-[#1F2937]"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:divide-x md:divide-[#9CA3AF] md:py-24 lg:px-8">
          <div className="md:pr-10">
            <h2
              id="titulo-nosotros"
              className="text-3xl font-bold tracking-tight md:text-4xl"
            >
              Sobre <span className="text-[#689F38]">Nosotros</span>
            </h2>
            <span
              aria-hidden="true"
              className="mt-3 block h-1 w-16 rounded-full bg-[#689F38]"
            />
            <p className="mt-6 text-base leading-relaxed md:text-lg">
              Quanti es una empresa dedicada al cultivo de vegetales hidropónicos
              de alta calidad.
            </p>
            <p className="mt-4 text-base leading-relaxed md:text-lg">
              Utilizamos tecnología y prácticas sustentables para ofrecer
              productos frescos, nutritivos y amigables con el medio ambiente.
            </p>
            <ul aria-label="Redes sociales" className="mt-8 flex flex-wrap gap-4">
              <li>
                {/* Sin handles propios en el repo (divergencia documentada):
                    dominios raíz provisorios hasta que el usuario pase las URLs. */}
                <a
                  href="https://www.instagram.com/quantivegetaleshidroponicos?exln=MWN2Y3c3d2llNXY5cw=="
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram de Quanti"
                  className="inline-flex items-center gap-2.5 rounded-full pr-4 font-medium transition-opacity duration-200 hover:opacity-75"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#689F38] text-white transition-transform duration-200 hover:scale-105">
                    <IconoInstagram />
                  </span>
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/share/19X9FPxCT5/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook de Quanti"
                  className="inline-flex items-center gap-2.5 rounded-full pr-4 font-medium transition-opacity duration-200 hover:opacity-75"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#689F38] text-white transition-transform duration-200 hover:scale-105">
                    <IconoFacebook />
                  </span>
                  Facebook
                </a>
              </li>
            </ul>
          </div>
          <div className="md:pl-10">
            <Image
              src="/Quanti-9.jpeg"
              alt="Interior del invernadero hidropónico de Quanti"
              width={8500}
              height={3542}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-72 w-full rounded-2xl object-cover md:h-full md:min-h-24rem"
            />
          </div>
        </div>
      </section>

      <FooterNegro />
    </>
  );
}
