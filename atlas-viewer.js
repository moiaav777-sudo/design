/* Единое окно крупного просмотра примера. Клик по любой карточке или результату подбора открывает его сразу,
   без перехода на другую страницу и без второго клика.
   AtlasViewer.open({title, group, src, full, note, speed, onCode}) — произвольный пример;
   AtlasViewer.openEntry(запись catalog.json) — пример из каталога. */
(()=>{"use strict";
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
let dlg,frame,onMsg=null;
const $=id=>dlg.querySelector("#"+id);
function build(){
  dlg=document.createElement("dialog");dlg.className="dlg";dlg.setAttribute("aria-labelledby","av-title");
  dlg.innerHTML='<div class="dlg-head"><div><span class="eyebrow" id="av-group"></span><h2 id="av-title"></h2></div>'+
    '<div class="dlg-tools"><a id="av-full" target="_blank" rel="noopener">В отдельной вкладке ↗</a>'+
    '<button id="av-code" class="btn-quiet" type="button" hidden>Код</button>'+
    '<button id="av-close" class="btn-quiet" type="button">Закрыть</button></div></div>'+
    '<div id="av-frame" class="dlg-frame"></div><p class="preview-note" id="av-note"></p>';
  document.body.append(dlg);
  $("av-close").onclick=()=>dlg.close();
  dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
  dlg.addEventListener("close",()=>{
    if(dlg.open)return; /* событие close приходит с задержкой: если окно уже открыли заново, ничего не сбрасываем */
    $("av-frame").replaceChildren();frame=null;
    if(onMsg){removeEventListener("message",onMsg);onMsg=null}
    if(window.AtlasCards)AtlasCards.resume();
  });
}
function open(o){
  if(!dlg)build();
  if(window.AtlasCards)AtlasCards.pause();
  $("av-group").textContent=o.group||"Крупный просмотр";
  $("av-title").textContent=o.title;
  $("av-full").href=o.full||o.src;
  $("av-note").textContent=o.note||"";
  const code=$("av-code");code.hidden=!o.onCode;
  code.onclick=o.onCode?()=>{dlg.close();o.onCode()}:null;
  frame=document.createElement("iframe");frame.title=o.title;frame.src=o.src;
  if(onMsg)removeEventListener("message",onMsg);
  /* демо сообщают о готовности: тогда задаём скорость и запускаем анимацию с начала */
  onMsg=e=>{if(e.origin!==location.origin||!frame||e.source!==frame.contentWindow)return;
    if(e.data&&e.data.type==="demo-ready"){frame.contentWindow.postMessage({action:"speed",value:o.speed||1},location.origin);if(!reduced)frame.contentWindow.postMessage({action:"play"},location.origin)}};
  addEventListener("message",onMsg);
  $("av-frame").replaceChildren(frame);
  dlg.showModal();
}
function openEntry(e){
  open({title:e.title,group:e.category,src:e.preview,full:e.preview,
    note:[e.interaction,e.purpose&&("Где применять: "+e.purpose)].filter(Boolean).join(" ")});
}
window.AtlasViewer={open,openEntry};
})();
