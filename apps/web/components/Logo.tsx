import { SVGProps } from 'react';

/**
 * Keystone mark — a faceted keystone block (the wedge stone at an arch's apex)
 * sitting on its springline. Two facets give it a cut-stone, dimensional read;
 * it stays crisp at favicon size and works bare (no container chip).
 */
export function KeystoneMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={20} height={20} {...props}>
      {/* left facet (full strength) */}
      <path d="M5.5 4 H12 V16.5 H8.4 Z" fill="currentColor" />
      {/* right facet (recessed) */}
      <path d="M12 4 H18.5 L15.6 16.5 H12 Z" fill="currentColor" opacity="0.55" />
      {/* springline */}
      <path d="M3.5 19.5 H20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
