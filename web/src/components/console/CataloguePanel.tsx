'use client';

import { useState } from 'react';
import { bdt, pieceImage, VIEWS, type Kind, type View } from '@/lib/pieces';
import { useDB } from '@/lib/store';
import { API, createPiece, deletePiece, reorderPieces, updatePiece, uploadImage, useConsoleExtras, type PieceInput, type ServerPiece } from '@/lib/actions';
import { refreshCatalogue } from '@/lib/catalogue';
import { notify } from '@/lib/toast';
import { Swatch } from '@/components/ui/Swatch';
import { Card, H, Pill, SmallBtn, readPhoto } from './ui';

export const ServerOnly = ({ what }: { what: string }) => (
  <Card className="px-6 py-14 text-center">
    <p className="font-display text-[24px] text-ivory">{what} needs the API</p>
    <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-bone/55">This preview runs on sample data in your browser. Run the site with the API (see RUN-GUIDE) — or open the deployed site — to use this part of the console.</p>
  </Card>
);

const blank: PieceInput = {
  name: '',
  no: '',
  kind: 'Tailoring',
  cloth: '',
  tint: '#1a1a1e',
  rtw: 0,
  mtm: 0,
  edition: 20,
  sizes: ['46', '48', '50', '52', '54'],
  soldOut: [],
  line: '',
  story: '',
  details: [
    { title: '', body: '' },
    { title: '', body: '' },
  ],
  composition: '',
  care: '',
  images: {},
  published: false,
};

