// Put the desk model on a real surface with the phone's own AR viewer: Quick Look on iPhone and iPad,
// Scene Viewer on Android. Safari can't find surfaces itself, so this is the way to get real placement.
import { isDark } from './sky-bridge.js';

const ios = document.createElement('a').relList?.supports?.('ar') === true;
const android = /android/i.test(navigator.userAgent) && !/wv\)|FBAN|FBAV|Instagram|Line\//.test(navigator.userAgent);
export const canPlace = ios || android;

const BANNER = '#callToAction=Open%20the%20site&checkoutTitle=Shea%20Wilson&checkoutSubtitle=Design%20engineer';

export function placeOnDesk() {
  const tone = isDark() ? 'dark' : 'light';
  const model = (ext) => new URL(`assets/models/desk-${tone}.${ext}?v=2`, location.href).href;
  if (ios) {
    const a = document.createElement('a');
    a.rel = 'ar';
    a.href = model('usdz') + BANNER;
    a.hidden = true;
    a.appendChild(document.createElement('img')); // Quick Look only opens from a link that holds an image
    a.addEventListener('message', (e) => { if (e.data === '_apple_ar_quicklook_button_tapped') location.href = '../'; });
    document.body.appendChild(a);
    a.click();
    return true;
  }
  if (android) {
    const fallback = encodeURIComponent(new URL('desk.html', location.href).href);
    location.href = `intent://arvr.google.com/scene-viewer/1.2?file=${encodeURIComponent(model('glb'))}&mode=ar_preferred&title=Shea%20Wilson`
      + `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`;
    return true;
  }
  return false;
}
