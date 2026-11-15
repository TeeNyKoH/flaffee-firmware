// The hero: a draggable 3D bag made of real photos (drag to spin, double-tap to flip, shake it to rattle the beans),
// a coach card that "pulls" a shot, a drifting bag belt and a few drifting beans. Plain JavaScript, no libraries.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var BAGS = [
    { k: "tamana", name: "Tamana" }, { k: "columbia", name: "Columbia" }, { k: "gedeb", name: "Gedeb Lalesa" },
    { k: "eclipse", name: "Eclipse Melon" }, { k: "lychee", name: "Lychee Breeze" }
  ];
  var src = function (k, side) { return "assets/bags/" + k + "-" + side + ".webp"; };

  // Preload so a switch never flashes.
  BAGS.forEach(function (b) { ["front", "back"].forEach(function (s) { new Image().src = src(b.k, s); }); });

  var wrap = $("#bagwrap"), bag = $("#bag3d"), shadow = $("#bagshadow"), hint = $("#hint"), pick = $("#pick");
  var stage = $("#stage"), hero = $(".hero");

  // The belt of bags under the hero.
  var track = $("#track");
  if (track) {
    var html = "";
    for (var n = 0; n < 2; n++) BAGS.concat(BAGS).forEach(function (b) {
      html += '<figure><img src="' + src(b.k, "front") + '" alt="" loading="lazy" height="110"><figcaption>' + b.name + "</figcaption></figure>";
    });
    track.innerHTML = html;
  }

  // Drifting beans behind the hero text.
  if (hero && !reduce) {
    for (var i = 0; i < 9; i++) {
      var d = document.createElement("i"); d.className = "bgbean";
      d.style.left = (Math.random() * 96) + "%"; d.style.top = (Math.random() * 90) + "%";
      d.style.setProperty("--s", (0.6 + Math.random() * 1.1).toFixed(2));
      d.style.animationDuration = (9 + Math.random() * 9).toFixed(1) + "s";
      d.style.animationDelay = (-Math.random() * 12).toFixed(1) + "s";
      hero.appendChild(d);
    }
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
    });
  }

  if (!wrap || !bag) return;

  // 3D bag: the front photo and the back photo, with the front's outline stacked between them for the thickness.
  var D = 13, N = 9, faces = [], edges = [], current = BAGS[0].k;
  function build(k) {
    current = k; bag.innerHTML = ""; faces = []; edges = [];
    for (var i = 0; i < N; i++) {
      var e = new Image(); e.src = src(k, "front"); e.className = "edge"; e.alt = ""; e.draggable = false;
      e.style.transform = "translateZ(" + (-D + (2 * D) * (i / (N - 1))).toFixed(1) + "px)";
      bag.appendChild(e); edges.push(e);
    }
    var f = new Image(); f.src = src(k, "front"); f.className = "face"; f.alt = BAGS.filter(function (b) { return b.k === k; })[0].name + " bag, front"; f.draggable = false;
    f.style.transform = "translateZ(" + (D + 0.5) + "px)";
    var b = new Image(); b.src = src(k, "back"); b.className = "face"; b.alt = ""; b.draggable = false;
    b.style.transform = "rotateY(180deg) translateZ(" + (D + 0.5) + "px)";
    bag.appendChild(f); bag.appendChild(b); faces = [f, b];
  }

  var yaw = 0, vel = 0, pitch = 0, pitchT = 0, sway = 0, flipTo = null, down = false, lastX = 0, lastT = 0, lastUp = 0, moved = 0;
  var lastTouch = Date.now(), visible = true;

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (!down) {
      if (flipTo !== null) { yaw += (flipTo - yaw) * 0.13; if (Math.abs(flipTo - yaw) < 0.25) { yaw = flipTo; flipTo = null; } }
      else { yaw += vel; vel *= 0.95; if (Math.abs(vel) < 0.02) vel = 0; }
    }
    var swayT = (!reduce && Date.now() - lastTouch > 1500 && flipTo === null && Math.abs(vel) < 0.15) ? Math.sin(t / 1300) * 9 : 0;
    sway += (swayT - sway) * 0.05;
    pitch += (pitchT - pitch) * 0.08;
    var y = yaw + sway, c = Math.cos(y * Math.PI / 180);
    bag.style.transform = "rotateX(" + pitch.toFixed(2) + "deg) rotateY(" + y.toFixed(2) + "deg)";
    var lit = (0.62 + 0.38 * Math.abs(c)).toFixed(3);
    for (var i = 0; i < faces.length; i++) faces[i].style.filter = "brightness(" + lit + ")";
    shadow.style.transform = "translateX(-50%) scaleX(" + (0.38 + 0.62 * Math.abs(c)).toFixed(3) + ")";
  }
  build(current);
  requestAnimationFrame(frame);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(wrap);

  wrap.addEventListener("pointerdown", function (e) {
    down = true; moved = 0; lastX = e.clientX; lastT = e.timeStamp; vel = 0; flipTo = null; lastTouch = Date.now();
    try { wrap.setPointerCapture(e.pointerId); } catch (x) {}
    wrap.classList.add("grab");
  });
  wrap.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - lastX, dt = Math.max(1, e.timeStamp - lastT);
    yaw += dx * 0.7; vel = (dx * 0.7) / dt * 16; moved += Math.abs(dx);
    lastX = e.clientX; lastT = e.timeStamp; lastTouch = Date.now();
    if (hint && moved > 8) hint.classList.add("gone");
  });
  function up(e) {
    if (!down) return; down = false; wrap.classList.remove("grab"); lastTouch = Date.now();
    if (moved < 6) {                                        // a tap: two close together flip the bag
      if (e.timeStamp - lastUp < 380) { flipTo = (Math.round(yaw / 180) + 1) * 180; vel = 0; if (hint) hint.classList.add("gone"); }
      lastUp = e.timeStamp;
    }
  }
  wrap.addEventListener("pointerup", up);
  wrap.addEventListener("pointercancel", function () { down = false; wrap.classList.remove("grab"); });
  wrap.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") vel -= 6; if (e.key === "ArrowRight") vel += 6;
    if (e.key === " " || e.key === "Enter") { flipTo = (Math.round(yaw / 180) + 1) * 180; e.preventDefault(); }
  });
  wrap.tabIndex = 0;
  if (stage && !reduce && window.matchMedia("(hover: hover)").matches) {
    stage.addEventListener("pointermove", function (e) {
      var r = stage.getBoundingClientRect(); pitchT = -((e.clientY - r.top) / r.height - 0.5) * 14;
    });
    stage.addEventListener("pointerleave", function () { pitchT = 0; });
  }

  // The bag picker.
  if (pick) {
    BAGS.forEach(function (b, i) {
      var btn = document.createElement("button"); btn.type = "button"; btn.className = "chip-bag" + (i === 0 ? " on" : "");
      btn.setAttribute("aria-label", "Show " + b.name); btn.title = b.name;
      btn.innerHTML = '<img src="' + src(b.k, "front") + '" alt="" height="44">';
      btn.addEventListener("click", function () {
        if (b.k === current) { flipTo = (Math.round(yaw / 180) + 1) * 180; return; }
        Array.prototype.forEach.call(pick.children, function (c) { c.classList.remove("on"); }); btn.classList.add("on");
        build(b.k); yaw = -180; vel = 0; flipTo = 0; lastTouch = Date.now(); if (hint) hint.classList.add("gone");
      });
      pick.appendChild(btn);
    });
  }

  // Shake it: a button, and on phones the real thing (iPhones ask permission first).
  var shakeBtn = $("#shake"), motionOn = false, lastShake = 0;
  function rattle() {
    lastTouch = Date.now();
    if (reduce) return;
    wrap.classList.remove("rattle"); void wrap.offsetWidth; wrap.classList.add("rattle");
    for (var i = 0; i < 9; i++) {
      var p = document.createElement("i"); p.className = "pop";
      p.style.left = (35 + Math.random() * 30) + "%";
      p.style.setProperty("--dx", ((Math.random() - 0.5) * 150).toFixed(0) + "px");
      p.style.setProperty("--dy", (-(60 + Math.random() * 110)).toFixed(0) + "px");
      p.style.setProperty("--r", Math.round(Math.random() * 360) + "deg");
      wrap.appendChild(p); setTimeout((function (el) { return function () { el.remove(); }; })(p), 1300);
    }
  }
  function onMotion(e) {
    var a = e.accelerationIncludingGravity; if (!a) return;
    var m = Math.sqrt((a.x || 0) * (a.x || 0) + (a.y || 0) * (a.y || 0) + (a.z || 0) * (a.z || 0));
    if (m > 24 && Date.now() - lastShake > 900) { lastShake = Date.now(); rattle(); }
  }
  function enableMotion() { if (!motionOn) { motionOn = true; window.addEventListener("devicemotion", onMotion); } }
  if (shakeBtn) shakeBtn.addEventListener("click", function () {
    rattle();
    if (window.DeviceMotionEvent) {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(function (s) { if (s === "granted") enableMotion(); }).catch(function () {});
      } else if (window.matchMedia("(pointer: coarse)").matches) enableMotion();
    }
  });

  // The coach card pulls a shot: the time counts up, the ring fills, then the coach answers.
  var fc = $("#fc"), ring = $("#fcring"), secsEl = $("#fcsecs"), mv = $("#fcmove"), gr = $("#fcgrind"), why = $("#fcwhy");
  if (fc && ring) {
    var C = 2 * Math.PI * 18; ring.style.strokeDasharray = C;
    var msgs = [
      { s: 18, m: "Grind finer", g: "9.0 → 8.0", c: "#e0b93a", w: "Ran fast. Sour risk." },
      { s: 27, m: "Keep it", g: "9.0", c: "#4caf6a", w: "Right in the band." },
      { s: 36, m: "Grind coarser", g: "9.0 → 10.0", c: "#db5f51", w: "Took too long. Bitter risk." },
      { s: 36, m: "Keep it", g: "9.0", c: "#4caf6a", w: "Rated 5 stars. Taste outranks the clock." }
    ];
    var idx = 0;
    function show(m) {
      secsEl.textContent = m.s; ring.style.stroke = m.c; ring.style.strokeDashoffset = C * (1 - m.s / 45);
      mv.textContent = m.m; mv.style.color = m.c; gr.textContent = m.g; why.textContent = m.w; fc.classList.add("answered");
    }
    function pull() {
      var m = msgs[idx % msgs.length]; idx++;
      fc.classList.remove("answered"); mv.textContent = " "; gr.textContent = ""; why.textContent = "Pulling the shot…";
      ring.style.stroke = "#8a7a6c"; ring.style.strokeDashoffset = C;
      var t0 = performance.now(), dur = 1100;
      (function tick(now) {
        var k = Math.min(1, (now - t0) / dur);
        secsEl.textContent = Math.round(m.s * k); ring.style.strokeDashoffset = C * (1 - (m.s * k) / 45);
        if (k < 1) requestAnimationFrame(tick); else show(m);
      })(t0);
    }
    if (reduce) { show(msgs[1]); }
    else { pull(); setInterval(pull, 4200); }
  }
})();
