/** Pages that bring their own screen (no site nav or footer): the payment gateway and the Atelier Console. */
export const bareRoute = (path: string) => path.split('/').some((s) => /^(pay|console)(\.html)?$/.test(s));
