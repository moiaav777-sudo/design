const hubViewer=document.getElementById('hub-viewer');
document.querySelectorAll('[data-scene-file]').forEach(button=>button.addEventListener('click',()=>{
 const file=button.dataset.sceneFile,title=button.dataset.sceneTitle;
 document.getElementById('hub-viewer-title').textContent=title;
 document.getElementById('hub-full').href=file;
 const frame=document.createElement('iframe');frame.src=file;frame.title=title;frame.loading='eager';
 document.getElementById('hub-frame').replaceChildren(frame);hubViewer.hidden=false;
 document.querySelectorAll('[data-scene-file]').forEach(b=>b.setAttribute('aria-pressed',b===button));
 hubViewer.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
}));
document.getElementById('hub-close').addEventListener('click',()=>{hubViewer.hidden=true;document.getElementById('hub-frame').replaceChildren();document.querySelectorAll('[data-scene-file]').forEach(b=>b.setAttribute('aria-pressed','false'))});
