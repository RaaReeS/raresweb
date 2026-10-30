# Portfolio · Rares Stanescu

Portfolio personal de **Rares Stanescu** — desarrollador web junior (2º DAW, CPIFP Los Enlaces, Zaragoza).
Estética de "mundo desarrollador": terminal, editor de código y Git — sin frameworks y sin paso de compilación.

- **Stack:** HTML5 semántico · CSS3 · JavaScript (ES modules)
- **Librerías por CDN (versión fijada + `defer`):** GSAP 3.13.0 (+ ScrollTrigger) y Lenis 1.3.11
- **Todo lo demás es artesanía propia:** partículas (canvas), tilt 3D, spotlight con `radial-gradient`,
  efecto de escritura, tokenizado del editor, paleta de comandos, cursor personalizado.
- **Demo:** https://raresweb.com

---

## 🚀 Ejecutar en local

Al usar ES modules hace falta un servidor estático (**no funciona con doble clic / `file://`**):

```bash
# Opción A · servidor de Node (recomendada)
npx serve .
# o puerto fijo:
npx serve -l 3000 .

# Opción B · Python
python -m http.server 3000

# Opción C · VS Code
# extension "Live Server" → clic derecho en index.html → "Open with Live Server"
```

Y abre http://localhost:3000.

### 📱 Comprobar el responsive en desarrollo

```bash
npm run serve        # sirve en http://localhost:8777 (otra terminal)
npm run check:mobile # captura las 8 secciones a 390px (iPhone 12/13)
                     # y detecta overflow horizontal con Edge headless
```

Las capturas se guardan en `Desktop/shots/sec-*.png`. El script usa
`playwright-core` con el Microsoft Edge ya instalado (no descarga nada).

### 🖱️ Comprobar el modal de proyectos (cursor + scroll)

```bash
npm run check:modal
```

Verifica automáticamente que al abrir un proyecto: se bloquea el scroll del
fondo (Lenis pausado), vuelve el cursor nativo sobre el modal y todo se
reanuda al cerrar.

### 📄 Vista previa del CV (sin descarga)

El CV se lee **dentro de la propia web**, en dos sitios:

- **Apartado "07 · CV"** — visor `<object`> con el PDF embebido a tamaño de
  hoja + botones "Ver CV", "Descargar" y "Abrir en pestaña nueva".
- **Botón "CV" del nav (escritorio) / "Ver CV" del menú móvil** — abre un
  modal con la misma vista previa, con descarga y apertura, todo desde ahí.
- **iOS Safari** no incrusta PDFs en `<object`>: se detecta automáticamente
  y se muestra una tarjeta con "Abrir el PDF" / "Descargar".

Se puede probar con:

```bash
npm run serve
node scripts/test-cv.js   # QA del modal y del visor (desktop + móvil + iOS)
```

### 🛠️ Solución de problemas

| Síntoma | Causa | Solución |
|---|---|---|
| El preloader se queda en "resolving modules…" | Módulos ES bloqueados por `file://` | Sirve la carpeta (`npx serve .` o Live Server). La web se auto-libera en ~3 s y la consola explica el motivo |
| Igual, con servidor | El server sirve `.js` como `text/plain` | Usa `npx serve`, Live Server o un hosting correcto (Vercel/GitHub Pages lo hacen bien) |
| No hay animaciones | Sin conexión → CDN de GSAP/Lenis caída | La web funciona igual (todo estático). Con conexión vuelve todo |
| El CV descarga 404 | Falta `assets/cv.pdf` | Coloca tu PDF (ver sección del CV) |

## ✉️ Configurar Resend (contacto)

El formulario **no** habla directamente con Resend: la API key (`re_…`) es secreta y no puede ir en
código del navegador. El envío pasa por una *serverless function* que ya está incluida:

```
formulario → POST /api/contact → función serverless → https://api.resend.com/emails
```

### Pasos

