/**
 * Production stages for a made-to-measure piece. Each has a photograph at
 * public/atelier/stages/<slug>.webp (generated later); until it exists, the
 * portal shows a placeholder. The atelier can also attach its own photo per
 * commission from the console.
 */
export type StageDef = { slug: string; name: string; note: string };

export const STAGES: StageDef[] = [
  { slug: 'measured', name: 'Measured', note: 'Twenty-three measures taken and your posture noted.' },
  { slug: 'pattern', name: 'Pattern drafted', note: 'Your paper pattern drafted by hand from your measures.' },
  { slug: 'cutting', name: 'Cloth cut', note: 'The cloth laid out and cut with shears, one piece at a time.' },
  { slug: 'basting', name: 'Basted', note: 'Loosely tacked together in white thread for the first fitting.' },
  { slug: 'first-fitting', name: 'First fitting', note: 'Fitted on you at the atelier; chalk marks for every change.' },
  { slug: 'stitching', name: 'Forward stitching', note: 'The piece is being sewn for real, seam by seam.' },
  { slug: 'second-fitting', name: 'Second fitting', note: 'Nearly finished — the last adjustments to balance and length.' },
  { slug: 'finishing', name: 'Hand finishing', note: 'Buttonholes, pick-stitching and facings sewn by hand.' },
  { slug: 'pressing', name: 'Wash & press', note: "Steamed and pressed into shape over a tailor's ham." },
  { slug: 'final-fitting', name: 'Final fitting', note: 'Worn once more at the atelier before it is signed off.' },
  { slug: 'ready', name: 'Ready for you', note: 'Numbered, boxed and waiting for you to collect.' },
];

export const MEASURES = ['Chest', 'Waist', 'Seat', 'Shoulder', 'Sleeve', 'Back length', 'Neck', 'Trouser waist', 'Inseam', 'Thigh'] as const;
