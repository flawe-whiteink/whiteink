// WhiteInk site: downloads wiring + the motion that makes the page feel alive.
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  $("#year").textContent = new Date().getFullYear();

  /* ---------------- Downloads (edit downloads.json, not this file) ---------------- */
  const ua = navigator.userAgent;
  const platform = /Android/i.test(ua) ? "android" : /Windows/i.test(ua) ? "windows" : null;
  const setAll = (sel, text) => $$(sel).forEach((el) => (el.textContent = text));

  fetch("downloads.json", { cache: "no-cache" })
    .then((r) => r.json())
    .then((d) => {
      setAll("[data-version]", d.version.startsWith("v") ? d.version : "v" + d.version);
      setAll("[data-channel]", d.channel);
      setAll("[data-released]", new Date(d.released).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }));
      ["windows", "android"].forEach((key) => {
        const item = d[key];
        setAll(`[data-file="${key}"]`, item.file);
        setAll(`[data-size="${key}"]`, item.size || "Beta build");
        const link = $(`[data-link="${key}"]`);
        if (item.url) {
          link.href = item.url;
          link.setAttribute("download", "");
          link.removeAttribute("aria-disabled");
        } else {
          const small = $("small", link);
          if (small) small.textContent = "Link coming soon";
        }
      });
      const fb = $("[data-feedback]");
      if (fb && d.feedbackUrl) { fb.href = d.feedbackUrl; fb.target = "_blank"; fb.rel = "noopener"; }
      if (platform && d[platform] && d[platform].url) {
        // Keep the hero button as a jump to the Download section (where the
        // install steps are) — just label it for the visitor's platform.
        const cta = $("[data-primary-cta]");
        $("span", cta).textContent = platform === "android" ? "Download for Android" : "Download for Windows";
      }
    })
    .catch(() => {});

  if (platform) {
    const tag = $(`[data-recommended="${platform}"]`);
    if (tag) tag.hidden = false;
  }

  /* ---------------- In-page links: short, reliable smooth scroll ---------------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + scrollY - 84;
      history.replaceState(null, "", id);
      if (reduced) { scrollTo(0, y); return; }
      const from = scrollY, dist = y - from, t0 = performance.now(), dur = Math.min(900, 350 + Math.abs(dist) * 0.05);
      (function step(t) {
        const p = Math.min((t - t0) / dur, 1), k = 1 - Math.pow(1 - p, 3);
        scrollTo(0, from + dist * k);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      // Safety net: if animation frames are throttled (background tab, slow
      // GPU), still land on the section instead of appearing to do nothing.
      setTimeout(() => { if (Math.abs(scrollY - y) > 4) scrollTo(0, y); }, dur + 250);
    });
  });

  /* ---------------- Reveal on scroll ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 70 + "ms";
    io.observe(el);
  });

  /* ---------------- Pointer glow + bento spotlight ---------------- */
  const glow = $(".cursor-glow");
  window.addEventListener("pointermove", (e) => {
    glow.style.transform = `translate(${e.clientX - 310}px, ${e.clientY - 310}px)`;
  }, { passive: true });
  $$(".bcard").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", e.clientX - r.left + "px");
      card.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  /* ---------------- Rotating hero word ---------------- */
  const words = $$(".rot-word");
  if (words.length && !reduced) {
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      cur.classList.remove("is-on");
      cur.classList.add("is-out");
      setTimeout(() => cur.classList.remove("is-out"), 700);
      words[i].classList.add("is-on");
    }, 2400);
  }

  /* ---------------- Typing demos ---------------- */
  async function typeLoop(el, phrases, { speed = 42, hold = 1800 } = {}) {
    if (reduced) { el.textContent = phrases[0]; return; }
    let p = 0;
    for (;;) {
      const text = phrases[p % phrases.length];
      for (let i = 1; i <= text.length; i++) { el.textContent = text.slice(0, i); await wait(speed); }
      await wait(hold);
      for (let i = text.length; i >= 0; i--) { el.textContent = text.slice(0, i); await wait(16); }
      await wait(350);
      p++;
    }
  }
  typeLoop($("#typed"), [
    "What if the lighthouse keeper never left?",
    "Mara finds the letter — but it's in her own handwriting.",
    "A song about the last train home…",
    "Plot twist: the storm was never natural.",
  ]);
  typeLoop($("#searchTyped"), ["lighthouse", "Mara", "storm"], { speed: 90, hold: 2200 });

  /* ---------------- Stage tilt (mouse parallax) ---------------- */
  const stage = $("#stage");
  if (stage && !reduced && window.matchMedia("(hover: hover)").matches) {
    window.addEventListener("pointermove", (e) => {
      const r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      $$(".device", stage).forEach((d) => {
        const k = Number(d.dataset.depth || 1);
        d.style.setProperty("--ry", (x * 3.2 * k).toFixed(2) + "deg");
        d.style.setProperty("--rx", (-y * 2.4 * k).toFixed(2) + "deg");
      });
    }, { passive: true });
  }

  /* ---------------- Ink particles ---------------- */
  const canvas = $("#particles");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let w, h, parts = [], mouse = { x: -999, y: -999 };
    const DPR = Math.min(devicePixelRatio || 1, 2);
    const colors = ["240,165,142", "230,196,127", "180,200,164", "143,134,255"];
    const sprites = colors.map((c) => {
      const s = document.createElement("canvas"); s.width = s.height = 32;
      const g = s.getContext("2d"), grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      grd.addColorStop(0, `rgba(${c},1)`); grd.addColorStop(0.35, `rgba(${c},.55)`); grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd; g.fillRect(0, 0, 32, 32);
      return s;
    });
    function resize() {
      const r = canvas.getBoundingClientRect();
      w = canvas.width = r.width * DPR; h = canvas.height = r.height * DPR;
      const n = Math.round(Math.min(45, r.width / 26));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 5 + 3) * DPR, vy: -(Math.random() * 0.35 + 0.08) * DPR, vx: (Math.random() - 0.5) * 0.15 * DPR,
        s: (Math.random() * sprites.length) | 0, a: Math.random() * 0.55 + 0.2,
      }));
    }
    resize();
    window.addEventListener("resize", resize);
    canvas.parentElement.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * DPR; mouse.y = (e.clientY - r.top) * DPR;
    });
    let visible = true;
    new IntersectionObserver((en) => (visible = en[0].isIntersecting)).observe(canvas);
    (function frame() {
      if (visible && !document.hidden) {
        ctx.clearRect(0, 0, w, h);
        for (const p of parts) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy, R = 140 * DPR;
          if (d2 < R * R) { const d = Math.sqrt(d2) || 1; p.x += (dx / d) * 1.6; p.y += (dy / d) * 1.6; }
          p.x += p.vx; p.y += p.vy;
          if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
          ctx.globalAlpha = p.a;
          ctx.drawImage(sprites[p.s], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
        }
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(frame);
    })();
  }

  /* ---------------- Journey: the ink drop follows your scroll ---------------- */
  const jsteps = $("#jsteps");
  if (jsteps) {
    const items = $$(".jstep", jsteps);
    const paint = () => {
      const r = jsteps.getBoundingClientRect();
      const p = reduced ? 1 : Math.min(Math.max((innerHeight * 0.78 - r.top) / (r.height + innerHeight * 0.1), 0), 1);
      jsteps.style.setProperty("--p", p.toFixed(3));
      items.forEach((el, i) => el.classList.toggle("lit", p >= (i / (items.length - 1)) * 0.92 - 0.02 || reduced));
    };
    window.addEventListener("scroll", paint, { passive: true });
    window.addEventListener("resize", paint);
    paint();
  }

  /* ---------------- Manifesto: words light up as you scroll ---------------- */
  const man = $("#manifesto");
  if (man) {
    man.innerHTML = man.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    const ws = $$(".w", man);
    const update = () => {
      const r = man.getBoundingClientRect();
      const p = Math.min(Math.max((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0), 1);
      const lit = Math.round(p * ws.length);
      ws.forEach((el, i) => el.classList.toggle("lit", i < lit));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- Showcase tabs (auto-rotate, click to pick) ---------------- */
  const tabs = $$(".tab"), panes = $$(".pane"), copies = $$(".copy");
  const titles = { novel: "The Last Lighthouse — Novel", script: "Monsoon Nights — Screenplay", song: "Salt & Static — Song", reel: "My Notebook — Content Plan", film: "Monsoon Nights — Production" };
  const bar = $(".tab-progress");
  const DUR = 7000;
  let cur = 0, timer, hovering = false;
  function show(i) {
    cur = (i + tabs.length) % tabs.length;
    const key = tabs[cur].dataset.tab;
    tabs.forEach((t, n) => t.classList.toggle("is-on", n === cur));
    panes.forEach((p) => p.classList.toggle("is-on", p.dataset.pane === key));
    copies.forEach((c) => (c.hidden = c.dataset.copy !== key));
    $("#winTitle").textContent = titles[key];
    restart();
  }
  function restart() {
    clearTimeout(timer);
    if (!bar) return;
    bar.classList.remove("run");
    void bar.offsetWidth;
    if (reduced) return;
    bar.style.setProperty("--dur", DUR + "ms");
    bar.classList.add("run");
    timer = setTimeout(() => { if (!hovering) show(cur + 1); else restart(); }, DUR);
  }
  tabs.forEach((t, i) => t.addEventListener("click", () => show(i)));
  const stageEl = $(".showcase-stage");
  if (stageEl) {
    stageEl.addEventListener("pointerenter", () => (hovering = true));
    stageEl.addEventListener("pointerleave", () => (hovering = false));
    new IntersectionObserver((en) => { if (en[0].isIntersecting) restart(); else clearTimeout(timer); }, { threshold: 0.3 }).observe(stageEl);
  }

  /* ---------------- Creators: live pipeline board ---------------- */
  const board = $("#board");
  if (board) {
    const cards = [
      { t: "Why I write at night", tag: "Instagram Reel · 30s", stage: 2 },
      { t: "3 hooks that never fail", tag: "YouTube Short · 45s", stage: 0 },
      { t: "Desk tour, cozy edition", tag: "TikTok · 20s", stage: 3 },
      { t: "Behind the book cover", tag: "Instagram Reel · 60s", stage: 1 },
      { t: "Draft one in 60 seconds", tag: "YouTube Short · 60s", stage: 4 },
    ];
    let turn = 0, hot = -1;
    const draw = () => {
      $$(".bcol-body", board).forEach((b) => (b.textContent = ""));
      cards.forEach((c, i) => {
        const el = document.createElement("div");
        el.className = "vcard" + (i === hot ? " hot" : "");
        el.style.setProperty("--p", (c.stage / 5) * 100 + "%");
        el.innerHTML = "<b></b><small></small><u></u>";
        $("b", el).textContent = c.t;
        $("small", el).textContent = c.tag;
        $$(".bcol-body", board)[c.stage].appendChild(el);
      });
    };
    draw();
    if (!reduced) {
      setInterval(() => {
        const c = cards[turn % cards.length];
        c.stage = c.stage >= 5 ? 0 : c.stage + 1;
        hot = turn % cards.length;
        turn++;
        draw();
      }, 1900);
    }
  }

  /* ---------------- Creators: how long is your script? ---------------- */
  const scriptTimer = $("#timer");
  if (scriptTimer) {
    const text = $("#timerText"), wave = $("#wave"), ruler = $("#ruler"), verdict = $("#verdict");
    const WPS = 2.5; // ~150 words a minute, the same pace the app uses
    let target = 30;
    const render = () => {
      const words = text.value.trim().split(/\s+/).filter(Boolean);
      const secs = words.length / WPS;
      const span = Math.max(90, Math.ceil(secs / 15) * 15); // timeline length in seconds
      wave.textContent = "";
      const bw = 100 / (span * WPS); // % width of one word
      words.forEach((w, i) => {
        const b = document.createElement("b");
        const seed = (w.length * 37 + i * 17) % 11;
        b.style.left = i * bw + "%";
        b.style.width = Math.max(bw * 0.72, 0.25) + "%";
        b.style.height = 16 + Math.min(w.length, 9) * 6 + seed * 3 + "%";
        b.className = (i + 1) / WPS <= target ? "in" : "over";
        wave.appendChild(b);
      });
      ruler.textContent = "";
      const marks = [15, 30, 60, 90].filter((m) => m <= span);
      marks.forEach((m) => {
        const s = document.createElement("span");
        s.style.left = (m / span) * 100 + "%";
        s.textContent = m + "s";
        if (m === target) s.className = "on";
        ruler.appendChild(s);
      });
      const shown = Math.round(secs);
      if (words.length === 0) {
        verdict.className = "verdict";
        verdict.innerHTML = "<b>Start typing…</b><small>0 words</small>";
      } else if (secs <= target) {
        verdict.className = "verdict ok";
        verdict.innerHTML = `<b>Fits a ${target}s video</b> — ${Math.max(target - shown, 0)}s to spare<small>${words.length} words · about ${shown}s spoken</small>`;
      } else {
        const over = Math.ceil(secs - target);
        verdict.className = "verdict long";
        verdict.innerHTML = `<b>${over}s too long</b> for ${target}s — trim about ${Math.ceil(over * WPS)} words<small>${words.length} words · about ${shown}s spoken</small>`;
      }
    };
    text.addEventListener("input", render);
    $$(".tt", scriptTimer).forEach((btn) =>
      btn.addEventListener("click", () => {
        target = Number(btn.dataset.sec);
        $$(".tt", scriptTimer).forEach((b) => b.classList.toggle("on", b === btn));
        render();
      })
    );
    render();
  }

  /* ---------------- Vault scramble ---------------- */
  const vault = $("#vaultText");
  if (vault) {
    const plain = "sunlit-harbor-42";
    const glyphs = "▓▒░#%@$&*+=?ABCDEF0123456789";
    const scramble = (from, to, ms) => new Promise((res) => {
      const t0 = performance.now();
      (function step(t) {
        const p = Math.min((t - t0) / ms, 1);
        vault.textContent = Array.from(to).map((ch, i) => (i < p * to.length ? ch : glyphs[(Math.random() * glyphs.length) | 0])).join("");
        p < 1 ? requestAnimationFrame(step) : res();
      })(t0);
    });
    const cipher = () => Array.from(plain).map(() => glyphs[(Math.random() * glyphs.length) | 0]).join("");
    if (reduced) { vault.textContent = plain; }
    else (async function loop() {
      for (;;) {
        await wait(2400);
        for (let k = 0; k < 14; k++) { vault.textContent = cipher(); await wait(45); }
        await wait(1500);
        await scramble(vault.textContent, plain, 900);
      }
    })();
  }

  /* ---------------- Theme demo ---------------- */
  const demo = $("#themeDemo"), toggle = $("#themeToggle");
  if (demo && toggle) {
    const flip = () => {
      const light = demo.classList.toggle("light");
      toggle.innerHTML = `<svg class="ic sm"><use href="#${light ? "i-moon" : "i-sun"}"/></svg> ${light ? "Go dark" : "Try it"}`;
    };
    toggle.addEventListener("click", flip);
    if (!reduced) setInterval(flip, 4200);
  }
})();
