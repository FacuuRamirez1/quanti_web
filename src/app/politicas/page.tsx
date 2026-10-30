/**
 * Política de Privacidad versionada — C-04 landing-captura-politicas.
 *
 * RSC estática. El texto es el v1.0 APROBADO por el usuario (fuente:
 * `legal/politica-de-privacidad-v1.0.md`, vigencia 2026-10-15). La versión
 * mostrada se importa de `lib/politicas.ts` (misma constante que persiste
 * `registrarLead`): divergencia imposible por construcción.
 *
 * Maquetación según diseño Figma: fondo de cultivos con velo oscuro, logo
 * centrado (enlace al inicio) y tarjeta blanca con secciones numeradas.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FooterNegro } from "@/components/footer-negro";
import { PoliticaSeccion } from "@/components/politica-seccion";
import { poppins } from "@/lib/fonts";
import {
  POLITICAS_EFFECTIVE_DATE,
  POLITICAS_VERSION,
} from "@/lib/politicas";

export const metadata: Metadata = {
  title: "Política de Privacidad — Quanti",
  description:
    "Política de Privacidad de Quanti Vegetales Hidropónicos: qué datos recolectamos, para qué y cuáles son tus derechos.",
};

// Verde de texto chico oscurecido a #558024 (4.67:1 sobre blanco, AA).
const EMAIL_CONTACTO = "contacto@quantihidroponia.com.ar";

function EmailContacto() {
  return (
    <a
      href={`mailto:${EMAIL_CONTACTO}`}
      className="text-[#558024] underline underline-offset-2 wrap-anywhere transition-opacity duration-200 hover:opacity-80"
    >
      {EMAIL_CONTACTO}
    </a>
  );
}

export default function PoliticasPage() {
  return (
    <div className={`${poppins.className} relative isolate`}>
      {/* Fondo decorativo fijo: cultivos + velo oscuro. */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 bg-black">
        <Image
          src="/bg-politica-privacidad.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <header className="flex justify-center px-4 pt-10 md:pt-14">
        <Link
          href="/"
          aria-label="Quanti — inicio"
          className="transition-opacity duration-200 hover:opacity-80"
        >
          <Image
            src="/quanti-logo.png"
            alt="Logotipo de Quanti — Vegetales Hidropónicos"
            width={1254}
            height={565}
            sizes="(max-width: 768px) 224px, 320px"
            className="h-auto w-56 object-contain md:w-80"
          />
        </Link>
      </header>

      <div className="px-4 pt-8 pb-12 sm:px-6 md:pt-12 md:pb-20 lg:pt-16 lg:pb-24">
        <article
          aria-labelledby="titulo-politicas"
          className="mx-auto w-full max-w-6xl rounded-2xl bg-white px-5 pt-8 shadow-2xl shadow-black/40 sm:px-8 md:px-10 md:pt-10"
        >
          <header className="pb-6 text-center md:pb-10">
            <h1
              id="titulo-politicas"
              className="inline-block border-b-2 border-[#689F38]/50 pb-1 text-[1.75rem] leading-tight font-semibold tracking-tight text-neutral-950 sm:text-3xl lg:text-4xl"
            >
              Política de <span className="text-[#5e8f2a]">Privacidad</span>
            </h1>
            <p className="mt-2 text-sm font-semibold text-neutral-950">
              Quanti Vegetales Hidropónicos
            </p>
            <p className="mt-2 text-xs text-neutral-600 sm:text-sm">
              Versión {POLITICAS_VERSION} · Vigencia desde{" "}
              {POLITICAS_EFFECTIVE_DATE}
            </p>
          </header>

          <PoliticaSeccion numero={1} titulo="Responsable del tratamiento">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                <strong className="font-semibold">Razón social:</strong>{" "}
                <span className="text-[#558024]">
                  QUANTI VEGETALES HIDROPÓNICOS
                </span>
              </li>
              <li>
                <strong className="font-semibold">Domicilio:</strong>{" "}
                <span className="text-[#558024]">
                  Mendoza, República Argentina
                </span>
              </li>
              <li>
                <strong className="font-semibold">
                  Email de contacto para privacidad:
                </strong>{" "}
                <EmailContacto />
              </li>
            </ul>
          </PoliticaSeccion>

          <PoliticaSeccion numero={2} titulo="Datos que recolectamos">
            <div>
              <p>
                A través del formulario de la landing &ldquo;Próximamente&rdquo;
                recolectamos únicamente:
              </p>
              <ul className="mt-1.5 list-disc space-y-1.5 pl-5">
                <li>Nombre y apellido.</li>
                <li>Dirección de correo electrónico.</li>
                <li>
                  Registro de consentimiento: marca de verificación de
                  aceptación, versión de esta política ({POLITICAS_VERSION}) y
                  marca temporal (<span lang="en">consent_at</span>).
                </li>
              </ul>
            </div>
            <p>
              No recolectamos precios, pagos, documentos de identidad ni datos
              sensibles. El sitio no está dirigido a menores de 13 años; si
              detectamos un registro de un menor, lo eliminaremos de forma
              inmediata.
            </p>
          </PoliticaSeccion>

          <PoliticaSeccion numero={3} titulo="Finalidad">
            <div>
              <p>Usamos tus datos exclusivamente para:</p>
              <ol className="mt-1 list-decimal space-y-1 pl-6">
                <li>Avisarte del lanzamiento del sitio definitivo de Quanti.</li>
                <li>
                  Enviarte información institucional sobre nuestros productos y
                  puntos de venta en Mendoza, siempre que mantengas el interés
                  (podés darte de baja en cualquier momento).
                </li>
              </ol>
            </div>
            <p>
              No usamos tus datos para publicidad de terceros ni para toma de
              decisiones automatizadas.
            </p>
          </PoliticaSeccion>

          <PoliticaSeccion numero={4} titulo="Consentimiento">
            <p>
              Al tildar la casilla &ldquo;Acepto la Política de
              Privacidad&rdquo; y pulsar <strong>Notificarme</strong>, prestás
              tu consentimiento libre, expreso e informado en los términos del
              art. 5 de la Ley 25.326 de Protección de Datos Personales. Sin esa
              aceptación el formulario no se procesa. Podés revocar tu
              consentimiento en cualquier momento escribiendo a nuestro correo
              de contacto.
            </p>
          </PoliticaSeccion>

          <PoliticaSeccion numero={5} titulo="Conservación">
            <p>
              Conservamos tus datos mientras dure la etapa de lanzamiento y por
              un plazo máximo de <strong>24 meses</strong> desde tu registro.
              Cumplido el plazo, o ante tu pedido explícito de supresión, los
              eliminaremos de forma definitiva de nuestra base de datos (
              <span lang="en">posibles_clientes</span>). La gestión de datos se
              realiza exclusivamente en nuestro panel interno con acceso
              restringido por roles.
            </p>
          </PoliticaSeccion>

          <PoliticaSeccion numero={6} titulo="Tus derechos (Ley 25.326)">
            <p>
              El titular de los datos personales tiene la facultad de ejercer el
              derecho de acceso a los mismos en forma gratuita a intervalos no
              inferiores a seis meses, salvo que se acredite un interés legítimo
              al efecto conforme lo establecido en el artículo 14, inciso 3 de la
              Ley Nº 25.326.
            </p>
            <p>
              Para ejercer tus derechos de acceso, rectificación, actualización o
              supresión, escribí a <EmailContacto /> indicando tu email
              registrado. Responderemos dentro de los plazos legales (10 días
              hábiles para acceso; 5 días hábiles para rectificación o
              supresión).
            </p>
            <blockquote className="rounded-lg border-2 border-[#689F38]/70 px-3 py-2">
              <strong>La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA</strong>,
              Órgano de Control de la Ley Nº 25.326, tiene la atribución de
              atender las denuncias y reclamos que se interpongan con relación al
              incumplimiento de las normas sobre protección de datos personales.
            </blockquote>
          </PoliticaSeccion>

          <PoliticaSeccion numero={7} titulo="Seguridad">
            <p>
              Protegemos tus datos con medidas técnicas y organizativas de nivel
              de producción: conexiones cifradas mediante HTTPS/TLS, políticas
              de seguridad a nivel de fila (Row Level Security - RLS) en la base
              de datos, validación estricta de esquemas en servidor y mitigación
              de bots.
            </p>
          </PoliticaSeccion>

          <PoliticaSeccion numero={8} titulo="Encargados del tratamiento">
            <p>
              Para operar el sitio recurrimos a proveedores de infraestructura
              que actúan por nuestra cuenta bajo estrictos estándares de
              confidencialidad:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Vercel Inc.</strong>: Alojamiento y despliegue de la
                aplicación web.
              </li>
              <li>
                <strong>Supabase Inc.</strong>: Base de datos relacional y
                gestión de autenticación.
              </li>
              <li>
                <strong>Resend Inc.</strong>: Servicio de envío transaccional de
                correos electrónicos.
              </li>
            </ul>
          </PoliticaSeccion>

          <PoliticaSeccion numero={9} titulo="Cambios de esta política">
            <p>
              Si actualizamos esta política publicaremos la nueva versión en
              esta misma ruta (<code className="font-[inherit]">/politicas</code>). Cada registro queda
              irrevocablemente vinculado a la versión aceptada al momento del
              envío (
              <code className="font-[inherit] wrap-anywhere">
                politicas_version = {POLITICAS_VERSION}
              </code>
              ),
              garantizando que un cambio futuro de texto no modifique
              retroactivamente las condiciones bajo las cuales prestaste tu
              consentimiento.
            </p>
            <p>
              <Link
                href="/"
                className="text-[#558024] underline underline-offset-2 transition-opacity duration-200 hover:opacity-80"
              >
                Volver al formulario
              </Link>
            </p>
          </PoliticaSeccion>
        </article>
      </div>

      <FooterNegro />
    </div>
  );
}