export function CataloguePanel() {
  const x = useConsoleExtras();
  const remaining = useDB((d) => d.remaining);
  const [editing, setEditing] = useState<ServerPiece | 'new' | null>(null);
  if (!API || !x) return <ServerOnly what="The catalogue editor" />;
  const list = x.pieces;

  const move = (i: number, dir: -1 | 1) => {
    const order = list.map((p) => p.slug);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    reorderPieces(order).then(refreshCatalogue, () => {});
  };

  if (editing) return <PieceEditor piece={editing === 'new' ? null : editing} cloudinary={x.cloudinary} onDone={() => setEditing(null)} nextNo={String(list.length + 1).padStart(2, '0')} />;

  return (
    <div className="space-y-6">
      <H aside={<SmallBtn tone="gold" onClick={() => setEditing('new')}>New piece</SmallBtn>}>Catalogue</H>
      <p className="text-[14px] text-bone/55">The season as the shop shows it. Drafts stay hidden until published. Changes reach the shop within a minute.</p>
      <div className="space-y-3">
        {list.map((p, i) => {
          const img = pieceImage(p, 'front');
          return (
            <Card key={p.slug} className="grid grid-cols-[56px_1fr] gap-4 p-4 md:grid-cols-[64px_1.4fr_1fr_auto] md:items-center">
              <div className="relative aspect-[3/4] overflow-hidden bg-noir">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {img ? <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" /> : <Swatch tint={p.tint} className="absolute inset-0" />}
              </div>
              <div>
                <p className="text-[11px] tracking-[0.2em] text-bone/45 uppercase">
                  Nº {p.no} · {p.kind}
                </p>
                <p className="mt-1 font-display text-[20px] leading-tight text-ivory">{p.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Pill tone={p.published ? 'ok' : 'muted'}>{p.published ? 'On the shop' : 'Draft'}</Pill>
                  <Pill>{`${remaining[p.slug] ?? 0} / ${p.edition} left`}</Pill>
                </div>
              </div>
              <p className="col-span-2 text-[13px] text-bone/60 md:col-span-1">
                {bdt(p.rtw)} ready · {bdt(p.mtm)} to measure
              </p>
              <div className="col-span-2 flex flex-wrap gap-2 md:col-span-1 md:justify-end">
                <SmallBtn onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </SmallBtn>
                <SmallBtn onClick={() => move(i, 1)} disabled={i === list.length - 1}>
                  ↓
                </SmallBtn>
                <SmallBtn onClick={() => updatePiece(p.slug, { published: !p.published }, p.published ? 'Moved to drafts' : 'Published').then(refreshCatalogue, () => {})}>{p.published ? 'Unpublish' : 'Publish'}</SmallBtn>
                <SmallBtn tone="gold" onClick={() => setEditing(p)}>
                  Edit
                </SmallBtn>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const field = 'mt-1.5 w-full border-b border-ivory/20 bg-transparent pb-1.5 text-[15px] text-ivory outline-none focus:border-gold';
const lab = 'block text-[10px] tracking-[0.22em] text-bone/50 uppercase';

/** One photo slot: click to choose a file, or drag one onto it */
function PhotoSlot({ view, img, busy, onFile, onRemove }: { view: View; img: string | null; busy: boolean; onFile: (f: File) => void; onRemove?: () => void }) {
  const [over, setOver] = useState(false);
  const label = view[0].toUpperCase() + view.slice(1);
  return (
    <div>
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) onFile(file);
        }}
        className={`group relative block aspect-[3/4] cursor-pointer overflow-hidden border border-dashed bg-noir transition-colors focus-within:border-gold ${
          over ? 'border-gold bg-gold/10' : 'border-ivory/20 hover:border-gold'
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt={`${label} view`} className={`absolute inset-0 h-full w-full object-cover transition-opacity ${over || busy ? 'opacity-30' : ''}`} />}
        <span
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center transition-opacity ${
            img && !over && !busy ? 'bg-noir/70 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100' : ''
          }`}
        >
          {busy ? (
            <span className="text-[11px] tracking-[0.2em] text-gold uppercase">Uploading…</span>
          ) : (
            <>
              <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-6 w-6 ${over ? 'text-gold' : 'text-bone/50 group-hover:text-gold'}`} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4" />
                <path d="M7 9l5-5 5 5" />
                <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
              </svg>
              <span className="text-[11px] tracking-[0.2em] text-ivory uppercase">{over ? 'Drop to upload' : img ? `Replace ${view}` : `Add ${view}`}</span>
              {!over && <span className="text-[11px] text-bone/50">Click to choose, or drag a photo here</span>}
            </>
          )}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`${label} photo`}
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // so the same file can be chosen again
            if (file) onFile(file);
          }}
        />
      </label>
      <div className="mt-2 flex items-center justify-between text-[11px] text-bone/50">
        <span>{label}</span>
        {onRemove && (
          <button type="button" className="hover:text-ivory" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

function PieceEditor({ piece, cloudinary, onDone, nextNo }: { piece: ServerPiece | null; cloudinary: boolean; onDone: () => void; nextNo: string }) {
  const [f, setF] = useState<PieceInput>(() => (piece ? { ...blank, ...piece, details: piece.details.length ? piece.details : blank.details, images: piece.images ?? {} } : { ...blank, no: nextNo }));
  const [sizes, setSizes] = useState(f.sizes.join(', '));
  const [busy, setBusy] = useState<View | 'save' | null>(null);
  const set = <K extends keyof PieceInput>(k: K, v: PieceInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const upload = async (view: View, file: File) => {
    if (!file.type.startsWith('image/')) return notify.err('That is not a photo', 'Use a JPG, PNG or WebP image.');
    setBusy(view);
    try {
      const url = await uploadImage(await readPhoto(file, 2000), 'pieces');
      setF((x) => ({ ...x, images: { ...(x.images ?? {}), [view]: url } }));
      notify.ok(`${view[0].toUpperCase() + view.slice(1)} photo ready`, cloudinary ? 'Uploaded to Cloudinary as WebP. Save the piece to keep it.' : 'Kept in the database (Cloudinary is not set). Save the piece to keep it.');
    } catch (e) {
      notify.err('The photo did not upload', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    const list = sizes.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    if (f.name.trim().length < 2) return notify.err('The piece needs a name');
    if (!list.length) return notify.err('Add at least one size');
    const body: PieceInput = { ...f, sizes: list, soldOut: f.soldOut.filter((s) => list.includes(s)), details: f.details.filter((d) => d.title.trim() || d.body.trim()) };
    setBusy('save');
    try {
      if (piece) await updatePiece(piece.slug, body);
      else await createPiece(body);
      await refreshCatalogue();
      onDone();
    } catch {
      /* the toast already says why */
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <H
        aside={
          <div className="flex gap-2">
            <SmallBtn onClick={onDone}>Back</SmallBtn>
            <SmallBtn tone="gold" onClick={save} disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving…' : 'Save piece'}
            </SmallBtn>
          </div>
        }
      >
        {piece ? piece.name : 'New piece'}
      </H>

      <Card className="p-6 md:p-8">
        <p className={lab}>Photographs · front, left, back, right</p>
        <p className="mt-2 text-[13px] text-bone/45">Portrait 3:4 works best. Each photo is resized in your browser to WebP (2000 px) before it is sent.</p>
        {/* Dropping a file beside a slot must not open it in the tab and lose the edits */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}>
          {VIEWS.map((v) => (
            <PhotoSlot
              key={v}
              view={v}
              img={pieceImage({ images: f.images, photos: piece?.photos }, v)}
              busy={busy === v}
              onFile={(file) => upload(v, file)}
              onRemove={f.images?.[v] ? () => setF((x) => ({ ...x, images: { ...(x.images ?? {}), [v]: '' } })) : undefined}
            />
          ))}
        </div>
      </Card>

      <Card className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
        <label className={lab}>
          Name
          <input className={field} value={f.name} onChange={(e) => set('name', e.target.value)} />
        </label>
        <div className="grid grid-cols-[80px_1fr_90px] gap-4">
          <label className={lab}>
            Nº
            <input className={field} value={f.no} onChange={(e) => set('no', e.target.value)} />
          </label>
          <label className={lab}>
            Kind
            <select className={`${field} [&>option]:bg-noir`} value={f.kind} onChange={(e) => set('kind', e.target.value as Kind)}>
              {(['Tailoring', 'Evening', 'Ceremony'] as Kind[]).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className={lab}>
            Colour
            <input type="color" className="mt-2 h-8 w-full cursor-pointer bg-transparent" value={f.tint} onChange={(e) => set('tint', e.target.value)} />
          </label>
        </div>
        <label className={lab}>
          Cloth
          <input className={field} value={f.cloth} onChange={(e) => set('cloth', e.target.value)} placeholder="Wool barathea, silk satin facings" />
        </label>
        <label className={lab}>
          One line (lists)
          <input className={field} value={f.line} onChange={(e) => set('line', e.target.value)} />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className={lab}>
            Ready-to-wear (BDT)
            <input type="number" className={field} value={f.rtw || ''} onChange={(e) => set('rtw', Number(e.target.value) || 0)} />
          </label>
          <label className={lab}>
            To measure (BDT)
            <input type="number" className={field} value={f.mtm || ''} onChange={(e) => set('mtm', Number(e.target.value) || 0)} />
          </label>
          <label className={lab}>
            Edition of
            <input type="number" className={field} value={f.edition || ''} onChange={(e) => set('edition', Number(e.target.value) || 0)} />
          </label>
        </div>
        <div>
          <label className={lab}>
            Sizes (comma separated)
            <input className={field} value={sizes} onChange={(e) => setSizes(e.target.value)} />
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes
              .split(/[,\s]+/)
              .filter(Boolean)
              .map((s) => {
                const out = f.soldOut.includes(s);
                return (
                  <button key={s} onClick={() => set('soldOut', out ? f.soldOut.filter((x) => x !== s) : [...f.soldOut, s])} className={`px-2.5 py-1 text-[11px] ${out ? 'border border-[#c2566a]/50 text-[#d98597] line-through' : 'border border-ivory/20 text-bone/70'}`}>
                    {s}
                  </button>
                );
              })}
            <span className="self-center text-[11px] text-bone/40">tap a size to mark it sold out</span>
          </div>
        </div>
        <label className={`${lab} md:col-span-2`}>
          The story (opening paragraph)
          <textarea rows={3} className={`${field} resize-none leading-relaxed`} value={f.story} onChange={(e) => set('story', e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <p className={lab}>Details</p>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {f.details.map((d, i) => (
              <div key={i} className="border border-ivory/10 p-3">
                <input className={field} placeholder="Title (e.g. The lapel)" value={d.title} onChange={(e) => set('details', f.details.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
                <textarea rows={2} className={`${field} resize-none text-[14px]`} placeholder="One or two sentences" value={d.body} onChange={(e) => set('details', f.details.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          {f.details.length < 6 && (
            <button className="mt-3 text-[11px] tracking-[0.2em] text-gold uppercase" onClick={() => set('details', [...f.details, { title: '', body: '' }])}>
              + Add a detail
            </button>
          )}
        </div>
        <label className={lab}>
          Composition
          <input className={field} value={f.composition} onChange={(e) => set('composition', e.target.value)} />
        </label>
        <label className={lab}>
          Care
          <input className={field} value={f.care} onChange={(e) => set('care', e.target.value)} />
        </label>
        <label className="flex items-center gap-3 text-[14px] text-ivory md:col-span-2">
          <input type="checkbox" checked={f.published} onChange={(e) => set('published', e.target.checked)} className="h-4 w-4 accent-[#dcaf6a]" />
          Published — visible on the shop
        </label>
      </Card>

      {piece && (
        <div className="flex justify-end">
          <SmallBtn
            onClick={() =>
              deletePiece(piece.slug).then(
                () => {
                  refreshCatalogue();
                  onDone();
                },
                () => {},
              )
            }
          >
            Delete piece
          </SmallBtn>
        </div>
      )}
    </div>
  );
}
