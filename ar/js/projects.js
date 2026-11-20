// The site's details and the work, with no three.js, so any page can use them
const ROOT = new URL('../../', import.meta.url);
export const asset = (p) => new URL(p, ROOT).href;

export const SITE = {
  name: 'Shea Wilson',
  role: 'Design engineer',
  email: 'design@sheawilson.uk',
  url: 'https://sheawilson.uk',
  linkedin: 'https://www.linkedin.com/in/sheawilson0/',
};

export const CARD = { w: 85, h: 55 };

// The sky the site wears (assets/js/sky.js), at midday and at night, for anything that can't read it live:
// the exported desk models and the printed card. Pages read the live sky from sky-bridge.js.
export const SKY = {
  day: { top: '#9ec0e9', mid: '#cdd9e9', low: '#f9ede2', glow: '#fff1e2', ink: '#0a0a0a', dark: false },
  night: { top: '#0a1631', mid: '#12264b', low: '#1c3159', glow: '#29407a', ink: '#f2f0eb', dark: true },
};

// The homepage's four cards, in its order. Copy is the homepage's and the case studies' own.
export const PROJECTS = [
  {
    id: 'snapshot', name: 'Smoking Snapshot', label: 'Smoking Ends Here · Champs and NHS', status: '1,000+ uses',
    tone: '#ed1652', colors: ['#3a17e0', '#ed1652', '#ff6a1a'], href: asset('snapshot.html'),
    line: 'A one-minute calculator that shows people what “only socially” adds up to over a year. People found it through paid social and used it on their phones or on iPads at events.',
  },
  {
    id: 'quit28', name: 'Quit28', label: 'Smoking Ends Here · Champs and NHS', status: 'Live now',
    tone: '#00a7fa', colors: ['#00a7fa', '#5cc8ff', '#ff2d87'], href: asset('quit28.html'),
    line: 'A 28-day quit plan that runs in the browser. Pick a first day, log each smoke-free day, and open one small tip or tool a day.',
  },
  {
    id: 'jumpstart', name: 'JumpStart', label: 'Agency reporting product', status: 'In pilot',
    tone: '#4fae86', colors: ['#0b5c45', '#4fae86', '#8fd4b4'], href: asset('jumpstart.html'),
    line: 'Paid media reporting that explains itself. Clients get a plain-English read of what changed, why it matters and what happens next. The agency runs every account from one desk.',
  },
  {
    id: 'shipped', name: 'Shipped', label: 'Everything I’ve shipped', status: 'Since August', cta: 'See what I’ve shipped',
    tone: '#f6c93a', colors: ['#f6c93a', '#ff9455', '#9ec0e9'], href: asset('shipped/'),
    line: 'Everything I’ve shipped, newest last. Pip is the sprite I drew frame by frame for a PowerPoint add-in. The butterfly is Meridian, the dashboard I built for my day.',
  },
];

// A little more on each, for the project panel. Every word comes from the homepage or the case study.
const DETAILS = {
  snapshot: {
    media: ['assets/media/snapshot/phone-open.webp', 'assets/media/snapshot/phone-results.webp', 'assets/media/snapshot/field-ipad.webp'],
    stats: [['1,000+', 'snapshots completed'], ['41,904', 'clicks from paid social'], ['52%', 'said they’d rethink how much they smoke']],
    facts: [['Role', 'UX, build and reporting'], ['Client', 'Smoking Ends Here, for Champs and the NHS'], ['When', 'May to September 2026']],
    live: 'https://snapshot.smokingendshere.com/',
  },
  quit28: {
    media: ['assets/media/quit28/phone-welcome.webp', 'assets/media/quit28/phone-day-1-logged.webp', 'assets/media/quit28/phone-craving-timer.webp'],
    stats: [['40', 'quit dates saved in the first week'], ['17', 'smoke-free days logged'], ['173', 'saw the welcome page']],
    facts: [['Role', 'UX and visual design, build, film and reporting'], ['Client', 'Smoking Ends Here, for Champs and the NHS'], ['When', 'August to October 2026']],
    live: 'https://quit28.smokingendshere.com/',
  },
  jumpstart: {
    media: ['assets/media/jumpstart/brief-light.webp', 'assets/media/jumpstart/desk.webp', 'assets/media/jumpstart/export.webp'],
    stats: [['100', 'prototypes and design labs'], ['9', 'weeks from the handover to a live client page'], ['4', 'ways to send a report']],
    facts: [['Role', 'Product design and build'], ['Client', 'Influential, in pilot with the National Football Museum'], ['When', 'June 2026 to now']],
  },
  shipped: {
    media: ['assets/media/shipped/browser-rooms.webp', 'assets/media/shipped/cadence-v5.webp', 'assets/media/shipped/sky.webp'],
    facts: [['What', 'Apps, tools, films and experiments'], ['Since', 'August 2026']],
  },
};
for (const p of PROJECTS) p.details = DETAILS[p.id];

export const MORE = [
  { id: 'cipher', name: 'Cipher', label: 'Brand, web and app', status: 'Concept', tone: '#0ec980', href: asset('cipher.html'), img: 'assets/media/home/cipher.webp', line: 'A concept AI-first bank.' },
  { id: 'amp', name: 'Amp', label: 'Mobile app', status: 'Concept', tone: '#ff6a2b', href: asset('amp.html'), img: 'assets/media/home/amp.webp', line: 'A concept music player.' },
];
