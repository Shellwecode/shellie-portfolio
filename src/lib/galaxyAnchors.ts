/* Shellie's orbiting galaxy, broken down into pieces — parsed at build time
   from the processed SVG (src/assets/opening/galaxy.svg). Every <use> stamp
   becomes an anchor [x, y, scale] in the 528×458 viewBox, grouped by the 34
   drift clusters. Shared by the Opening B print and the greeting's galaxy
   mark, so both draw the same artwork from the same ~7 KB of geometry. */
import galaxyRaw from '../assets/opening/galaxy.svg?raw';

export type Anchor = [number, number, number];
export const VIEW = { w: 528, h: 458, cx: 264, cy: 229 };

const NUM = '([-\\d.eE]+)';
const clusterRe =
  /<g class="gx-cluster"[^>]*><g id="Vector_\d+" transform="([^"]*)">([\s\S]*?)<\/g><\/g>/g;
const useTransformRe = /<use[^>]*transform="([^"]*)"/g;
const translateRe = new RegExp(`translate\\(${NUM}(?:[ ,]+${NUM})?\\)`);
const rotateRe = new RegExp(`rotate\\(${NUM}\\)`);
const scaleRe = new RegExp(`scale\\(${NUM}\\)`);
const matrixRe = new RegExp(
  `matrix\\(${NUM}[ ,]+${NUM}[ ,]+${NUM}[ ,]+${NUM}[ ,]+${NUM}[ ,]+${NUM}\\)`,
);

const parse = (): Anchor[][] => {
  const clusters: Anchor[][] = [];
  let m: RegExpExecArray | null;
  clusterRe.lastIndex = 0;
  while ((m = clusterRe.exec(galaxyRaw))) {
    const ct = translateRe.exec(m[1]);
    const cr = rotateRe.exec(m[1]);
    const tx = ct ? parseFloat(ct[1]) : 0;
    const ty = ct?.[2] ? parseFloat(ct[2]) : 0;
    const th = cr ? (parseFloat(cr[1]) * Math.PI) / 180 : 0;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const pts: Anchor[] = [];
    let um: RegExpExecArray | null;
    useTransformRe.lastIndex = 0;
    while ((um = useTransformRe.exec(m[2]))) {
      const tr = um[1];
      let ux: number;
      let uy: number;
      let s: number;
      const mt = matrixRe.exec(tr);
      if (mt) {
        s = Math.hypot(parseFloat(mt[1]), parseFloat(mt[2]));
        ux = parseFloat(mt[5]);
        uy = parseFloat(mt[6]);
      } else {
        const ut = translateRe.exec(tr);
        if (!ut) continue;
        ux = parseFloat(ut[1]);
        uy = ut[2] ? parseFloat(ut[2]) : 0;
        const us = scaleRe.exec(tr);
        s = us ? Math.abs(parseFloat(us[1])) : 0.2;
      }
      pts.push([
        Math.round((tx + ux * cos - uy * sin) * 10) / 10,
        Math.round((ty + ux * sin + uy * cos) * 10) / 10,
        Math.round(s * 1000) / 1000,
      ]);
    }
    if (pts.length) clusters.push(pts);
  }
  return clusters;
};

export const galaxyClusters: Anchor[][] = parse();
