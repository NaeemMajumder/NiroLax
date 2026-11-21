/** Questions clients ask most, grouped for the FAQ page */
export type QA = { q: string; a: string[] };
export type FaqGroup = { id: string; title: string; items: QA[] };

export const FAQ: FaqGroup[] = [
  {
    id: 'pieces',
    title: 'Pieces & editions',
    items: [
      {
        q: 'What does “numbered edition” mean?',
        a: [
          'Each piece in a season is made in a fixed number — 12, 24 or 35, depending on the piece. Every one carries its number inside the collar and on its certificate, for example Nº 07 of 35.',
          'When the last number is taken, the edition closes and the pattern is retired. It is not made again, in any size.',
        ],
      },
      {
        q: 'Can I choose my edition number?',
        a: ['No. Numbers are given in the order pieces are finished, so the number records when yours was made. We cannot hold or reserve a particular number.'],
      },
      {
        q: 'What is the difference between ready-to-wear and made-to-measure?',
        a: [
          'Ready-to-wear is cut in standard sizes, finished, and delivered within three working days in Dhaka. It can be adjusted at the atelier at no charge within thirty days.',
          'Made-to-measure is cut from your own pattern after a fitting, with two or three fittings along the way, and takes four to six weeks. You choose the details — lapel, buttons, lining — within the design of the piece.',
        ],
      },
      {
        q: 'Where is the cloth from?',
        a: ['Wools come from mills in Biella and Huddersfield, silks from Rajshahi and Lyon, and every lining is cupro. The composition of each piece is listed on its page under “Details”.'],
      },
    ],
  },
  {
    id: 'mtm',
    title: 'Made to measure',
    items: [
      {
        q: 'How long does made-to-measure take?',
        a: [
          'Four to six weeks from the first fitting, depending on the piece and the season. Your portal shows a ready-by date from the day we cut, and it is updated if anything changes.',
          'If you have a wedding or an event, tell us the date when you book — we will say honestly whether it can be done.',
        ],
      },
      {
        q: 'How do I follow my piece while it is being made?',
        a: ['Sign in to the client portal with your mobile number. You will see each of the eleven stages — from pattern to final pressing — with a photograph from the workroom as each one is finished.'],
      },
      {
        q: 'How many fittings will I need?',
        a: ['Usually three: the first to measure and choose cloth, a basted fitting once the piece is tacked together, and a final fitting before pressing. Gowns sometimes need a fourth.'],
      },
      {
        q: 'Can I have a made-to-measure piece made for someone else?',
        a: ['Yes, but the person who will wear it must come to the fittings. For a gift, we can give a gift card for the price of the piece and a fitting for them to book.'],
      },
    ],
  },
  {
    id: 'fittings',
    title: 'Fittings & the atelier',
    items: [
      {
        q: 'How do I book a fitting?',
        a: ['Choose a day and hour on the Fittings page. A first fitting for a new piece asks for a BDT 10,000 deposit, which is taken from the price of the piece. Fittings for a piece already in hand, alterations and conversations about cloth are free.'],
      },
      {
        q: 'Can I change or cancel an appointment?',
        a: ['Yes. Cancel from your portal or call us. If you cancel more than 24 hours before, the deposit is refunded in full within seven working days. Within 24 hours, it stays on your account for your next appointment.'],
      },
      {
        q: 'Where is the atelier, and is there parking?',
        a: ['House 21, Road 113, Gulshan 2, Dhaka. There is parking for two cars in front of the house; our doorman will park for you. We are open Saturday to Thursday, 11 am to 8 pm, by appointment.'],
      },
      {
        q: 'May I bring someone with me?',
        a: ['Of course. Fittings are calmer with a friend or family member whose eye you trust. Tell us when you book so we can have tea ready for two.'],
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders & payment',
    items: [
      {
        q: 'How can I pay?',
        a: ['By card (Visa, Mastercard, Amex) or bKash through SSLCommerz, or cash on delivery within Dhaka. Cards from 18 banks can be paid in 0% instalments over 3 to 12 months.'],
      },
      {
        q: 'Is my payment secure?',
        a: ['Payments are taken by SSLCommerz, Bangladesh’s licensed payment gateway. We never see or store your card number or bKash PIN.'],
      },
      {
        q: 'What does “held for 24 hours” mean?',
        a: ['When you reserve a ready-to-wear size, it is set aside for you for 24 hours while you decide. If you do not check out in that time, it goes back to the edition for someone else.'],
      },
      {
        q: 'Will I receive a receipt?',
        a: ['Yes — on screen as soon as the order is placed, by SMS to your mobile, and by email if you gave one. Every order also appears in your client portal.'],
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery & returns',
    items: [
      {
        q: 'How long does delivery take, and what does it cost?',
        a: ['Delivery is free. Our own courier delivers within Dhaka in three working days; anywhere else in Bangladesh within five. You may also collect from the atelier.'],
      },
      {
        q: 'Do you deliver outside Bangladesh?',
        a: ['Not yet from the website. Write to us and we will arrange international delivery by DHL for ready-to-wear pieces, at cost.'],
      },
      {
        q: 'Can I return a piece?',
        a: [
          'Ready-to-wear pieces may be returned unworn, with their tags and certificate, within seven days of delivery for a full refund. We collect them from you at no charge.',
          'Made-to-measure pieces cannot be returned, because they are cut for one person — but we alter them free of charge for a year until they fit as agreed.',
        ],
      },
    ],
  },
  {
    id: 'care',
    title: 'Alterations & care',
    items: [
      {
        q: 'Are alterations free?',
        a: ['Made-to-measure pieces are altered free for a year from delivery; ready-to-wear pieces within thirty days. After that, alterations are charged at cost, and pressing is free for life.'],
      },
      {
        q: 'How should I clean my piece?',
        a: ['As rarely as possible — brush it after wearing and let it rest on its hanger. Dry clean no more than twice a season, and only with a specialist for silk and velvet. Our care page has the details.'],
      },
    ],
  },
  {
    id: 'account',
    title: 'Your portal',
    items: [
      {
        q: 'How do I sign in? I have no password.',
        a: ['There is no password. Enter the mobile number you gave the atelier and we send a six-digit code by SMS. Your portal opens with your first order or fitting.'],
      },
      {
        q: 'Can I see my measurements?',
        a: ['Yes, your measure sheet is in the portal, in your tailor’s hand. It belongs to you — ask us at any time for a printed copy, or to delete it.'],
      },
    ],
  },
];
