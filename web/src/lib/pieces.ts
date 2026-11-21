import { asset } from './asset';
/** Season I — sample catalogue for the demo. Prices in BDT. */
export type Kind = 'Tailoring' | 'Evening' | 'Ceremony';

export type Piece = {
  no: string;
  slug: string;
  name: string;
  kind: Kind;
  cloth: string;
  /** Colour used for the fabric swatch / live satin until photography arrives */
  tint: string;
  rtw: number;
  mtm: number;
  edition: number;
  remaining: number;
  sizes: string[];
  soldOut?: string[];
  /** One-line description used in lists */
  line: string;
  /** Opening paragraph on the piece page */
  story: string;
  details: { title: string; body: string }[];
  composition: string;
  care: string;
  /** Folder in /public/pieces with front/left/back/right(.webp and -cut.webp) */
  photos?: string;
  /** Photographs uploaded in the console (Cloudinary URLs), by view */
  images?: Partial<Record<View, string>>;
};
export type View = 'front' | 'left' | 'back' | 'right';
export const VIEWS: View[] = ['front', 'left', 'back', 'right'];

const jacket = ['46', '48', '50', '52', '54'];
const gown = ['34', '36', '38', '40', '42'];

/** Season I as shipped with the site — used when the API is not connected, and as the first paint */
export const SEED_PIECES: Piece[] = [
  {
    no: '01',
    slug: 'midnight-tuxedo',
    name: 'The Midnight Tuxedo',
    kind: 'Evening',
    cloth: 'Wool barathea, silk satin facings',
    tint: '#16161a',
    rtw: 110000,
    mtm: 135000,
    edition: 35,
    remaining: 12,
    sizes: jacket,
    soldOut: ['46'],
    line: 'Single-breasted, one button, satin peak lapels.',
    story:
      'The evening piece the house is built on. One button set a little high, peak lapels faced in black silk satin and rolled by hand so they curve across the chest instead of lying flat.',
    details: [
      { title: 'The lapel', body: 'Silk satin peak lapels, hand-rolled. Jetted pockets with no flaps, a covered horn button.' },
      { title: 'The line', body: 'High, small armholes and a natural shoulder give one unbroken line. Trousers carry a satin side stripe.' },
      { title: 'The back', body: 'Ventless and shaped through the blades, the way evening coats were cut, so it falls clean when you sit.' },
      { title: 'The finish', body: 'Half-canvas, hand-padded. Working cuffs, pick-stitched edges, numbered inside the breast pocket.' },
    ],
    composition: 'Outer 100% wool barathea · Facings 100% silk satin · Lining Bemberg cupro',
    care: 'Brush after wearing, rest on a shaped hanger for a day. Dry clean no more than twice a season.',
    photos: 'midnight-tuxedo',
  },
  {
    no: '02',
    slug: 'noir-peak-lapel',
    name: 'Noir Peak Lapel Suit',
    kind: 'Tailoring',
    cloth: 'Super 130s twill',
    tint: '#1b1b1f',
    rtw: 92000,
    mtm: 115000,
    edition: 35,
    remaining: 21,
    sizes: jacket,
    line: 'Two buttons, wide peak lapels, a suit for long days.',
    story: 'A black suit cut to be worn from a morning meeting into the evening. Wide peak lapels, a soft roll to the second button and trousers with a single forward pleat.',
    details: [
      { title: 'The cloth', body: 'A dense Super 130s twill that holds its press and recovers overnight.' },
      { title: 'The cut', body: 'A slightly extended shoulder and a suppressed waist, with a long, clean skirt.' },
      { title: 'The trouser', body: 'Single forward pleat, side adjusters instead of belt loops, a half-break hem.' },
    ],
    composition: 'Outer 100% wool · Lining Bemberg cupro',
    care: 'Brush and rest between wears. Press, do not dry clean, when it only needs freshening.',
  },
  {
    no: '03',
    slug: 'graphite-double-breasted',
    name: 'Graphite Double-Breasted',
    kind: 'Tailoring',
    cloth: 'Mélange flannel',
    tint: '#3c3b39',
    rtw: 98000,
    mtm: 122000,
    edition: 30,
    remaining: 17,
    sizes: jacket,
    line: 'Six-on-two, soft flannel, cut for the cool months.',
    story: 'A six-on-two double-breasted jacket in graphite flannel — soft to the hand, quiet in colour, and serious in its line.',
    details: [
      { title: 'The cloth', body: 'A mélange flannel with a gentle nap that catches light without shine.' },
      { title: 'The button stance', body: 'Six buttons, fastening on the lower two, so the lapel rolls long.' },
      { title: 'The back', body: 'Double vents, deep enough to move in, short enough to stay closed.' },
    ],
    composition: 'Outer 100% wool flannel · Lining Bemberg cupro',
    care: 'Brush with the nap. Store away from direct sunlight.',
  },
  {
    no: '04',
    slug: 'ivory-dinner-jacket',
    name: 'Ivory Dinner Jacket',
    kind: 'Evening',
    cloth: 'Wool & silk barathea',
    tint: '#e7dfcf',
    rtw: 88000,
    mtm: 108000,
    edition: 25,
    remaining: 9,
    sizes: jacket,
    line: 'Shawl collar, ivory, for warm evenings.',
    story: 'The warm-weather answer to black tie. An ivory shawl-collar jacket worn with the black trousers of the Midnight Tuxedo.',
    details: [
      { title: 'The collar', body: 'A shawl collar in self-fabric, so the jacket reads as one colour from across a room.' },
      { title: 'The weight', body: 'Light, half-lined, and cool enough for a Dhaka winter wedding outdoors.' },
      { title: 'The pairing', body: 'Designed to be worn with the black trousers of Piece Nº 01.' },
    ],
    composition: 'Outer 70% wool, 30% silk · Half-lined Bemberg cupro',
    care: 'Keep covered when stored. Spot-clean with care; dry clean by a specialist only.',
  },
  {
    no: '05',
    slug: 'ivory-raw-silk-sherwani',
    name: 'Ivory Raw-Silk Sherwani',
    kind: 'Ceremony',
    cloth: 'Hand-loomed raw silk',
    tint: '#e2d6bd',
    rtw: 145000,
    mtm: 175000,
    edition: 20,
    remaining: 6,
    sizes: jacket,
    line: 'Knee-length, hand-loomed silk, eleven covered buttons.',
    story: 'A wedding sherwani without ornament. Hand-loomed raw silk, a band collar and eleven covered buttons — the texture of the cloth is the decoration.',
    details: [
      { title: 'The cloth', body: 'Raw silk loomed by hand, with the slubs and irregularities left in.' },
      { title: 'The collar', body: 'A low band collar, interfaced so it stands without stiffness.' },
      { title: 'The buttons', body: 'Eleven buttons covered in the same silk, sewn with a shank.' },
    ],
    composition: 'Outer 100% raw silk · Lining silk habotai',
    care: 'Store flat or on a wide hanger, wrapped in cotton. Specialist dry clean only.',
  },
  {
    no: '06',
    slug: 'noir-bandhgala',
    name: 'Noir Bandhgala',
    kind: 'Ceremony',
    cloth: 'Open-weave hopsack',
    tint: '#18181b',
    rtw: 76000,
    mtm: 96000,
    edition: 35,
    remaining: 24,
    sizes: jacket,
    line: 'Band collar, black, for evenings without a tie.',
    story: 'A black bandhgala in an open hopsack weave that breathes. Formal enough for any evening, and no tie to think about.',
    details: [
      { title: 'The cloth', body: 'An open hopsack that keeps its shape and lets air through.' },
      { title: 'The collar', body: 'A closed band collar fastened with a hidden hook.' },
      { title: 'The buttons', body: 'Five black horn buttons, matte, hand-sewn.' },
    ],
    composition: 'Outer 100% wool hopsack · Lining Bemberg cupro',
    care: 'Brush and rest between wears.',
  },
  {
    no: '07',
    slug: 'bordeaux-smoking-jacket',
    name: 'Bordeaux Smoking Jacket',
    kind: 'Evening',
    cloth: 'Cotton velvet, silk shawl collar',
    tint: '#4a1520',
    rtw: 105000,
    mtm: 128000,
    edition: 20,
    remaining: 4,
    sizes: jacket,
    line: 'Bordeaux velvet with a black silk shawl collar.',
    story: 'The house colour, in velvet. A smoking jacket with a black silk shawl collar and frogging-free front, for evenings at home or very late ones out.',
    details: [
      { title: 'The cloth', body: 'A deep-pile cotton velvet that turns from wine to black as it moves.' },
      { title: 'The collar', body: 'Black silk satin, piped where it meets the velvet.' },
      { title: 'The fastening', body: 'A single covered button and a tie belt.' },
    ],
    composition: 'Outer 100% cotton velvet · Collar 100% silk · Lining silk',
    care: 'Steam, never press, the velvet. Hang with space around it.',
  },
  {
    no: '08',
    slug: 'silk-column-gown',
    name: 'Silk Column Gown',
    kind: 'Evening',
    cloth: 'Heavy silk crêpe satin',
    tint: '#141416',
    rtw: 125000,
    mtm: 155000,
    edition: 15,
    remaining: 7,
    sizes: gown,
    line: 'Black, floor length, cut on the bias.',
    story: 'A floor-length column in heavy black crêpe satin, cut on the bias so it moves like water and needs nothing added to it.',
    details: [
      { title: 'The cut', body: 'Cut on the bias, so the cloth follows the body without darts.' },
      { title: 'The back', body: 'Low, with a fine strap that crosses once.' },
      { title: 'The finish', body: 'Hand-rolled hems throughout.' },
    ],
    composition: '100% silk crêpe satin',
    care: 'Store hanging, covered. Specialist dry clean only.',
  },
  {
    no: '09',
    slug: 'champagne-draped-gown',
    name: 'Champagne Draped Gown',
    kind: 'Evening',
    cloth: 'Silk charmeuse',
    tint: '#d6bf96',
    rtw: 138000,
    mtm: 168000,
    edition: 15,
    remaining: 3,
    sizes: gown,
    line: 'Champagne charmeuse, draped at one shoulder.',
    story: 'Champagne charmeuse draped from one shoulder and gathered at the waist by hand. The drape is set on you at the fitting.',
    details: [
      { title: 'The drape', body: 'Pinned on the body at the first fitting, then hand-sewn in place.' },
      { title: 'The cloth', body: 'A heavy charmeuse with a liquid surface and a matte reverse.' },
      { title: 'The length', body: 'Floor length, with a short train at the back.' },
    ],
    composition: '100% silk charmeuse',
    care: 'Store hanging, covered, away from light. Specialist dry clean only.',
  },
  {
    no: '10',
    slug: 'le-smoking-dress',
    name: 'Le Smoking Tuxedo Dress',
    kind: 'Evening',
    cloth: 'Grain de poudre wool',
    tint: '#151517',
    rtw: 118000,
    mtm: 146000,
    edition: 25,
    remaining: 11,
    sizes: gown,
    line: 'A tuxedo, made into a dress.',
    story: 'The tuxedo, made into a dress. Satin peak lapels, one button, and a skirt that ends just below the knee.',
    details: [
      { title: 'The lapel', body: 'Silk satin peak lapels, as on Piece Nº 01.' },
      { title: 'The cloth', body: 'Grain de poudre — a fine wool with a dry, powdery hand.' },
      { title: 'The length', body: 'Just below the knee, with a back vent for walking.' },
    ],
    composition: 'Outer 100% wool · Facings 100% silk satin · Lining silk',
    care: 'Brush and rest between wears. Dry clean sparingly.',
  },
];

