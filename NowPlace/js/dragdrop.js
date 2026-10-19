export function setupPhotoSwap(container,main,small,first,second){let swapped=false;const draw=()=>{main.src=swapped?second:first;small.src=swapped?first:second;};const swap=()=>{swapped=!swapped;draw();};
small.draggable=true;small.tabIndex=0;small.setAttribute('role','button');small.setAttribute('aria-label','Trocar foto principal');
small.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain','swap-now');e.dataTransfer.effectAllowed='move';});
main.addEventListener('dragover',e=>{e.preventDefault();container.classList.add('drag-over');});
main.addEventListener('drop',e=>{e.preventDefault();container.classList.remove('drag-over');if(e.dataTransfer.getData('text/plain')==='swap-now')swap();});
container.addEventListener('dragleave',()=>container.classList.remove('drag-over'));
small.addEventListener('click',swap);small.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();swap();}});draw();}
