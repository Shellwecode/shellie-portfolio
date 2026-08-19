// The landing's rise, replayed on arrival. The global entrance
// (html[data-entrance]) fires once per session and never on soft navs, so a
// page's .enter stagger would otherwise only show when it is the session's
// first page. Same keyframe recipe as global.css, read from the --ent-* vars.
// Each page calls this with a selector only its own markup matches — the
// page-load listeners outlive soft navs, so the scope is also the guard.
import { cssMs } from './css-time';

export function riseEnter(scope: string) {
  const els = document.querySelectorAll<HTMLElement>(scope);
  if (!els.length) return; // some other page — nothing to do
  if (document.documentElement.hasAttribute('data-entrance')) return; // CSS entrance already has it
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const style = getComputedStyle(document.documentElement);
  const dur = cssMs(style.getPropertyValue('--ent-ms'), 950);
  const stagger = cssMs(style.getPropertyValue('--ent-stagger'), 120);
  const rise = style.getPropertyValue('--ent-rise').trim() || '16px';
  const blur = style.getPropertyValue('--ent-blur').trim() || '8px';
  els.forEach((el) => {
    const i = parseFloat(el.style.getPropertyValue('--enter-i')) || 0;
    if (reduced) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'ease-out', fill: 'backwards' });
      return;
    }
    el.animate(
      [
        { opacity: 0, filter: `blur(${blur})`, translate: `0 ${rise}` },
        { opacity: 1, filter: 'blur(0px)', translate: '0 0' },
      ],
      {
        duration: dur,
        delay: i * stagger,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'backwards', // holds opacity 0 through the stagger delay
      }
    );
  });
}