/* The live catalogue (from the API when connected). Screens read it with usePieces(); plain code with getPieces(). */
let current: Piece[] = SEED_PIECES;
export const getPieces = () => current;
export const setPieces = (list: Piece[]) => {
  current = list;
};
export const findPiece = (slug: string) => current.find((p) => p.slug === slug);

/** A photograph of the piece, or null when there is none yet (the silk shader stands in) */
export function pieceImage(p: Pick<Piece, 'photos' | 'images'>, view: View = 'front'): string | null {
  const up = p.images?.[view];
  if (up) return up.startsWith('/') ? asset(up.slice(1)) : up;
  if (p.photos) return asset(`pieces/${p.photos}/${view}.webp`);
  return null;
}
/** A smaller copy of an uploaded photo: Cloudinary resizes on the fly; other images are returned unchanged */
export function sized(url: string, width: number): string {
  if (!url.includes('res.cloudinary.com/') || !url.includes('/image/upload/')) return url;
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${width},q_auto,f_auto/`);
}
export const hasPhotos = (p: Pick<Piece, 'photos' | 'images'>) => !!pieceImage(p, 'front');
export const kinds: Kind[] = ['Tailoring', 'Evening', 'Ceremony'];

/** Bangladeshi grouping: 1,10,000 */
export const bdt = (n: number) => `BDT ${n.toLocaleString('en-IN')}`;

/** Highlight colour for a cloth: warm gold on dark cloth, white on light cloth */
export const sheenFor = (hex: string) => {
  const v = parseInt(hex.slice(1), 16);
  const lum = ((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11;
  return lum > 140 ? '#fff6e6' : '#c9a467';
};
export const isLight = (hex: string) => sheenFor(hex) === '#fff6e6';
