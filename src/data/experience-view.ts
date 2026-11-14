import { roles, education } from './experience';
export { roles, education };

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fm = (ym: string) => { const [y, m] = ym.split('-').map(Number); return `${SHORT[(m ?? 1) - 1]} ${y}`; };
export const formatRangeShort = (s: string, e: string | null) => `${fm(s)} – ${e ? fm(e) : 'present'}`;
