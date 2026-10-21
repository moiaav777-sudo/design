/* Кнопки «Скопировать промпт»: data-prompt="full" — полный промпт (prompt-full.txt), "short" — короткий со ссылками (prompt-short.txt).
   Тексты собирает scripts/build-prompt.cjs из шаблона, шаблона-образца и каталога. */
(()=>{"use strict";
const buttons=document.querySelectorAll("[data-prompt]"),status=document.getElementById("copy-agent-status");
if(!buttons.length)return;
const files={full:"prompt-full.txt",short:"prompt-short.txt"};
function say(t){if(status)status.textContent=t}
async function copy(text){
  try{await navigator.clipboard.writeText(text);return true}catch{}
  const area=document.createElement("textarea");area.value=text;area.setAttribute("readonly","");area.style.cssText="position:fixed;opacity:0";document.body.append(area);area.select();
  let ok=false;try{ok=document.execCommand("copy")}catch{}area.remove();return ok;
}
buttons.forEach(b=>b.addEventListener("click",async()=>{
  const kind=b.dataset.prompt;say("Готовлю промпт…");
  try{
    const r=await fetch(files[kind]);if(!r.ok)throw Error();
    const text=await r.text();
    say(await copy(text)?"Промпт скопирован ("+Math.round(text.length/1000)+" тыс. знаков). Вставьте его в нейросеть и добавьте свой материал в конце.":"Не удалось скопировать автоматически. Откройте «Текст промпта» и скопируйте вручную.");
  }catch{say("Промпт не загрузился. Откройте сайт по ссылке или файл prompt-full.txt напрямую.")}
}));
})();
