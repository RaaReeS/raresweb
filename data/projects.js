/* =========================================================
   data/projects.js
   Datos de los proyectos del portfolio.
   - short / long: descripción corta (tarjeta) y larga (modal).
   - highlights: lista de bullets del modal.
   - image: opcional — si se define, se usa <img loading="lazy">
     en la tarjeta; si es null, se pinta un placeholder con CSS.
   - demo: opcional — si es null, el botón "Demo" no se pinta.
   - hash + snippet: detalle decorativo estilo git/código.
   Añadir un proyecto nuevo = añadir un objeto a este array.
   ========================================================= */

export const SITE = {
  DOMAIN: 'https://raresweb.com',
  EMAIL: 'rares.stanescu00@gmail.com',
  GITHUB_USER: 'RaaReeS',
  GITHUB_URL: 'https://github.com/RaaReeS',
  LINKEDIN_URL: 'https://www.linkedin.com/in/raarees/',
  CV_PATH: 'assets/cv.pdf',
};

export const projects = [
  {
    id: 'safebite',
    title: 'SafeBite',
    monogram: 'SB',
    hash: 'c91e4b7',
    snippet: 'filter: allergens · menu: qr · db: rls',
    tech: ['TypeScript', 'Next.js', 'React Native / Expo', 'Supabase / PostgreSQL', 'pnpm + Turborepo'],
    accent: 'indigo',
    image: null,
    demo: 'https://safebitee.vercel.app',
    repo: 'https://github.com/RaaReeS/SafeBite',
    short: {
      es: 'Plataforma para personas con alergias e intolerancias que quieren comer fuera de casa: cartas con alérgenos por QR, perfiles de familia y escaneo de productos.',
      en: 'Platform for people with allergies and intolerances who want to eat out: allergen menus via QR, family profiles and packaged-product scanning.',
    },
    long: {
      es: 'Proyecto para personas con alergias, intolerancias y dietas específicas que quieren comer fuera de casa con más tranquilidad. Los restaurantes declaran los 14 alérgenos de cada plato (Reglamento (UE) n.º 1169/2011), publican su carta con un código QR y descargan una tabla de alérgenos imprimible; cualquier comensal puede filtrar esa carta por sus alergias sin registrarse. La web y la app móvil permiten guardar el perfil de alergias propio y el de la familia, buscar en el mapa dónde se puede comer y escanear productos envasados con datos de Open Food Facts. Monorepo en TypeScript con pnpm y Turborepo: Next.js para la web, React Native + Expo para la app móvil y Supabase (Postgres con seguridad por filas) como base de datos.',
      en: 'Project for people with allergies, intolerances and specific diets who want to eat out with more peace of mind. Restaurants declare the 14 allergens of each dish (EU Regulation No 1169/2011), publish their menu with a QR code and download a printable allergen table; any diner can filter that menu by their allergies without signing up. The web and mobile app let users save their own and their family\'s allergy profile, search a map for places they can eat at, and scan packaged products using Open Food Facts data. TypeScript monorepo with pnpm and Turborepo: Next.js for the web, React Native + Expo for the mobile app and Supabase (Postgres with row-level security) as the database.',
    },
    highlights: {
      es: [
        'Carta pública por QR, filtrable por alergias y sin registro',
        'Panel para restaurantes: los 14 alérgenos (Reglamento UE 1169/2011) y tabla imprimible',
        'Perfil de alergias personal y familiar en web y app móvil',
        'Búsqueda en mapa de dónde se puede comer',
        'Escaneo de productos envasados con datos de Open Food Facts',
        'Monorepo TypeScript (pnpm + Turborepo) con Next.js, Expo y Supabase',
      ],
      en: [
        'Public QR menu, filterable by allergies and without sign-up',
        'Restaurant panel: the 14 allergens (EU Regulation 1169/2011) and a printable table',
        'Personal and family allergy profile on web and mobile app',
        'Map search for places you can eat at',
        'Packaged-product scanning using Open Food Facts data',
        'TypeScript monorepo (pnpm + Turborepo) with Next.js, Expo and Supabase',
      ],
    },
  },
  {
    id: 'premiumtrade',
    title: 'PremiumTrade',
    monogram: 'PT',
    hash: 'f47ac1f',
    snippet: 'routes: auth · inventory · trades',
    tech: ['Python / Java', 'HTML5', 'CSS3', 'MySQL', 'Git / GitHub'],
    accent: 'indigo',
    image: null,
    demo: null,
    repo: 'https://github.com/RaaReeS/PremiumTrade',
    short: {
      es: 'Sistema de gestión de inventario y compraventas con arquitectura orientada a datos, autenticación de usuarios y registro de operaciones.',
      en: 'Inventory and trading management system with a data-oriented architecture, user authentication and operation logging.',
    },
    long: {
      es: 'Aplicación full-stack que centraliza la gestión de un negocio de compraventa: alta y control de productos, registro y visualización de operaciones, y acceso protegido por usuarios. La lógica está organizada en torno a los datos en MySQL, con una capa web en HTML5/CSS3 servida desde Python/Java y el versionado del código en Git/GitHub.',
      en: 'Full-stack application that centralises the management of a trading business: product creation and control, operation logging and visualisation, and user-protected access. The logic is organised around the data in MySQL, with an HTML5/CSS3 web layer served from Python/Java and the code versioned in Git/GitHub.',
    },
    highlights: {
      es: [
        'Arquitectura orientada a datos con modelo relacional en MySQL',
        'Autenticación de usuarios y control de acceso',
        'Registro y visualización de operaciones y productos',
        'Gestión completa de inventario (altas, estados, consultas)',
        'Código versionado con Git y alojado en GitHub',
      ],
      en: [
        'Data-oriented architecture with a relational model in MySQL',
        'User authentication and access control',
        'Operation and product logging and visualisation',
        'Full inventory management (creation, states, queries)',
        'Code versioned with Git and hosted on GitHub',
      ],
    },
  },
  {
    id: 'cineverse',
    title: 'CineVerse',
    monogram: 'CV',
    hash: 'a3d29c4',
    snippet: 'query: catalog JOIN users ON id',
    tech: ['Java / PHP', 'JavaScript', 'HTML5', 'CSS3', 'MySQL'],
    accent: 'cyan',
    image: null,
    demo: null,
    repo: 'https://github.com/RaaReeS/CineVerse',
    short: {
      es: 'Aplicación web para explorar y gestionar contenido cinematográfico: catálogo dinámico con filtrado, fichas de película y gestión de usuarios.',
      en: 'Web app to explore and manage film content: dynamic catalogue with filtering, movie pages and user management.',
    },
    long: {
      es: 'Plataforma web centrada en el mundo del cine: catálogo dinámico con filtrado por géneros y criterios de búsqueda, ficha de detalle para cada película, interfaz interactiva construida con JavaScript y un sistema de gestión de usuarios con cuentas propias en MySQL. Backend en Java/PHP, vista en HTML5/CSS3 y experiencia de cliente con JavaScript.',
      en: 'A web platform focused on cinema: dynamic catalogue with filtering by genres and search criteria, a detail page for each movie, an interactive interface built with JavaScript, and a user management system with accounts in MySQL. Backend in Java/PHP, view in HTML5/CSS3 and client experience with JavaScript.',
    },
    highlights: {
      es: [
        'Catálogo dinámico con filtrado y búsqueda',
        'Ficha de detalle de cada película',
        'Interfaz interactiva con JavaScript',
        'Gestión de usuarios y cuentas en MySQL',
        'Backend en Java/PHP y front en HTML5/CSS3',
      ],
      en: [
        'Dynamic catalogue with filtering and search',
        'Detail page for every movie',
        'Interactive interface with JavaScript',
        'User and account management in MySQL',
        'Java/PHP backend with an HTML5/CSS3 front',
      ],
    },
  },
];
