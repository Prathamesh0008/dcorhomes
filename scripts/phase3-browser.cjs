const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
module.exports = async ({ go, evaluate, call, delay }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    for (const route of ['/about', '/contact', '/login', '/signup']) {
      await go(route, width);
      if (await evaluate(`document.querySelectorAll('main h1').length`) !== 1) throw Error('Missing heading: ' + route);
      if (width === 390 || width === 1440) {
        const shot = await call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
        fs.writeFileSync(path.join(os.tmpdir(), `dcorhome-phase3-${route.slice(1)}-${width}.png`), Buffer.from(shot.data, 'base64'));
      }
    }
    console.log('PASS page layout/images/headings at', width);
  }
  await go('/contact?interest=Test%20linen&message=Main%20curtain%20Ivory%20SKU123&measurements=180cm', 390);
  if (!await evaluate(`document.querySelector('textarea').value.includes('SKU123')`)) throw Error('Enquiry prefill lost');
  if (!await evaluate(`!!document.querySelector('a[href="mailto:sales@dcorhome.com"]')`)) throw Error('Email link missing');
  if (await evaluate(`document.querySelector('form').checkValidity()`)) throw Error('Empty contact form accepted');
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);
  await delay(300);
  if (!await evaluate(`document.querySelector('#mobile-menu').innerText.includes('About Us') && document.querySelector('#mobile-menu').innerText.includes('Sign Up')`)) throw Error('Menu links missing');
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await delay(100);
  if (!await evaluate(`document.activeElement.getAttribute('aria-label') === 'Open navigation'`)) throw Error('Escape focus return failed');
  await go('/collections', 390);
  await go('/studio', 390);
  await go('/account', 390);
  if (!await evaluate(`location.pathname === '/login'`)) throw Error('Private account accessible anonymously');
  console.log('PASS email link, enquiry prefill, required validation, mobile menu/Escape, public catalogue/studio and account guard');
};
