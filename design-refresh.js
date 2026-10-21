/* Общий для библиотеки и каталога: копирование промпта для ИИ-агента. */
(()=>{"use strict";
const button=document.getElementById("copy-agent"),status=document.getElementById("copy-agent-status");
if(!button)return;
const prompt="Используй https://github.com/moiaav777-sudo/design. Прочитай AI-GUIDE.md и catalog.json. Для моей задачи подбери 2–3 визуализации по смыслу, укажи ID, ссылку на просмотр, исходники и зависимости, сравни совместимость с сайтом, PowerPoint и PDF. Не выдумывай примеры, не используй реальные персональные данные в демо и не изменяй исходный репозиторий.";
button.addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText(prompt);status.textContent="Промпт скопирован."}
  catch{const area=document.createElement("textarea");area.value=prompt;document.body.append(area);area.select();document.execCommand("copy");area.remove();status.textContent="Промпт скопирован."}
});
})();
