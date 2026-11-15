// Small touches that borrow from the app. Plain JavaScript, no libraries. Everything is skipped for visitors who ask
// their device for reduced motion, and the page works without any of it.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // 1. The greeting, like the app's ("Late night", "Morning").
  var greet = $("#greet");
  if (greet) {
    var h = new Date().getHours();
    var band = h < 5 ? "Late night" : h < 12 ? "Morning" : h < 17 ? "Afternoon" : h < 21 ? "Evening" : "Late night";
    var quip = h < 5 ? "Still dialling in?" : h < 12 ? "Pulling a shot?" : h < 17 ? "Time for another?" : h < 21 ? "One more before bed?" : "Still dialling in?";
    greet.textContent = band + ". " + quip;
  }

  // 2. The launch glass: it fills, tips, and the coffee pours down to show the page. Once per visit, and skippable.
  var launch = $("#launch");
  if (launch && !reduce && !sessionStorage.getItem("nextshot-seen")) {
    sessionStorage.setItem("nextshot-seen", "1");
    document.documentElement.classList.add("launching");
    launch.classList.add("on");
    var done = function () {
      launch.classList.remove("on", "pour");
      document.documentElement.classList.remove("launching");
    };
    setTimeout(function () { launch.classList.add("pour"); }, 1500);
    setTimeout(done, 2500);
    launch.addEventListener("click", done);
  }

  // 3. The coach demo: set the shot time and rating, and the coach answers like the app does.
  var demo = $("#demo");
  if (demo) {
    var time = $("#time", demo), out = {
      secs: $("#secs", demo), ring: $("#ring", demo), fill: $("#fill", demo), move: $("#move", demo),
      grind: $("#grind", demo), why: $("#why", demo), stars: demo.querySelectorAll(".star")
    };
    var rating = 0, base = 9, lo = 24, hi = 30, aim = 27, perMark = 3, max = 45;
    var fmt = function (n) { return (Math.round(n * 2) / 2).toFixed(1); };

    var render = function () {
      var t = +time.value;
      out.secs.textContent = t;
      var state = t < lo ? "fast" : t > hi ? "slow" : "in";
      var colour = state === "fast" ? "#e0b93a" : state === "in" ? "#4caf6a" : "#db5f51";
      var C = 2 * Math.PI * 88;
      out.ring.style.stroke = colour;
      out.ring.style.strokeDasharray = C;
      out.ring.style.strokeDashoffset = C * (1 - t / max);
      out.fill.setAttribute("y", 200 - 200 * (t / max));
      var marks = Math.max(-2, Math.min(2, Math.round(((t - aim) / perMark) * 2) / 2));   // seconds off the aim, in marks; never more than 2 at once
      var next = base + (state === "fast" ? -Math.max(0.5, Math.abs(marks)) : state === "slow" ? Math.max(0.5, Math.abs(marks)) : 0);
      var move, why;
      if (rating >= 4 && state !== "in") {
        move = "Keep it"; next = base;
        why = "Rated " + rating + " at " + t + " s with nothing off, so keep everything. Taste outranks the clock.";
      } else if (state === "in") {
        move = "Keep it";
        why = t + " s is inside the 24 to 30 s band, so keep everything." + (rating ? "" : " Rate it and the coach remembers.");
      } else if (state === "fast") {
        move = "Grind finer";
        why = "Ran fast at " + t + " s, which tastes sour. About " + fmt(Math.abs(marks)) + " marks finer should bring it closer to " + aim + " s.";
      } else {
        move = "Grind coarser";
        why = "Took too long at " + t + " s, which tastes bitter. About " + fmt(Math.abs(marks)) + " marks coarser should bring it closer to " + aim + " s.";
      }
      out.move.textContent = move;
      out.grind.textContent = fmt(base) + (next === base ? "" : "  →  " + fmt(next));
      out.why.textContent = why;
      out.move.className = state === "in" || (rating >= 4) ? "ok" : state === "fast" ? "warn" : "hot";
      for (var i = 0; i < out.stars.length; i++) out.stars[i].classList.toggle("on", i < rating);
    };
    time.addEventListener("input", render);
    Array.prototype.forEach.call(out.stars, function (s, i) {
      s.addEventListener("click", function () { rating = rating === i + 1 ? 0 : i + 1; render(); });
    });
    render();
  }

  // 4. The hero phone leans with the pointer, like the bag tilting.
  var hero = $(".hero");
  var phone = $(".hero .phone");
  if (hero && phone && !reduce && window.matchMedia("(hover: hover)").matches) {
    var raf = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        phone.style.transform = "perspective(900px) rotateY(" + (x * 10).toFixed(2) + "deg) rotateX(" + (-y * 7).toFixed(2) + "deg)";
      });
    });
    hero.addEventListener("pointerleave", function () { phone.style.transform = ""; });
  }

  // 5. Scroll reveals.
  var items = document.querySelectorAll(".feature .wrap > *, .duo-grid figure, .faq details, #demo");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  }

  // 6. Easter egg: tap the cup five times (like the greeting in the app) and it rains beans.
  var cup = $("#cup"), taps = 0, last = 0;
  if (cup) {
    cup.addEventListener("click", function (e) {
      e.preventDefault();
      var now = Date.now();
      taps = now - last < 1500 ? taps + 1 : 1; last = now;
      cup.classList.remove("jiggle"); void cup.offsetWidth; cup.classList.add("jiggle");
      if (taps >= 5) { taps = 0; rain(); }
    });
  }
  function rain() {
    var toast = $("#toast");
    if (toast) { toast.classList.add("show"); setTimeout(function () { toast.classList.remove("show"); }, 3600); }
    if (reduce) return;
    var box = document.createElement("div"); box.className = "rain"; document.body.appendChild(box);
    for (var i = 0; i < 46; i++) {
      var b = document.createElement("i");
      b.style.left = Math.random() * 100 + "vw";
      b.style.animationDelay = (Math.random() * 1.4).toFixed(2) + "s";
      b.style.animationDuration = (2.2 + Math.random() * 1.8).toFixed(2) + "s";
      b.style.setProperty("--s", (0.7 + Math.random() * 0.9).toFixed(2));
      b.style.setProperty("--r", Math.round(Math.random() * 360) + "deg");
      box.appendChild(b);
    }
    setTimeout(function () { box.remove(); }, 5000);
  }
})();
