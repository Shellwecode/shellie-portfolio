/* Dev-only dials for the work shelf (projects/index.astro): the reveal's
   stagger/swing per gabriell_lab's tip, and the grid's card sizes. Every
   dial writes a --shelf-* custom property on <html>; the page's CSS and
   reveal script read them with the shipped values as fallbacks, so this
   panel never ships — deleting the mount changes nothing. Replay reveal
   re-runs the entrance on the current filter via the shelf:replay event. */
import { useEffect } from 'react';
import { useDialKit, DialRoot } from 'dialkit';
import 'dialkit/styles.css';

/* Named curves — picking a character is the real decision. */
const EASE: Record<string, string> = {
  'settle (shipped)': 'cubic-bezier(0.2, 0, 0, 1)',
  standard: 'cubic-bezier(0.5, 0, 0.3, 1)',
  'ease-out long': 'cubic-bezier(0.22, 1, 0.36, 1)',
  'anticipate (dip first)': 'cubic-bezier(0.36, -0.18, 0.66, 0.6)',
  linear: 'linear',
};

export default function WorkShelfLab() {
  const p = useDialKit(
    'Work shelf',
    {
      /* Defaults = Shellie's tune (Aug 10): two-up ratio cards, no lead row,
         reveal deals from the first card with an anticipate dip. */
      reveal: {
        stagger: [70, 0, 200, 5], //   ms per card, measured from the origin
        duration: [590, 100, 1200, 10],
        y: [24, 0, 60, 1], //          px the cards climb
        swing: [-2, -10, 10, 0.5], //  deg — the tiny swing
        from: { type: 'select', options: ['center', 'first', 'last'], default: 'first' },
        ease: { type: 'select', options: Object.keys(EASE), default: 'anticipate (dip first)' },
      },
      card: {
        sizing: { type: 'select', options: ['height', 'ratio'], default: 'ratio' },
        cardH: [320, 120, 420, 2], //  standard cover height (height mode)
        leadH: [270, 160, 420, 2], //  lead + co cover height (height mode)
        ratio: [1.55, 0.7, 3, 0.05], //     standard cover w/h (ratio mode)
        leadRatio: [1.65, 0.7, 3.4, 0.05], // lead + co cover w/h (ratio mode)
        radius: [16, 0, 32, 1],
      },
      grid: {
        cols: [12, 6, 16, 1], //       grid columns
        cardSpan: [6, 2, 8, 1], //     columns a standard card takes
        leadSpan: [8, 4, 16, 1],
        coSpan: [4, 2, 8, 1],
        leadRow: false, //             off = every card equal, no lead slots
        gapX: [20, 4, 60, 1],
        gapY: [20, 4, 60, 1],
      },
      replay: { type: 'action', label: 'Replay reveal' },
    },
    {
      onAction: () => window.dispatchEvent(new CustomEvent('shelf:replay')),
    }
  );

  useEffect(() => {
    const root = document.documentElement;
    const vars: Record<string, string> = {
      '--shelf-stagger': `${p.reveal.stagger}ms`,
      '--shelf-dur': `${p.reveal.duration}ms`,
      '--shelf-y': `${p.reveal.y}px`,
      '--shelf-swing': `${p.reveal.swing}deg`,
      '--shelf-from': p.reveal.from,
      '--shelf-ease': EASE[p.reveal.ease] ?? EASE['settle (shipped)'],
      '--shelf-card-h': `${p.card.cardH}px`,
      '--shelf-lead-h': `${p.card.leadH}px`,
      '--shelf-ratio': `${p.card.ratio}`,
      '--shelf-lead-ratio': `${p.card.leadRatio}`,
      '--shelf-radius': `${p.card.radius}px`,
      '--shelf-cols': `${p.grid.cols}`,
      '--shelf-card-span': `${p.grid.cardSpan}`,
      '--shelf-lead-span': `${p.grid.leadSpan}`,
      '--shelf-co-span': `${p.grid.coSpan}`,
      '--shelf-lead-row': p.grid.leadRow ? '1' : '0',
      '--shelf-gap-x': `${p.grid.gapX}px`,
      '--shelf-gap-y': `${p.grid.gapY}px`,
    };
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    /* ratio is the shipped default — the attribute marks the exception */
    if (p.card.sizing === 'height') root.setAttribute('data-shelf-sizing', 'height');
    else root.removeAttribute('data-shelf-sizing');
    /* lead-row assignment lives in the page script — nudge it to re-slot
       (no animation) so the leadRow toggle takes effect immediately */
    window.dispatchEvent(new CustomEvent('shelf:relayout'));
  }, [p]);

  return <DialRoot position="top-right" />;
}
