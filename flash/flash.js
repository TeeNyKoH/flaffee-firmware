// Shot timer setup page: checklist, browser check, step reveal, OS tabs, copy buttons, help picker, confetti.
(() => {
  // Always open at the top: no jumping back to where you were, or to a section left in the address (#browser)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  scrollTo(0, 0);
  addEventListener('load', () => scrollTo(0, 0));

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  // Toast
  const toast = $('#toast');
  let toastTimer;
  function say(text) {
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('on'), 2200);
  }

  // Which computer and browser
  const ua = navigator.userAgent;
  const isWin = /Windows/.test(ua);
  const isPhone = /iPhone|iPad|Android/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  const canFlash = 'serial' in navigator && !isPhone;
  const check = $('#browserCheck');
  if (canFlash) {
    check.textContent = 'Your browser can flash. You are good to go.';
    check.classList.add('yes');
    const b = $('input[data-key="browser"]');
    b.checked = true;
  } else if (isPhone) {
    check.textContent = 'You are on a phone or tablet. Open this page on a computer to flash.';
    check.classList.add('no');
  } else {
    check.textContent = 'This browser cannot flash. Open this page in Chrome or Edge, or use the manual way.';
    check.classList.add('no');
  }

  // Checklist, saved on this computer
  const boxes = $$('#checklist input');
  function meter() {
    const n = boxes.filter(b => b.checked).length;
    $('#meterFill').style.width = (n / boxes.length * 100) + '%';
    $('#meterText').textContent = n === boxes.length ? 'All set. Off you go!' : `${n} of ${boxes.length} ready`;
  }
  boxes.forEach(b => {
    if (store.get('flash.' + b.dataset.key) === '1') b.checked = true;
    b.addEventListener('change', () => {
      store.set('flash.' + b.dataset.key, b.checked ? '1' : '0');
      meter();
      if (boxes.every(x => x.checked)) { say('Ready to flash'); burst(60); }
    });
  });
  meter();

  // OS tabs (port picture and manual commands), starting on this computer's system
  function pickOS(os) {
    $$('.porttab, .ostab').forEach(t => t.classList.toggle('on', t.dataset.os === os));
    $$('.portlist').forEach(l => l.classList.toggle('on', l.dataset.os === os));
    $$('.manual [data-os]:not(.ostab)').forEach(e => e.classList.toggle('hide', e.dataset.os !== os));
  }
  $$('.porttab, .ostab').forEach(t => t.addEventListener('click', () => pickOS(t.dataset.os)));
  pickOS(isWin ? 'win' : 'mac');

  // Copy buttons
  $$('.copy').forEach(btn => btn.addEventListener('click', async () => {
    const target = btn.dataset.copy ? $(btn.dataset.copy) : btn.parentElement.querySelector('code');
    try { await navigator.clipboard.writeText(target.textContent); say('Copied. Paste it in the Terminal'); }
    catch { say('Select the text and copy it'); }
  }));

  // Steps fade in as you reach them; the hero stick shows each step on its screen
  const scr = $('[data-scr]'), sub = $('[data-scr-sub]');
  const screens = [['READY', '00:00'], ['POWER', 'ON'], ['USB', '<->'], ['FLASH', '64%'], ['WRITE', '99%'], ['READY', '00:00']];
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('seen');
    const i = $$('#browser .step').indexOf(e.target);
    if (i >= 0) { scr.textContent = screens[i + 1][0]; sub.textContent = screens[i + 1][1]; }
  }), { threshold: 0.4 });
  $$('.step').forEach(s => io.observe(s));

  // Hero stick ticks like a shot timer
  let t = 0;
  setInterval(() => {
    if (scr.textContent !== 'READY') return;
    t = (t + 1) % 31;
    sub.textContent = '00:' + String(t).padStart(2, '0');
  }, 1000);

  // Progress rail
  const rail = $$('.rail a');
  const sections = rail.map(a => document.getElementById(a.dataset.for));
  const railIO = new IntersectionObserver(() => {
    const mid = innerHeight / 2;
    let current = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < mid) current = i; });
    rail.forEach((a, i) => { a.classList.toggle('on', i === current); a.classList.toggle('done', i < current); });
  }, { threshold: [0, 0.5, 1] });
  sections.forEach(s => s && railIO.observe(s));

  // Help picker
  function showFix(id) {
    $$('#picker button').forEach(b => b.classList.toggle('on', b.dataset.fix === id));
    $$('.fix').forEach(f => f.classList.toggle('on', f.dataset.fix === id));
  }
  $$('#picker button').forEach(b => b.addEventListener('click', () => showFix(b.dataset.fix)));
  $$('a[data-fix]').forEach(a => a.addEventListener('click', () => showFix(a.dataset.fix)));

  // Success
  $('#itWorked').addEventListener('click', () => { burst(180); say('Brewed to perfection. Now pair it with the app'); setTimeout(() => $('#pair').scrollIntoView({ behavior: 'smooth' }), 900); });

  // Coffee-coloured confetti
  const cv = $('#confetti'), cx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let bits = [], running = false;
  function burst(n) {
    if (reduce) return;
    cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
    const colours = ['#db5f51', '#e9c18a', '#7a4a2c', '#f26b2b', '#3f9d63'];
    for (let i = 0; i < n; i++) bits.push({
      x: innerWidth / 2, y: innerHeight * 0.6, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 16 - 6,
      r: Math.random() * 6 + 4, c: colours[i % colours.length], a: Math.random() * 6, life: 1, bean: Math.random() < 0.35,
    });
    if (!running) { running = true; requestAnimationFrame(tick); }
  }
  function tick() {
    cx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    cx.clearRect(0, 0, innerWidth, innerHeight);
    bits.forEach(b => {
      b.vy += 0.45; b.x += b.vx; b.y += b.vy; b.a += 0.15; b.life -= 0.008;
      cx.save(); cx.globalAlpha = Math.max(b.life, 0); cx.translate(b.x, b.y); cx.rotate(b.a); cx.fillStyle = b.c;
      if (b.bean) { cx.beginPath(); cx.ellipse(0, 0, b.r, b.r * 0.65, 0, 0, Math.PI * 2); cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.moveTo(-b.r * 0.7, 0); cx.quadraticCurveTo(0, b.r * 0.3, b.r * 0.7, 0); cx.stroke(); }
      else cx.fillRect(-b.r / 2, -b.r / 4, b.r, b.r / 2);
      cx.restore();
    });
    bits = bits.filter(b => b.life > 0 && b.y < innerHeight + 40);
    if (bits.length) requestAnimationFrame(tick); else { running = false; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }
})();