1. Crea una cuenta gratis en [resend.com](https://resend.com) y genera una **API Key**.

2. Añade la variable de entorno `RESEND_API_KEY` en tu hosting:

   - **Vercel**: *Settings → Environment Variables* (la función `api/contact.js` ya está lista).
   - **Netlify**: *Site configuration → Environment variables* (usa `netlify/functions/contact.mjs`).
   - Opcional: `RESEND_FROM` (`no-reply@tu-dominio`, requiere verificar el dominio en Resend) y
     `RESEND_TO` (si no quieres usar el email de `data/projects.js`).

3. Ajusta la constante única del endpoint si tu hosting no es Vercel:

   ```js
   // js/modules/contact.js · línea superior
   export const CONTACT_ENDPOINT = '/api/contact'; // Vercel
   // export const CONTACT_ENDPOINT = '/.netlify/functions/contact'; // Netlify
   // export const CONTACT_ENDPOINT = '';                            // modo local
   ```

4. Despliega y prueba (los 3 000 emails/mes del plan gratuito dan margen de sobra).

### Probar en local

Con `npx serve .` no hay función serverless: el envío muestra el **fallback mailto** (correcto).
Para probar el envío real:

```bash
npm i -g vercel
RESEND_API_KEY=re_xxxxxxxx vercel dev
```

> Mientras `CONTACT_ENDPOINT` esté vacío, el formulario funciona en **modo local**: valida los
> campos y abre el cliente de correo con un `mailto:` pre-rellenado. Ese mailto también aparece
> si el endpoint falla o se despliega sin `RESEND_API_KEY`.

### Detalles del backend incluido

- `api/_lib/sendContact.js` — lógica compartida: validación en servidor, honeypot, plantilla del email y llamada a Resend.
- `api/contact.js` — adapter Vercel (`export default handler`).
- `netlify/functions/contact.mjs` — adapter Netlify (WebAPI `Request → Response`).
- El servidor **no** reenvía spam: reponde éxito silencioso si el honeypot llega relleno.

## 🖼️ Añadir capturas de proyectos

1. Guarda las capturas en `assets/img/` (p. ej. `premiumtrade.jpg`, `cineverse.jpg`, ancho ≥ 800 px).
2. En `data/projects.js`, cambia el campo `image` del proyecto:

   ```js
   image: 'assets/img/premiumtrade.jpg',
   ```

3. No necesitas tocar nada más: la tarjeta detecta la imagen y la muestra con `loading="lazy"`.

Si `image` es `null`, se usa el **placeholder elegante** con gradiente CSS + monograma (tal como está ahora).

## 📄 Añadir el CV

1. Coloca tu PDF en `assets/cv.pdf`.
2. Listo: los enlaces `Descargar CV` apuntan a esa ruta (evaluables en `data/projects.js → SITE.CV_PATH`).

## 🌍 Idiomas

- Por defecto: **español**; conmutación ES/EN en el nav y en la paleta (`Ctrl/Cmd+K`).
- Todos los literales viven en `data/translations.js`.
- El idioma se guarda en `localStorage` y el `<html lang>` se actualiza al vuelo.

## ☁️ Desplegar

### Vercel

1. Sube el repo a GitHub.
2. En [vercel.com](https://vercel.com) → *Add New → Project* → selecciona el repo.
3. Framework preset: **Other**. Build command y output directory: **(vacíos)**.
4. Dominio: *Settings → Domains* → `raresweb.com` (+ `www`, redirect a apex). En tu registrador:
   `A` → `76.76.21.21` y/o `CNAME www` → `cname.vercel-dns.com`.

### GitHub Pages

1. Repo → *Settings → Pages → Deploy from branch* → `main / (root)`.
2. Dominio: crea `CNAME` (archivo en la raíz, contenido `raresweb.com`) y en el DNS:
   `CNAME` del `www` (o registros `A` del apex: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`).
3. Marca *Enforce HTTPS*.

> `404.html`, `sitemap.xml` y `robots.txt` están en la raíz: se sirven tal cual en ambos hosts.

## 🗂️ Estructura

```
├─ index.html
├─ 404.html
├─ css/
│  └─ styles.css
├─ js/
│  ├─ main.js
│  └─ modules/
│     ├─ theme.js            # tema oscuro/claro + persistencia
│     ├─ i18n.js             # ES/EN (data-i18n) + t()
│     ├─ animations.js       # Lenis, preloader, partículas, reveals GSAP
│     ├─ cursor.js           # cursor dot + anillo (desktop)
│     ├─ terminal.js         # terminal mecanografiado + pestañas del editor
│     ├─ projects.js         # tarjetas + modal + tilt + spotlight
│     ├─ github.js           # API de GitHub + caché + fallback local
│     ├─ commandPalette.js   # Ctrl/Cmd K
│     ├─ contact.js          # Endpoint Resend + validación + toasts
│     ├─ navbar.js           # nav, menú móvil, spy, progreso
│     └─ easterEggs.js       # console.log ASCII + Konami
├─ data/
│  ├─ projects.js            # proyectos + SITE (email, URLs, CV)
│  └─ translations.js        # textos ES/EN
├─ assets/
│  ├─ img/ (favicon.svg, og.svg, tus capturas…)
│  └─ cv.pdf                 # ← añade aquí tu CV
├─ sitemap.xml · robots.txt · README.md
```

## ♿ Accesibilidad y rendimiento (resumen)

- Enlace *saltar al contenido*, foco visible, `aria` en modales (**foco atrapado, Esc**), pestañas ARIA,
  barra de progreso decorativa (`aria-hidden`), contraste AA en ambos temas.
- Scripts con `defer`, fuentes con `preconnect` + `display=swap`, imágenes `lazy` con dimensiones,
  animaciones sin layout shift (transform/opacity), partículas pausadas fuera de pantalla.
- **`prefers-reduced-motion`:** equivalencias estáticas (sin cursor personalizado, sin tilt, barras a su nivel final).

## 🧪 Checklist de pruebas

- [ ] Responsive: 360 / 768 / 1024 / 1280 / 1920 px (menú móvil ≤920 px)
- [ ] Teclado: tab por todo, modal con Esc + foco atrapado, pestañas con ←→, paleta con flechas/Enter/Esc
- [ ] Tema: toggle, persistente, transición suave, `prefers-color-scheme` la primera vez
- [ ] Idioma: ES/EN completo, `lang` del HTML, textos dinámicos (terminal, idiomas, formularios)
- [ ] Formulario: validación en vivo, enviado con Resend real (o modo local mailto), error y éxito visibles
- [ ] GitHub: repos en vivo (también offline → caché / fallback), nota y reintentar
- [ ] Paleta: `Ctrl/Cmd+K`, botón visible, acciones (ir a…, tema, idioma, email, CV, redes)
- [ ] Lighthouse ≥ 90 en Performance / Accessibility / Best Practices / SEO (localhost, no VPN/prerender)
