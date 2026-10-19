import { distanceKm } from './location.js';
import { setupPhotoSwap } from './dragdrop.js';
const getField=(item,...keys)=>{for(const key of keys)if(item[key]!=null)return item[key];return null;};
export function renderFeed(container,items,center,radius){
  container.replaceChildren();let count=0;const now=Date.now();
  for(const item of items){
    const latitude=Number(getField(item,'latitude','lat')),longitude=Number(getField(item,'longitude','lon','lng'));
    const environment=getField(item,'environmentPhoto','environment_photo','photoEnvironment');const selfie=getField(item,'selfiePhoto','selfie_photo','photoSelfie');
    const date=getField(item,'createdAt','created_at','timestamp');const created=new Date(date).getTime();
    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||!environment||!selfie||!Number.isFinite(created)||created>now||now-created>=86400000||distanceKm(center,{latitude,longitude})>radius)continue;
    const card=document.createElement('article');card.className='now-card';const photos=document.createElement('div');photos.className='photos';
    const main=document.createElement('img');main.className='photo-main';main.alt='Foto principal do Now';const small=document.createElement('img');small.className='photo-small';small.alt='Foto secundária; arraste ou clique para trocar';photos.append(main,small);
    const hint=document.createElement('div');hint.className='photo-hint';hint.textContent='↔ Arraste a miniatura sobre a foto grande (ou toque)';
    const info=document.createElement('div');info.className='now-info';const username=document.createElement('strong');username.textContent=String(getField(item,'username','user','author')??'Usuário');
    const description=document.createElement('p');description.textContent=String(getField(item,'description','caption','text')??'');
    const meta=document.createElement('div');meta.className='now-meta';meta.textContent=`📍 ${String(getField(item,'locationLabel','location_label','address')??'Local não identificado')} · ${new Date(created).toLocaleString('pt-BR')}`;
    info.append(username,description,meta);card.append(photos,hint,info);container.append(card);setupPhotoSwap(photos,main,small,environment,selfie);count++;
  }
  if(!count){const empty=document.createElement('div');empty.className='empty-state';empty.textContent='Nenhum Now real encontrado nas últimas 24h dentro do raio selecionado.';container.append(empty);}
}
