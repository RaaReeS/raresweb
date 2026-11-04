# Rares Stanescu — Desarrollador Web

Portfolio personal de **Rares Stanescu**, desarrollador web junior (2º DAW · CPIFP Los Enlaces, Zaragoza).

> 🔗 **Demo en vivo:** [raresweb.com](https://raresweb.com)

[![Demo](https://img.shields.io/badge/demo-raresweb.com-6c5ce7?style=flat-square)](https://raresweb.com)
[![GitHub](https://img.shields.io/badge/github-RaaReeS-181717?style=flat-square&logo=github)](https://github.com/RaaReeS)
[![LinkedIn](https://img.shields.io/badge/linkedin-raarees-0a66c2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/raarees/)

---

## Sobre mí

Desarrollador web en formación, enfocado en construir interfaces sólidas y accesibles con tecnologías estándar de la web. Este portfolio es la muestra de mi forma de trabajar: **HTML5 semántico, CSS3 y JavaScript nativo (ES modules), sin frameworks y sin paso de compilación**. Cada detalle —animaciones, interacciones, tipografía— está implementado a mano.

## Características

- **Estética "mundo desarrollador":** terminal mecanografiada, editor de código con resaltado propio y detalles estilo Git.
- **Animaciones con intención:** GSAP + ScrollTrigger y scroll suave con Lenis (vía CDN, versiones fijadas).
- **Interacciones propias:** partículas en canvas, tilt 3D, spotlight con `radial-gradient`, paleta de comandos (`Ctrl/Cmd+K`) y cursor personalizado.
- **Bilingüe ES/EN:** conmutación en vivo con persistencia en `localStorage`.
- **Tema claro/oscuro** con detección de la preferencia del sistema.
- **Proyectos reales:** tarjetas y fichas detalladas desde `data/projects.js`.
- **CV integrado:** visor embebido en la propia web, con descarga y apertura en pestaña nueva.
- **Formulario de contacto funcional** con envío real vía Resend (función serverless incluida) y *fallback* `mailto:`.

## Stack

| Área | Tecnologías |
|---|---|
| Base | HTML5 semántico · CSS3 · JavaScript (ES modules) |
| Animación | GSAP 3.13 + ScrollTrigger · Lenis 1.3.11 (CDN) |
| Datos | MySQL (proyectos backend) · Java · PHP · Python |
| Herramientas | Git · GitHub · Vercel · Playwright (QA) |

## Accesibilidad y rendimiento

- Navegación completa por teclado: foco visible, modales con foco atrapado y `Esc`, pestañas ARIA.
- Contraste AA en ambos temas y enlace *saltar al contenido*.
- `prefers-reduced-motion` respetado: equivalencias estáticas de todas las animaciones.
- Scripts con `defer`, imágenes `lazy` con dimensiones, animaciones sin *layout shift*.
- **Lighthouse ≥ 90** en Performance, Accessibility, Best Practices y SEO.

## Estructura

```
├─ index.html
├─ css/styles.css
├─ js/
│  ├─ main.js
│  └─ modules/        # tema, i18n, animaciones, proyectos,
│                     # contacto, paleta de comandos…
├─ data/              # proyectos y traducciones ES/EN
├─ assets/            # imágenes y CV
└─ api/               # función serverless del contacto
```

## Contacto

- 📧 `rares.stanescu00@gmail.com`
- 💼 [linkedin.com/in/raarees](https://www.linkedin.com/in/raarees/)
- 💻 [github.com/RaaReeS](https://github.com/RaaReeS)
