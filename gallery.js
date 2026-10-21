(()=>{"use strict";
const $=id=>document.getElementById(id);
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
/* Отдельные сцены: превью — готовые картинки, живая сцена открывается крупно. */
const SCENES=[
  {id:"network-sphere",title:"Сфера с молниями",desc:"Вращение, выбор узлов, десять молний со столкновениями.",task:"Показать связи"},
  {id:"volume-atlas",title:"Атлас объёмных фигур",desc:"Сфера и десять дополнительных форм, настройка геометрии, плавные переходы.",task:"Привлечь внимание"},
  {id:"process-scenes",title:"Объёмные процессы",desc:"Потоки по сети, реактор с очередью, цепная реакция.",task:"Объяснить процесс"},
  {id:"canvas-lab",title:"Canvas-лаборатория",desc:"Частицы, волны, радар, орбиты, рисование и поле потоков; экспорт PNG.",task:"Организовать взаимодействие"},
  {id:"neon-russia",title:"Неоновая трансформация",desc:"Хаос → линия → вихрь → стрела → карта России.",task:"Провести через историю"}
].map(s=>({...s,kind:"scene",group:"Отдельные сцены",file:s.id+".html",use:s.desc,hint:s.desc,plugins:[]}));
const DEMO_ORDER=[...DEMOS.filter(d=>d.group==="Исследование"),...DEMOS.filter(d=>d.id.startsWith("story-")&&d.group!=="Исследование"),...DEMOS.filter(d=>d.id.startsWith("chart-")),...DEMOS.filter(d=>!d.id.startsWith("story-")&&!d.id.startsWith("chart-"))];
const GROUPS=["Исследование","Сложные сцены","Цифры","Графики","Интерактивные графики","Ядро","Прокрутка","Текст","SVG","Интерфейс","Физика и графика","Кривые и разработка"];
const lib=[...SCENES,...DEMO_ORDER.map(d=>({kind:"demo",id:d.id,title:d.title,group:d.group,use:d.use,hint:d.hint,plugins:d.plugins,doc:d.doc,d,task:""}))];
lib.forEach((x,i)=>x.num=i+1);
const ALL="Все примеры";
const params=new URLSearchParams(location.search);
let group=params.get("group")||ALL,speed=1,codeItem=null,codeTab="js",cssText="",reactText="",current=null;
if(group!==ALL&&!lib.some(x=>x.group===group))group=ALL;
$("search").value=params.get("q")||"";
$("total").textContent=lib.length;

function matches(x,q){return(group===ALL||x.group===group)&&(!q||[x.title,x.group,x.use,x.hint,x.task,...x.plugins].join(" ").toLowerCase().includes(q))}
function renderFilters(){
  const names=[ALL,"Отдельные сцены",...GROUPS.filter(g=>lib.some(x=>x.group===g)),...[...new Set(lib.map(x=>x.group))].filter(g=>g!=="Отдельные сцены"&&!GROUPS.includes(g))];
  $("filters").replaceChildren(...names.map(g=>{const b=document.createElement("button");b.type="button";b.className="chip"+(g===group?" active":"");b.setAttribute("aria-pressed",g===group);b.dataset.group=g;b.textContent=g+" ";const n=document.createElement("small");n.textContent=g===ALL?lib.length:lib.filter(x=>x.group===g).length;b.append(n);return b}));
}
function open(x){x.kind==="scene"?openScene(x):openDemo(x)}
function onAction(act,o){const x=lib.find(i=>i.id===o.id);if(!x)return;if(act==="code")showCodeDialog(x);else open(x)}
const stag=(c,i)=>{c.style.setProperty("--i",i);return c};
function render(){
  const q=$("search").value.trim().toLowerCase(),box=$("gallery");
  AtlasCards.clear(box);
  const shown=lib.filter(x=>matches(x,q));
  $("results").textContent=shown.length+" из "+lib.length+" примеров";
  renderFilters();
  if(!shown.length){box.replaceChildren(AtlasFX.emptyState("Попробуйте «линия», «счётчик», «текст» или другую категорию.",()=>{group=ALL;$("search").value="";render()}));return}
  const frag=document.createDocumentFragment();
  /* --i задаёт задержку появления: карточки выстраиваются волной */
  shown.forEach((x,i)=>frag.append(stag(AtlasCards.card({id:x.id,title:x.title,desc:x.use,num:x.num,
    tags:[x.group,...(x.task?[x.task]:[])],
    src:x.kind==="demo"?"demo.html?id="+encodeURIComponent(x.id)+"&compact=1":null,
    poster:x.kind==="scene"?"previews/"+x.id+".png":null,
    badge:x.kind==="scene"?"3D-сцена":null,
    actions:[{act:"code",label:"Код"},{act:"open",label:"→",primary:true,aria:"Открыть «"+x.title+"» крупно"}],onAction}),i)));
  box.replaceChildren(frag);
}
$("filters").onclick=e=>{const b=e.target.closest("[data-group]");if(b){group=b.dataset.group;render()}};
$("search").oninput=render;
$("speed").onchange=e=>{speed=+e.target.value;AtlasCards.setSpeed(speed)};
$("replay-visible").onclick=()=>AtlasCards.replayVisible();

/* Крупный просмотр */
const pd=$("preview-dialog");
function openDemo(x){
  const f=document.createElement("iframe");f.title=x.title;f.src="demo.html?id="+encodeURIComponent(x.id);
  fillPreview(x,f,f.src);
  const onMsg=e=>{if(e.origin!==location.origin||e.source!==f.contentWindow)return;if(e.data.type==="demo-ready"){f.contentWindow.postMessage({action:"speed",value:speed},location.origin);if(!reduced)f.contentWindow.postMessage({action:"play"},location.origin)}};
  addEventListener("message",onMsg);pd.addEventListener("close",()=>removeEventListener("message",onMsg),{once:true});
}
function openScene(x){const f=document.createElement("iframe");f.title=x.title;f.src=x.file;fillPreview(x,f,x.file)}
function fillPreview(x,frame,full){
  current=x;AtlasCards.pause();
  $("preview-group").textContent=x.group;$("preview-title").textContent=x.title;$("preview-full").href=full;
  $("preview-note").textContent=x.kind==="demo"?x.hint+" Где применять: "+x.use:x.desc+" Данные демонстрационные.";
  $("preview-frame").replaceChildren(frame);pd.showModal();
}
$("close-preview").onclick=()=>pd.close();
pd.addEventListener("close",()=>{$("preview-frame").replaceChildren();current=null;AtlasCards.resume()});
$("preview-code").onclick=()=>{if(current){const x=current;pd.close();showCodeDialog(x)}};
for(const d of [pd,$("code-dialog")])d.addEventListener("click",e=>{if(e.target===d)d.close()});

/* Исходный код */
function sourceJS(d){
  if(d.id==="react")return reactText||"Загрузка исходника React…";
  const libName=p=>({"@pixi":"pixi","@easel":"easeljs","@react":"react-demo"}[p]||p);
  const imports=["gsap",...d.plugins.map(libName)].map(p=>"// Библиотека: vendor/"+p+".min.js").join("\n");
  const helper='const q = s => document.querySelector(s);\nconst qa = s => [...document.querySelectorAll(s)];\n// Кнопка .play запускает созданную анимацию.\nfunction wire(animation) {\n  window.demoAnimation = animation;\n  document.querySelector(".play").onclick = () => animation.restart();\n  const seek = document.querySelector(".scene-seek");\n  if (seek) {\n    const oldUpdate = animation.eventCallback("onUpdate");\n    animation.eventCallback("onUpdate", () => {\n      if (oldUpdate) oldUpdate.call(animation);\n      seek.value = animation.progress();\n    });\n    seek.oninput = e => animation.progress(+e.target.value).pause();\n  }\n  document.querySelector(".local-play")?.addEventListener("click", () => animation.restart());\n  document.querySelector(".local-pause")?.addEventListener("click", () => animation.pause());\n}\n';
  const gsapPlugins=d.plugins.filter(p=>!p.startsWith("@"));
  return "// Подключение библиотек:\n"+imports+"\n\n"+(gsapPlugins.length?"gsap.registerPlugin("+gsapPlugins.join(", ")+");\n\n":"")+helper+"\n("+d.run.toString()+")();\nif (window.demoPlay) {\n  document.querySelector(\".play\").onclick = window.demoPlay;\n}\n\n// В интерактивных сценах demoPlay() запускает демонстрационное действие.\n// Основные действия привязаны к кнопкам, жестам и ползункам сцены.";
}
function showCode(){
  const x=codeItem;if(!x)return;
  $("code-title").textContent=x.title;
  const scene=x.kind==="scene";
  document.querySelector(".code-tabs").querySelectorAll("[data-tab]").forEach(b=>{b.hidden=scene;b.setAttribute("aria-pressed",b.dataset.tab===codeTab)});
  $("docs").hidden=scene;
  if(scene){$("code-note").textContent="Сцена — один самодостаточный HTML-файл: разметка, стили и скрипт внутри.";$("source").textContent="Загрузка "+x.file+"…";fetch(x.file).then(r=>r.ok?r.text():Promise.reject()).then(t=>{if(codeItem===x)$("source").textContent=t}).catch(()=>{$("source").textContent="Не удалось загрузить файл. Откройте "+x.file+" напрямую."});return}
  const d=x.d;$("docs").hidden=false;$("docs").href=x.doc;
  const libs=["gsap",...d.plugins.map(p=>({"@pixi":"pixi","@easel":"easeljs","@react":"react-demo"}[p]||p))].map(p=>'<script src="vendor/'+p+(p==="react-demo"?".js":".min.js")+'"><\/script>').join("\n");
  $("source").textContent=codeTab==="js"?sourceJS(d):codeTab==="html"?'<link rel="stylesheet" href="brand-fonts.css">\n<link rel="stylesheet" href="demo.css">\n<link rel="stylesheet" href="brand-demos.css">\n'+libs+'\n<main id="scene">\n'+d.html+'\n</main>\n<button class="play">Запустить</button>':cssText||"Загрузка стилей…";
  $("code-note").textContent=codeTab==="js"?"Это код, который выполняется в карточке. Разметка и стили — в соседних вкладках.":"Разметка и общие стили живых примеров.";
}
function showCodeDialog(x){codeItem=x;codeTab="js";showCode();$("code-dialog").showModal();AtlasCards.pause()}
$("code-dialog").addEventListener("close",()=>{if(!pd.open)AtlasCards.resume()});
document.querySelector(".code-tabs").onclick=e=>{const t=e.target.dataset.tab;if(t){codeTab=t;showCode()}};
$("close-code").onclick=()=>$("code-dialog").close();
$("copy").onclick=async()=>{try{await navigator.clipboard.writeText($("source").textContent);$("copy").textContent="Скопировано";setTimeout(()=>$("copy").textContent="Копировать",1500)}catch{$("code-note").textContent="Выделите код и скопируйте его вручную."}};
Promise.all([Promise.all(["brand-fonts.css","demo.css","brand-demos.css"].map(p=>fetch(p).then(r=>r.text()))).then(a=>a.join("\n")),fetch("react-example.txt").then(r=>r.text())]).then(([css,react])=>{cssText=css;reactText=react;if($("code-dialog").open)showCode()}).catch(()=>{});

/* Задачи из каталога (необязательно): добавляют вторую метку на карточку */
fetch("catalog.json").then(r=>r.ok?r.json():Promise.reject()).then(j=>{const t=new Map((j.entries||[]).map(e=>[e.id,(e.tasks||[])[0]||""]));let changed=false;lib.forEach(x=>{if(!x.task&&t.get(x.id)){x.task=t.get(x.id);changed=true}});if(changed)render()}).catch(()=>{});
render();
})();
