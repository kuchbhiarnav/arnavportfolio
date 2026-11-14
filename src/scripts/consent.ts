/**
 * Consent-gated analytics. Google Analytics is not requested, and no cookie is set, until the visitor accepts.
 * Never sent to analytics: contact messages or any free text.
 */
const KEY = 'archive:analytics-consent';
const INTERNAL = 'archive:internal'; // set to "1" in your own browser to exclude your visits

const banner = document.getElementById('consent') as HTMLElement | null;
const gaId = banner?.dataset.gaId;

function read(k: string): string | null { try { return localStorage.getItem(k); } catch { return null; } }
function write(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* storage may be blocked; choice then lasts one page */ } }

export {}; // makes this a module so the global augmentation below is legal
declare global { interface Window { dataLayer: unknown[]; gtag: (...a: unknown[]) => void; __gaLoaded?: boolean } }

// Local development and previews never reach your real analytics property.
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.hostname.endsWith('.localhost');

function loadAnalytics() {
  if (!gaId || window.__gaLoaded || LOCAL || read(INTERNAL) === '1') return;
  window.__gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', gaId, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(s);
}

function clearAnalyticsCookies() {
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0]?.trim();
    if (name && (name.startsWith('_ga') || name === '_gid')) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

function setOffset() {
  const h = banner && !banner.hidden ? banner.offsetHeight + 8 : 0;
  document.documentElement.style.setProperty('--bottom-ui', `${h}px`);
}

function show(focus = false) {
  if (!banner) return;
  banner.hidden = false;
  setOffset();
  if (focus) (banner.querySelector('button') as HTMLButtonElement | null)?.focus();
}
function hide() { if (banner) banner.hidden = true; setOffset(); }

const stored = read(KEY);
if (read(INTERNAL) === '1') hide();
else if (stored === 'granted') loadAnalytics();
else if (stored !== 'denied') show();

banner?.querySelectorAll<HTMLButtonElement>('[data-consent]').forEach((b) =>
  b.addEventListener('click', () => {
    const choice = b.dataset.consent as 'granted' | 'denied';
    write(KEY, choice);
    hide();
    if (choice === 'granted') loadAnalytics(); else clearAnalyticsCookies();
  }),
);
document.querySelectorAll('[data-open-consent]').forEach((el) => el.addEventListener('click', () => show(true)));
window.addEventListener('resize', setOffset);

// Names only, never content. Active only after consent (window.gtag exists only then).
document.addEventListener('click', (e) => {
  const t = (e.target as Element | null)?.closest<HTMLElement>('[data-track]');
  if (t && typeof window.gtag === 'function') window.gtag('event', t.dataset.track, { page_path: location.pathname });
});
document.addEventListener('archive:track', (e) => {
  if (typeof window.gtag === 'function') window.gtag('event', (e as CustomEvent<string>).detail, { page_path: location.pathname });
});
