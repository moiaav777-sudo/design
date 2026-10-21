/* Микрокарточки Design Atlas: ленивое живое превью примеров.
   Живой iframe держится только у карточек на экране (не больше MAX_LIVE), остальные снова становятся заглушкой. */
(()=>{"use strict";
const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches,MAX_LIVE=10;
const items=new Map();let speed=1,tick=0,paused=false;
const send=(s,action,value)=>{if(s.frame&&s.frame.contentWindow)s.frame.contentWindow.postMessage({action,value},location.origin)};
const unmount=s=>{if(!s.frame)return;s.frame.remove();s.frame=null;s.ready=false;s.played=false;s.view.classList.remove("is-live")};
function trim(){const live=[...items.values()].filter(s=>s.frame);if(live.length<=MAX_LIVE)return;live.filter(s=>!s.visible).sort((a,b)=>a.seen-b.seen).slice(0,live.length-MAX_LIVE).forEach(unmount)}
function mount(s){
  if(s.frame){if(s.ready&&!paused){send(s,"unfreeze");if(!s.played&&!reduced){send(s,"play");s.played=true}}return}
  if(!s.src||paused)return;
  const f=document.createElement("iframe");f.title=s.title;f.tabIndex=-1;f.setAttribute("aria-hidden","true");f.src=s.src;
  s.view.append(f);s.frame=f;s.ready=false;s.view.classList.remove("is-error");trim();
}
const io=new IntersectionObserver(es=>{for(const e of es){const s=items.get(e.target);if(!s)continue;s.visible=e.isIntersecting;if(s.visible){s.seen=++tick;mount(s)}else if(s.frame&&s.ready)send(s,"freeze")}},{rootMargin:"160px"});
const ro=new ResizeObserver(es=>{for(const e of es)e.target.style.setProperty("--k",(e.contentRect.width/900).toFixed(4))});
addEventListener("message",e=>{
  if(e.origin!==location.origin)return;
  for(const s of items.values()){
    if(!s.frame||e.source!==s.frame.contentWindow)continue;
    if(e.data&&e.data.type==="demo-ready"){s.ready=true;s.view.classList.add("is-live");send(s,"speed",speed);if(s.visible&&!s.played&&!reduced&&!paused){send(s,"play");s.played=true}if(!s.visible||paused)send(s,"freeze")}
    else if(e.data&&e.data.type==="demo-error"){s.view.classList.add("is-error")}
    return;
  }
});
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
/* opts: id,title,desc,tags[],src (живой пример) или poster (картинка),num,badge,actions[{act,label,primary}],onAction */
function card(o){
  const a=el("article","mc");a.dataset.id=o.id;
  const view=el("div","mc-view");view.append(el("span","mc-ph",o.title.replace(/^[^\p{L}\p{N}]+/u,"").charAt(0)));
  if(o.poster){const img=el("img","mc-poster");img.src=o.poster;img.alt="";img.loading="lazy";view.append(img)}
  if(o.tags&&o.tags[0])view.append(el("span","mc-tag",o.tags[0]));
  if(o.badge)view.append(el("span","mc-badge",o.badge));
  if(o.num!=null)view.append(el("span","mc-num",String(o.num).padStart(2,"0")));
  const body=el("div","mc-body");body.append(el("h3","mc-title",o.title));
  if(o.desc)body.append(el("p","mc-desc",o.desc));
  const foot=el("div","mc-foot"),chips=el("div","mc-chips");(o.tags||[]).slice(1).forEach(t=>chips.append(el("span","mc-chip",t)));foot.append(chips);
  const acts=el("div","mc-actions");
  (o.actions||[]).forEach(x=>{const b=el("button",x.primary?"mc-go":"mc-btn",x.label);b.type="button";b.dataset.act=x.act;if(x.primary)b.setAttribute("aria-label",x.aria||x.label);acts.append(b)});
  foot.append(acts);body.append(foot);a.append(view,body);
  a.addEventListener("click",e=>{const b=e.target.closest("[data-act]");const act=b?b.dataset.act:(e.target.closest(".mc-view")?"open":null);if(act&&o.onAction)o.onAction(act,o)});
  a.addEventListener("pointerenter",()=>{const s=items.get(view);if(s&&s.ready&&!paused){send(s,"play");s.played=true}});
  const s={view,src:o.src||null,title:o.title,frame:null,ready:false,visible:false,played:false,seen:0};
  items.set(view,s);ro.observe(view);io.observe(view);
  return a;
}
function clear(root){root.querySelectorAll(".mc-view").forEach(v=>{const s=items.get(v);if(s){unmount(s);io.unobserve(v);ro.unobserve(v);items.delete(v)}})}
window.AtlasCards={card,clear,
  setSpeed(v){speed=v;items.forEach(s=>send(s,"speed",v))},
  replayVisible(){items.forEach(s=>{if(s.visible){if(!s.frame)mount(s);if(s.ready){send(s,"play");s.played=true}else s.played=false}})},
  pause(){paused=true;items.forEach(s=>send(s,"freeze"))},
  resume(){paused=false;items.forEach(s=>{if(s.visible)mount(s)})}};
})();
