/* Главная Design Atlas: подбор по задаче, категории, ряды карточек, ленты и счётчики из catalog.json.
   Имя файла оставлено прежним, его проверяет CI. */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const FX = window.AtlasFX;
  const form = $("searchForm"), input = $("prompt"), output = $("finderResults");
  let list = [];

  /* Отдельные сцены: превью — картинки, сама сцена открывается на своей странице */
  const SCENES = [
    ["network-sphere", "Глобальные связи", "Интерактивная 3D-сфера с молниями между узлами", ["3D", "Интерактив", "Сеть"]],
    ["volume-atlas", "Объёмные фигуры", "Сфера и десять форм с настройкой геометрии", ["3D", "Геометрия", "Визуализация"]],
    ["process-scenes", "Объёмные процессы", "Потоки по сети, реактор с очередью, цепная реакция", ["Процессы", "Анимация"]],
    ["neon-russia", "Неоновая трансформация", "Хаос, линия, вихрь, стрела, карта России", ["Анимация", "Сцена"]],
    ["canvas-lab", "Canvas-лаборатория", "Частицы, волны, радар, орбиты, рисование", ["Частицы", "Интерактив"]]
  ];
  /* Живые примеры в ряду: выбраны редакцией, чтобы показать разные типы графиков */
  const LIVE = ["chart-donut", "story-race", "chart-heatmap", "story-network", "chart-gauge"];

  function cards(box, rows) {
    box.replaceChildren(...rows.map((r, i) => {
      const c = AtlasCards.card(r);
      c.style.setProperty("--i", i);
      return c;
    }));
  }
  cards($("sceneCards"), SCENES.map(([id, title, desc, tags], i) => ({
    id, title, desc, tags, poster: "previews/" + id + ".png", badge: i ? null : "Для старта",
    actions: [{ act: "open", label: "→", primary: true, aria: "Открыть «" + title + "»" }],
    onAction: () => { location.href = id + ".html"; }
  })));

  /* Бегущие ленты строятся из данных каталога: категории с числом примеров и задачи */
  function marquee(box, rows) {
    const make = (cls, items, rev) => {
      const row = document.createElement("div");
      row.className = "mq-row " + cls + (rev ? " rev" : "");
      for (let k = 0; k < 2; k++) { /* две копии — для бесшовной петли */
        const set = document.createElement("div");
        set.className = "mq-set";
        if (k) set.setAttribute("aria-hidden", "true");
        items.forEach(([name, n]) => {
          const s = document.createElement("span");
          s.className = "mq-item"; s.textContent = name;
          if (n != null) { const b = document.createElement("b"); b.textContent = n; s.append(b); }
          set.append(s);
        });
        row.append(set);
      }
      return row;
    };
    box.replaceChildren(make("", rows.cats, false), make("fill", rows.tasks, true));
  }

  function home(entries) {
    const total = $("totalCount"); if (total) total.textContent = entries.length;
    const counts = new Map(), tasks = new Map();
    entries.forEach(e => {
      counts.set(e.category, (counts.get(e.category) || 0) + 1);
      (e.tasks || []).forEach(t => tasks.set(t, (tasks.get(t) || 0) + 1));
    });
    const cats = [...counts].sort((x, y) => y[1] - x[1]);

    /* числа: из данных, не придуманные */
    FX.setCount($("factCount"), entries.length);
    FX.setCount($("statEntries"), entries.length);
    FX.setCount($("statCategories"), counts.size);
    FX.setCount($("statTasks"), tasks.size);
    FX.setCount($("statFormats"), Object.keys(window.__formats || { html: 1, powerpoint: 1, pdf: 1 }).length);

    const box = $("categoryList");
    if (box) {
      const make = (name, n, href, active) => {
        const a = document.createElement("a");
        a.className = "chip" + (active ? " active" : ""); a.href = href; a.textContent = name + " ";
        const c = document.createElement("small"); c.textContent = n; a.append(c); return a;
      };
      box.replaceChildren(make("Все примеры", entries.length, "gallery.html", true), ...cats.map(([n, c]) => make(n, c, "gallery.html?group=" + encodeURIComponent(n), false)));
    }
    const mq = $("marquee");
    if (mq) marquee(mq, { cats, tasks: [...tasks].sort((a, b) => b[1] - a[1]).map(([n]) => [n, null]) });

    const live = LIVE.map(id => entries.find(e => e.id === id)).filter(Boolean), lb = $("liveCards");
    if (lb) cards(lb, live.map(e => ({
      id: e.id, title: e.title, desc: e.purpose, tags: [e.category, ...e.tasks], src: e.preview + "&compact=1",
      actions: [{ act: "open", label: "→", primary: true, aria: "Открыть «" + e.title + "»" }],
      onAction: () => { location.href = "gallery.html?q=" + encodeURIComponent(e.title.split(" · ")[0]); }
    })));
  }
  fetch("catalog.json").then(r => { if (!r.ok) throw Error(); return r.json(); })
    .then(j => { window.__formats = j.formats; list = j.entries || []; home(list); })
    .catch(() => {});

  /* Подбор по словам: считаем совпадения слов запроса с названием, целью, категорией и задачами */
  const terms = s => s.toLocaleLowerCase("ru").split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2);
  function search() {
    const q = input.value.trim();
    if (!q) { input.focus(); return; }
    const w = terms(q);
    const matches = list.map(e => ({
      e, score: w.reduce((p, t) => p + ([e.title, e.purpose, e.category, ...(e.tasks || []), e.interaction].join(" ").toLocaleLowerCase("ru").includes(t) ? 1 : 0), 0)
    })).filter(x => x.score).sort((a, b) => b.score - a.score).slice(0, 3);
    output.replaceChildren(); output.hidden = false;
    const p = document.createElement("p");
    p.textContent = matches.length ? "Подходящие примеры:" : "Совпадений пока нет. Посмотрите полный каталог.";
    output.append(p);
    matches.forEach(({ e }, i) => {
      const a = document.createElement("a");
      a.style.setProperty("--i", i);
      a.href = new URL(e.preview || "catalog.html", location.href).href;
      const t = document.createElement("span"); t.textContent = e.title + " ↗";
      const s = document.createElement("small"); s.textContent = e.category;
      a.append(t, s); output.append(a);
    });
    const a = document.createElement("a");
    a.href = "catalog.html"; a.style.setProperty("--i", matches.length);
    a.textContent = "Полный каталог и фильтры →"; output.append(a);
  }
  form.addEventListener("submit", e => { e.preventDefault(); search(); });
  document.querySelectorAll("[data-query]").forEach(b => b.addEventListener("click", () => { input.value = b.dataset.query; search(); }));

/* Hero: сцена, живые графики, печатающееся слово */
  FX.heroScene($("heroCanvas"));
  FX.heroWidgets($("heroWidgets"));
  FX.typed($("typed"), ["идеальную", "живую", "эффектную", "объёмную", "понятную", "запоминающуюся"]);
})();
