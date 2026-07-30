# Plan futuro: envío y moderación de testimonios

> Estado: propuesta para consideración futura. Esta funcionalidad no está implementada.

## Objetivo

Permitir que una persona envíe un testimonio desde el sitio usando los campos Name, Title y Testimonial. Cada envío deberá ser revisado antes de aparecer en el carrusel público.

El sitio continuará publicado como una aplicación estática en GitHub Pages. La recepción, moderación y lectura de testimonios nuevos usaría servicios gratuitos de Cloudflare.

## Arquitectura recomendada

- **GitHub Pages:** aloja la aplicación React actual.
- **Cloudflare Worker:** expone una API pequeña para recibir y consultar testimonios.
- **Cloudflare D1:** almacena envíos pendientes, aprobados y rechazados.
- **Cloudflare Turnstile:** reduce spam y envíos automatizados.
- **Cloudflare Dashboard:** sirve como interfaz de moderación inicial, sin construir un panel administrativo propio.

Esta separación permite aprobar un testimonio sin modificar el repositorio ni volver a desplegar GitHub Pages. Una tarjeta aprobada aparecería la próxima vez que se cargue la página.

## Experiencia propuesta

1. Junto al título **Testimonials**, un botón **Share a testimonial** abre un diálogo accesible.
2. El formulario solicita:
   - Name, público y obligatorio.
   - Title, público y obligatorio.
   - Testimonial, público y obligatorio.
   - Email, privado y obligatorio para verificar identidad.
   - Consentimiento explícito para publicar nombre, cargo y testimonio.
3. Después del envío se informa que el contenido está pendiente de revisión.
4. No se añade una tarjeta inmediatamente ni se promete su publicación.
5. Rafael revisa el registro en Cloudflare y lo marca como `approved` o `rejected`.
6. Solo los registros `approved` se incorporan al carrusel público.

## Modelo de datos

La tabla `testimonials` necesitaría como mínimo:

| Campo | Uso |
| --- | --- |
| `id` | Identificador técnico único |
| `name` | Nombre que se publicará |
| `title` | Cargo o relación profesional que se publicará |
| `testimonial` | Texto que se publicará |
| `email` | Verificación privada; nunca se devuelve en la API pública |
| `consent` | Evidencia de consentimiento |
| `status` | `pending`, `approved` o `rejected` |
| `created_at` | Fecha de envío |
| `approved_at` | Fecha de aprobación, si aplica |

La numeración `01`, `02`, etc. debe derivarse de la posición en el carrusel. No debe usarse como identificador de base de datos.

## Contrato de la API

### `POST /testimonials`

Acepta únicamente los campos del formulario, el token de Turnstile y un campo honeypot. El Worker valida tipos, longitudes, email, consentimiento, origen y Turnstile. El servidor asigna siempre `status = pending`; el navegador no puede elegir ni modificar el estado.

### `GET /testimonials`

Devuelve exclusivamente testimonios aprobados y solo estos campos públicos:

- `id`
- `name`
- `title`
- `testimonial`
- `approved_at`

No debe exponer emails, consentimiento ni registros pendientes o rechazados.

## Seguridad y privacidad

- Restringir CORS a `https://onepalo.github.io` y orígenes locales explícitos para desarrollo.
- Verificar Turnstile en el Worker, nunca solo en React.
- Mantener el secret de Turnstile únicamente en Cloudflare Secrets.
- Las variables `VITE_*` y la site key de Turnstile son públicas; nunca deben contener secretos.
- Aplicar límites estrictos de longitud y normalización de texto.
- Mantener moderación obligatoria para evitar spam, suplantación y contenido inapropiado.
- Verificar identidad mediante el email antes de aprobar.
- Definir una política de retención para registros rechazados y emails de registros aprobados.
- No editar el testimonio de una persona sin su autorización.

## Comportamiento del sitio

- Los testimonios existentes permanecen dentro del bundle como contenido base y fallback.
- Al abrir **How I work**, el sitio consulta testimonios aprobados y los combina con los existentes.
- Si Cloudflare no responde, el carrusel continúa funcionando con el contenido estático.
- No se requiere tiempo real ni polling: los nuevos testimonios aparecen al recargar.
- En móvil se conserva el carrusel compacto actual y **Where I connect** continúa oculto.

## Fases de implementación

### 1. Backend

1. Crear el proyecto Worker y la base D1.
2. Añadir una migración versionada para la tabla e índices.
3. Implementar validación, Turnstile, CORS y `POST /testimonials`.
4. Implementar `GET /testimonials` con filtrado de aprobados y campos públicos.
5. Añadir pruebas de contrato y seguridad.

### 2. Integración React

1. Definir un tipo `Testimonial` y mover los testimonios estáticos a la capa de contenido.
2. Crear un cliente para consultar y enviar testimonios.
3. Combinar resultados remotos con el fallback estático.
4. Añadir el botón y el diálogo del formulario.
5. Implementar estados de envío, éxito y error sin insertar tarjetas optimistas.
6. Revisar accesibilidad y comportamiento responsive.

### 3. Operación

1. Documentar consultas de moderación en D1.
2. Definir verificación de identidad, aprobación, rechazo y eliminación.
3. Configurar variables, secrets, despliegue y rollback.
4. Probar el flujo completo desde el dominio publicado.

## Archivos previstos

- `src/components/ExperienceStage/ExperienceStage.tsx`
- `src/components/TestimonialSubmission/TestimonialSubmission.tsx`
- `src/content/content.ts`
- `src/content/contentTypes.ts`
- `src/services/testimonials.ts`
- `src/styles/globals.css`
- `.env.example`
- `cloudflare/testimonials/wrangler.jsonc`
- `cloudflare/testimonials/src/index.ts`
- `cloudflare/testimonials/migrations/0001_create_testimonials.sql`
- `cloudflare/testimonials/test/index.spec.ts`

## Validación requerida

- Un envío válido queda siempre como `pending`.
- Un payload inválido, honeypot activo o Turnstile inválido se rechaza.
- El cliente no puede aprobar su propio registro.
- La API pública nunca expone email ni registros no aprobados.
- Una caída de la API no rompe el carrusel estático.
- La aprobación manual produce una tarjeta después de recargar.
- El diálogo funciona con teclado, Escape, restauración de foco y lector de pantalla.
- Desktop y móvil mantienen el diseño actual, incluido el footer Return/Continue.
- `npm run lint` y `npm run build` pasan antes de publicar.

## Alcance inicial y coste

Para el tráfico esperado, Worker, D1 y Turnstile deberían entrar holgadamente en los planes gratuitos actuales de Cloudflare. Los límites y condiciones deben revisarse antes de comenzar la implementación, porque pueden cambiar.

La primera versión no incluiría:

- Panel administrativo propio.
- Notificaciones por email.
- Login público.
- Edición posterior por el autor.
- Publicación automática sin revisión.
- Migración obligatoria de testimonios existentes a D1.

Complejidad estimada: media, aproximadamente uno o dos días de implementación y validación después de crear y configurar la cuenta de Cloudflare.