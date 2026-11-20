/* M5 page: the animated stick, the Lock Screen card and the detection waveform. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Waveform */
  var wave = $("wave");
  if (wave) {
    var pts = [], x;
    function vib(from, to, amp) { for (x = from; x < to; x += 5) pts.push(x + "," + (110 + (((x / 5) | 0) % 2 ? -amp : amp) * (0.7 + 0.3 * Math.sin(x)))); }
    pts.push("20,110", "100,110");
    vib(104, 400 - 60, 40);   /* start and main flow */
    vib(340, 450, 8);         /* pre-infusion pause: quiet but not over */
    vib(450, 620, 40);        /* main flow resumes */
    pts.push("626,110", "700,110");
    wave.setAttribute("d", "M" + pts.join(" L"));
  }

  /* Stick and Lock Screen cycle: 12 s loop. The stick has five screens; only one is shown at a time. */
  var screens = {}, list = document.querySelectorAll(".heroscr");
  if (!list.length) return;
  list.forEach(function (e) { screens[e.getAttribute("data-s")] = e; });
  var latime = $("latime"), lasub = $("lasub");
  var T = { ready: 1500, check: 2500, brew: 8500, done: 10500, end: 12500 };
  function colour(s) { return s < 18 ? "#ffffff" : s < 22 ? "#ffff00" : s < 27 ? "#00ff00" : "#ff0000"; }
  var SEG = [["#008000", 0, 60], ["#ffff00", 60, 74], ["#00ff00", 74, 92], ["#ff0000", 92, 100]];
  function brewing(s) {
    var fill = Math.min(100, s * 3.33), html = "";
    var lcd = screens.BREWING.querySelector(".lcd");
    SEG.forEach(function (g) { if (g[1] < fill) { var b = Math.min(g[2], fill); html += '<span class="lt barseg" style="left:' + (8 + 224 * g[1] / 100) + 'px;top:106px;width:' + (224 * (b - g[1]) / 100) + 'px;background:' + g[0] + '"></span>'; } });
    lcd.querySelectorAll(".barseg").forEach(function (n) { n.remove(); });
    lcd.insertAdjacentHTML("beforeend", html);
    var big = lcd.querySelector(".big");
    big.firstChild.nodeValue = s.toFixed(1); big.style.color = colour(s);
    lcd.querySelector(".lt[style*='top:86px']").textContent = s >= 22 ? "22 s +" : "";
  }
  var shown = "";
  function render(t) {
    var state, s = 0;
    if (t < T.ready) state = "READY";
    else if (t < T.check) state = "CHECKING";
    else if (t < T.brew) { state = "BREWING"; s = (t - T.check) / (T.brew - T.check) * 26.4; }
    else if (t < T.done) state = "DONE";
    else state = "LOGGED";
    if (state !== shown) { for (var k in screens) screens[k].hidden = k !== state; shown = state; }
    if (state === "BREWING") brewing(s);
    if (latime) {
      if (state === "BREWING") { latime.textContent = Math.floor(s) + " s"; lasub.textContent = "Pulling a shot"; }
      else if (state === "DONE" || state === "LOGGED") { latime.textContent = "25 s"; lasub.textContent = state === "DONE" ? "Tap to log this shot" : "Shot logged"; }
      else { latime.textContent = "0 s"; lasub.textContent = "Ready"; }
    }
  }
  if (still) { render(T.done - 500); return; }
  var t0 = Date.now();
  setInterval(function () { render((Date.now() - t0) % T.end); }, 80);
})();
