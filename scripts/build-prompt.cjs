/* Собирает промпты для нейросети: prompt-full.txt (полный, самодостаточный) и prompt-short.txt (для ИИ с доступом в интернет).
   Источники: scripts/prompt-template.txt, deck-starter.html, catalog.json. Запуск: node scripts/build-prompt.cjs */
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const BASE='https://moiaav777-sudo.github.io/design/';
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const cat=JSON.parse(read('catalog.json'));
const byId=new Map(cat.entries.map(e=>[e.id,e]));

/* «Задача → приём»: ручная таблица, каждый ID проверяется по каталогу */
const TASKS=[
  ['Одна главная цифра, ключевые показатели',['chart-counter','chart-decimal','chart-odometer','chart-kpis']],
  ['Сравнить категории, рейтинг',['chart-bars','chart-horizontal','chart-lollipop','chart-sort']],
  ['Сравнить два периода или «до и после»',['chart-grouped','chart-slope','story-curtain','chart-reveal']],
  ['Динамика во времени',['chart-line','chart-area','chart-multiline','chart-sparkline','story-race']],
  ['Структура, доли целого',['chart-donut','chart-stacked','chart-treemap']],
  ['Выполнение цели, плана',['chart-gauge','story-goal']],
  ['Из чего сложился итог (приход и расход)',['chart-waterfall','story-budget']],
  ['Воронка, потери на этапах',['chart-funnel','story-customers']],
  ['Три показателя сразу, профиль',['chart-scatter','chart-radar','chart-heatmap']],
  ['Процесс, маршрут, очередь, узкое место',['story-journeys','story-project','story-queue','story-decisions']],
  ['Связи, влияние, распространение',['story-network','story-cascade']],
  ['Прогноз и сценарии',['story-forecast','story-scenarios']],
  ['Разброс, чувствительность, удержание',['story-distribution','story-sensitivity','story-cohorts']],
  ['Дать зрителю самому исследовать',['chart-hover','chart-slider','chart-update','story-drill','story-matrix']],
  ['Эффектная вводная или финальная сцена',['network-sphere','volume-atlas','neon-russia','canvas-lab','process-scenes']],
  ['Заголовок и текст появляются эффектно',['splittext','scramble','text','from','stagger']],
  ['Рассказ при прокрутке, параллакс',['scrolltrigger','smoother']]
];
for(const [,ids] of TASKS)for(const id of ids)if(!byId.has(id))throw Error('В таблице «задача → приём» нет такого ID в каталоге: '+id);

const MAIN_CATS=['Цифры','Графики','Интерактивные графики','Сложные сцены','Исследование','Отдельные сцены'];
const line=e=>`${e.id} — ${e.title.replace(/\s*·\s*/,': ')} — ${(e.purpose||'').replace(/\s+/g,' ')}`;
const block=cats=>cats.map(c=>{const list=cat.entries.filter(e=>e.category===c);return list.length?`[${c}]\n`+list.map(line).join('\n'):''}).filter(Boolean).join('\n');
const motionCats=[...new Set(cat.entries.map(e=>e.category))].filter(c=>!MAIN_CATS.includes(c));

const tpl=read('scripts/prompt-template.txt');
const full=tpl
  .replace('{{TASKS}}',()=>TASKS.map(([t,ids])=>`• ${t}: ${ids.join(', ')}`).join('\n'))
  .replace('{{MAIN}}',()=>block(MAIN_CATS))
  .replace('{{MOTION}}',()=>block(motionCats))
  .replace('{{STARTER}}',()=>read('deck-starter.html').trim())
  .split('{{BASE_URL}}').join(BASE);
if(/\{\{[A-Z_]+\}\}/.test(full))throw Error('Остались неподставленные поля шаблона');

const short=`Собери презентацию из моего материала, используя приёмы визуализации и динамики из библиотеки Design Atlas. Внешний вид — мой, неон не нужен, если я его не просил.

1. Открой и выполни полную инструкцию: ${BASE}prompt-full.txt — там правила выбора приёма под смысл слайда, правила работы с данными, формат результата, справочник приёмов и шаблон-образец.
2. Каталог приёмов: ${BASE}catalog.json. Живой пример любого приёма: ${BASE}demo.html?id=<ID>. Шаблон: ${BASE}deck-starter.html.
3. Результат — один самодостаточный HTML-файл презентации.

══ МОЙ МАТЕРИАЛ ══
[ВСТАВЬТЕ ТЕКСТ, ТЕЗИСЫ, ЦИФРЫ ИЛИ СТАРУЮ ПРЕЗЕНТАЦИЮ]

══ МОЙ СТИЛЬ ══
[ОПИШИТЕ СЛОВАМИ, ВСТАВЬТЕ ДИЗАЙН-ТОКЕНЫ, ССЫЛКУ, ФАЙЛ-ПРИМЕР ИЛИ БРЕНДБУК. ПУСТО — БУДЕТ НЕЙТРАЛЬНАЯ СВЕТЛАЯ ТЕМА]

══ ПОЖЕЛАНИЯ ПО ПРИЁМАМ (необязательно) ══
[НАПРИМЕР: «бюджет — водопадом»]
`;
fs.writeFileSync(path.join(root,'prompt-full.txt'),full);
fs.writeFileSync(path.join(root,'prompt-short.txt'),short);
console.log('prompt-full.txt',Buffer.byteLength(full),'байт ·','prompt-short.txt',Buffer.byteLength(short),'байт ·',cat.entries.length,'приёмов');
