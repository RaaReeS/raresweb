/* =========================================================
   js/modules/easterEggs.js
   - Console:
     arte ASCII + datos de contacto, msg colorizado.
   - Konami code (↑↑↓↓←→←→BA):
     modo arcoíris en las partículas del hero (animations.js
     escucha el evento 'konami') + toast de confirmación.
   ========================================================= */

import { t } from './i18n.js';
import { notify } from './contact.js';

/* ---------- console ---------- */

export function initConsoleEgg() {
  const art = [
    '',
    '  ███████╗██████╗  █████╗ ██████╗ ███████╗███████╗ ██████╗██████╗  ██╗   ██╗',
    '  ██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗ ██║   ██║',
    '  ███████╗██████╔╝███████║██║  ██║███████╗█████╗  ██║     ██████╔╝ ██║   ██║',
    '  ╚════██║██╔══██╗██╔══██║██║  ██║╚════██║██╔══╝  ██║     ██╔══██╗ ╚██╗ ██╔╝',
    '  ███████║██║  ██║██║  ██║██████╔╝███████║███████╗╚██████╗██║  ██║  ╚████╔╝',
    '  ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝   ╚═══╝',
    '',
  ].join('\n');

  console.log(`%c${art}`, 'color:#a5b4fc; font-family:monospace; font-size:10px');
  console.log(
    `%c ${t('console.l1')}\n ${t('console.l2')}\n ${t('console.l3')}\n ${t('console.l4')}`,
    'color:#67e8f9; font-family:monospace; line-height:1.8'
  );
}

/* ---------- konami ---------- */

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
];

export function initKonami() {
  let progress = 0;

  document.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (key === KONAMI[progress]) {
      progress += 1;
      if (progress === KONAMI.length) {
        progress = 0;
        document.dispatchEvent(new CustomEvent('konami', { bubbles: true }));
        notify(t('egg.toast'), 4800);
      }
    } else {
      progress = key === KONAMI[0] ? 1 : 0;
    }
  });
}
