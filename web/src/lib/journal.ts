/** Journal — sample articles for the demo */
export type Article = {
  slug: string;
  title: string;
  kicker: string;
  date: string;
  minutes: number;
  dek: string;
  tint: string;
  /** Cover photograph, a path under public/ */
  cover: string;
  coverAlt: string;
  body: { h?: string; p: string }[];
};

export const articles: Article[] = [
  {
    slug: 'forty-two-hours',
    title: 'Forty-two hours',
    kicker: 'Craft',
    date: '12 November 2026',
    minutes: 6,
    dek: 'Where the time goes in a single tuxedo jacket, from the first chalk line to the last press.',
    tint: '#16161a',
    cover: 'atelier/stages/finishing.webp',
    coverAlt: "A tailor's hands sewing a buttonhole by hand on a black tuxedo cuff",
    body: [
      { p: 'A ready-made jacket is assembled in under three hours. Ours take forty-two. The difference is not slowness for its own sake; it is the work that a machine cannot do, or does badly.' },
      { h: 'The canvas', p: 'Between the cloth and the lining sits a layer of horsehair canvas. On the chest it is padded by hand with hundreds of small stitches, each one shaping the canvas a little, so the jacket curves around you rather than lying flat against you. This alone takes most of a day.' },
      { h: 'The lapel', p: 'The satin facing is laid over the lapel and rolled over the tailor\'s hand as it is sewn. That roll is why the lapel bends softly at the button instead of creasing. It cannot be pressed in afterwards; it has to be built in.' },
      { h: 'The press', p: 'Pressing is not ironing. Each seam is opened, steamed and shaped over a wooden form called a ham, then left to cool in shape. A jacket is pressed between every stage, and once more, slowly, at the end.' },
    ],
  },
  {
    slug: 'a-first-fitting',
    title: 'What happens at a first fitting',
    kicker: 'The Atelier',
    date: '2 November 2026',
    minutes: 4,
    dek: 'An hour at the table in Gulshan — what we measure, what we ask, and why we watch you stand.',
    tint: '#4a1520',
    cover: 'atelier/stages/measured.webp',
    coverAlt: "A tailor measuring a client's chest in the Nirolax atelier",
    body: [
      { p: 'Most people expect a tape measure. They are surprised by how much of the hour is spent talking.' },
      { h: 'Twenty-three measures', p: 'We take twenty-three, from the obvious — chest, waist, sleeve — to the ones that decide whether a jacket will fit, like the difference between your shoulders and the slope of your back.' },
      { h: 'The way you stand', p: 'Nobody stands symmetrically. One shoulder sits lower, the head comes forward, the weight rests on one foot. We note all of it, because a pattern cut for a statue will not fit a person.' },
      { h: 'Cloth and intention', p: 'Then we ask how you mean to wear it. A tuxedo for one wedding and a tuxedo for a season of them are cut differently.' },
    ],
  },
  {
    slug: 'the-case-for-fewer',
    title: 'The case for fewer',
    kicker: 'The House',
    date: '20 October 2026',
    minutes: 3,
    dek: 'Why we make ten pieces a season, number every one, and retire the pattern when the edition closes.',
    tint: '#d6bf96',
    cover: 'atelier/stages/ready.webp',
    coverAlt: "A finished tuxedo jacket folded in a black Nirolax box",
    body: [
      { p: 'Ten pieces is not a marketing number. It is how many we can make well with the hands we have.' },
      { h: 'Numbered', p: 'Every piece carries its number inside the breast pocket and on its certificate. When the thirty-fifth Midnight Tuxedo is finished, the pattern is retired.' },
      { h: 'Never again', p: 'This is not scarcity for its own sake. A short edition means each piece can be followed through the atelier by name, and each client can be known by theirs.' },
    ],
  },
  {
    slug: 'black-tie-plainly',
    title: 'Black tie, plainly',
    kicker: 'Dressing',
    date: '5 October 2026',
    minutes: 5,
    dek: 'What the dress code asks of you, what it does not, and the three decisions that matter.',
    tint: '#141416',
    cover: 'atelier/stages/final-fitting.webp',
    coverAlt: 'A client in a finished black tuxedo and bow tie at his final fitting',
    body: [
      { p: 'An invitation that says black tie is not asking you to look like everyone else. It is asking you to take one decision off the table, so the evening can be about the people in the room.' },
      { h: 'The jacket', p: 'Black or midnight blue, single-breasted with one button or double-breasted, with lapels faced in silk satin or grosgrain. Peak and shawl lapels are both correct; notch lapels belong to a suit. In a warm season, an ivory jacket with black trousers is the accepted answer.' },
      { h: 'The trousers', p: 'Cut from the same cloth as the jacket, with a single satin stripe down the outside of each leg and no belt loops. They are held up by side adjusters or braces, and finish with no break, or a slight one, over the shoe.' },
      { h: 'The details', p: 'A white shirt with a turn-down collar, a black bow tie you tie yourself, black patent or highly polished shoes. A pocket square in white linen if you like. A watch that slips under the cuff. That is the whole list.' },
      { h: 'What to leave out', p: 'Coloured ties, long ties, square-toed shoes and anything that blinks. The point of black tie is that it is quiet; the fit does all the talking.' },
    ],
  },
  {
    slug: 'cloth-for-a-warm-country',
    title: 'Cloth for a warm country',
    kicker: 'Cloth',
    date: '18 September 2026',
    minutes: 4,
    dek: 'Why weight matters less than weave, and how we choose cloth for a Dhaka evening.',
    tint: '#3c3b39',
    cover: 'atelier/stages/cutting.webp',
    coverAlt: 'Black wool cloth laid out and cut with shears on the atelier table',
    body: [
      { p: 'People ask for the lightest cloth we have. Usually it is the wrong question. A very light cloth creases, clings in humidity and tires within a season. What keeps you cool is air moving through the weave.' },
      { h: 'Open weaves', p: 'Hopsack and fresco are woven with gaps you can see when you hold them to the light. They breathe, they recover from creasing overnight, and they hold a crisp line on a long evening. Our Noir Bandhgala is cut from one for that reason.' },
      { h: 'Half-lined', p: 'A full lining traps heat against the back. For warm-weather pieces we line only the sleeves and the top of the back, and finish the inside seams by hand so they look as clean as the outside.' },
      { h: 'Silk, where it counts', p: 'Raw silk and wool-silk blends are cooler to the touch than pure wool and take colour beautifully. We use them for ivory pieces and for wedding sherwanis, where the cloth itself is the decoration.' },
      { h: 'At your fitting', p: 'Bring the occasion with you: indoors or out, the month, how long the evening runs. We will lay three or four cloths on your shoulder and choose together. The right one is usually obvious within a minute.' },
    ],
  },
];

export const findArticle = (slug: string) => articles.find((a) => a.slug === slug);
