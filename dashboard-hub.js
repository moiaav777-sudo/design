const hubViewer=document.getElementById('hub-viewer');
document.querySelectorAll('[data-scene-file]').forEach(button=>button.addEventListener('click',()=>{
 const file=button.dataset.sceneFile,title=button.dataset.sceneTitle;
 document.getElementById('hub-viewer-title').textContent=title;
 document.getElementById('hub-full').href=file;
 const frame=document.createElement('iframe');frame.src=file;frame.title=title;frame.loading='eager';
 document.getElementById('hub-frame').replaceChildren(frame);hubViewer.showModal();
 document.querySelectorAll('[data-scene-file]').forEach(b=>b.setAttribute('aria-pressed',b===button));
 
}));
document.getElementById('hub-close').addEventListener('click',()=>{hubViewer.close();document.getElementById('hub-frame').replaceChildren();document.querySelectorAll('[data-scene-file]').forEach(b=>b.setAttribute('aria-pressed','false'))});

hubViewer.addEventListener("close",()=>document.getElementById("hub-frame").replaceChildren());
