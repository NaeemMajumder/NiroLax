/** Path to a file in /public that also works in the static preview export. */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_ASSET_BASE ?? '/'}${path.replace(/^\//, '')}`;
