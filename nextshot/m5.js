/* M5 tab dropdown and "I'm interested" form.
   Submissions go to a Google Apps Script web app, which stores them in a Sheet and emails the owner.
   Paste the web app URL below once it is deployed. */
(function () {
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbwFDySussMB-KxwKbFcCjNOJPPlaGD4QeXhaXxV5NL1_mgqj-72fRAMEyKISdOZEtA/exec";

  var tab = document.querySelector(".m5tab");
  if (!tab) return;
  var btn = tab.querySelector(".m5btn");
  var menu = tab.querySelector(".m5menu");

  function closeMenu() { menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", function (e) { if (!tab.contains(e.target)) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  var SOURCES = ["Friend or family", "Instagram", "Reddit", "YouTube", "TikTok", "Search engine", "Other"];
  var countries = [];
  try {
    var dn = new Intl.DisplayNames(["en-GB"], { type: "region" });
    for (var a = 65; a <= 90; a++) for (var b = 65; b <= 90; b++) {
      var code = String.fromCharCode(a, b), n = dn.of(code);
      if (n && n !== code && n !== "Unknown Region") countries.push(n);
    }
    countries.sort(function (x, y) { return x.localeCompare(y, "en-GB"); });
  } catch (e) { countries = ["United Kingdom", "United States", "Singapore", "Australia", "Canada"]; }

  function opts(list, ph) {
    return '<option value="" disabled selected>' + ph + "</option>" +
      list.map(function (v) { return "<option>" + v + "</option>"; }).join("");
  }

  var dlg = document.createElement("dialog");
  dlg.className = "m5dlg";
  dlg.setAttribute("aria-labelledby", "m5title");
  dlg.innerHTML =
    '<form method="dialog" id="m5form" novalidate>' +
      '<h2 id="m5title">Join the M5 Alpha</h2>' +
      "<p>The Next Shot shot timer for the M5StickC Plus is coming. Tell us a little and we will be in touch when Alpha testing opens.</p>" +
      '<label for="m5name">Name</label><input id="m5name" type="text" autocomplete="name" maxlength="80" required>' +
      '<label for="m5country">Country</label><select id="m5country" required>' + opts(countries, "Choose your country") + "</select>" +
      '<label for="m5src">Where did you hear about us?</label><select id="m5src" required>' + opts(SOURCES, "Choose one") + "</select>" +
      '<input id="m5srcother" type="text" maxlength="80" placeholder="Tell us where" hidden style="margin-top:8px">' +
      '<fieldset><legend>How should we contact you?</legend>' +
        '<div class="m5radios"><label><input type="radio" name="m5via" value="Email" checked> Email</label>' +
        '<label><input type="radio" name="m5via" value="Phone"> Phone</label></div></fieldset>' +
      '<label for="m5contact" id="m5clabel">Email address</label><input id="m5contact" type="email" autocomplete="email" maxlength="120" required>' +
      '<div class="m5hp" aria-hidden="true"><label>Leave this empty<input id="m5hp" type="text" tabindex="-1" autocomplete="off"></label></div>' +
      '<p class="m5privacy">Used only to contact you about the Alpha test. We never share it.</p>' +
      '<p class="m5err" id="m5err" role="alert"></p>' +
      '<div class="m5row"><button type="button" class="m5cancel" id="m5cancel">Cancel</button><button type="submit" class="btn" id="m5send">Count me in</button></div>' +
    "</form>" +
    '<div class="m5done" id="m5done" hidden><h2>Thank you</h2><p>You are on the list. We will get in touch when the M5 Alpha opens.</p><button type="button" class="btn" id="m5close">Close</button></div>';
  document.body.appendChild(dlg);

  var $ = function (id) { return document.getElementById(id); };
  var form = $("m5form"), err = $("m5err"), send = $("m5send");

  function setVia() {
    var phone = form.querySelector('input[name="m5via"]:checked').value === "Phone";
    var c = $("m5contact");
    c.type = phone ? "tel" : "email";
    c.autocomplete = phone ? "tel" : "email";
    c.placeholder = phone ? "+65 9123 4567" : "you@example.com";
    $("m5clabel").textContent = phone ? "Phone number (with country code)" : "Email address";
  }
  form.addEventListener("change", function (e) {
    if (e.target.name === "m5via") setVia();
    if (e.target.id === "m5src") $("m5srcother").hidden = e.target.value !== "Other";
  });
  setVia();

  function openForm() {
    closeMenu();
    form.hidden = false; $("m5done").hidden = true; err.textContent = "";
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  }
  function closeForm() { if (dlg.close) dlg.close(); else dlg.removeAttribute("open"); }
  document.querySelectorAll(".m5interest").forEach(function (b) { b.addEventListener("click", openForm); });
  $("m5cancel").addEventListener("click", closeForm);
  $("m5close").addEventListener("click", closeForm);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.textContent = "";
    var via = form.querySelector('input[name="m5via"]:checked').value;
    var d = {
      name: $("m5name").value.trim(),
      country: $("m5country").value,
      source: $("m5src").value === "Other" ? ("Other: " + $("m5srcother").value.trim()) : $("m5src").value,
      via: via,
      contact: $("m5contact").value.trim(),
      website: $("m5hp").value
    };
    if (!d.name || !d.country || !d.source || d.source === "Other: ") { err.textContent = "Please fill in every field."; return; }
    if (via === "Email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.contact)) { err.textContent = "That email address does not look right."; return; }
    if (via === "Phone" && !/^\+?[0-9 ()-]{7,20}$/.test(d.contact)) { err.textContent = "That phone number does not look right."; return; }
    if (d.website) { $("m5done").hidden = false; form.hidden = true; return; } /* bot: pretend success */
    if (ENDPOINT.indexOf("http") !== 0) { err.textContent = "Sign-up is not switched on yet. Please try again soon."; return; }
    send.disabled = true; send.textContent = "Sending…";
    /* text/plain keeps this a simple request, so no CORS pre-flight; the reply is opaque. */
    fetch(ENDPOINT, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) })
      .then(function () { form.hidden = true; $("m5done").hidden = false; form.reset(); setVia(); $("m5srcother").hidden = true; })
      .catch(function () { err.textContent = "Could not send. Check your connection and try again."; })
      .then(function () { send.disabled = false; send.textContent = "Count me in"; });
  });
})();
