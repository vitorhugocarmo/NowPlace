import { API_CONFIG } from './config.js';
const DB = 'nowplace-capturas-reais';
function openDatabase(){
  return new Promise((resolve,reject)=>{
    if(!window.indexedDB)return reject(new Error('IndexedDB não é suportado neste navegador.'));
    const request=indexedDB.open(DB,1);
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('nows'))request.result.createObjectStore('nows',{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(new Error('Não foi possível abrir o armazenamento de fotos.'));
  });
}
export async function saveLocalNow(now){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction('nows','readwrite');
    transaction.objectStore('nows').put(now);
    transaction.oncomplete=()=>{db.close();resolve();};
    transaction.onerror=()=>{db.close();reject(new Error('Falha ao salvar as fotos no navegador (talvez falta de espaço).'));};
  });
}
export async function getLocalNows(){
  const db=await openDatabase();
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction('nows','readonly');
    const req=transaction.objectStore('nows').getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(new Error('Não foi possível consultar seus Nows salvos.'));
    transaction.oncomplete=()=>db.close();
  });
}
async function jsonRequest(url,opts={}){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(url,{...opts,signal:controller.signal});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }catch(error){if(error.name==='AbortError')throw new Error('Tempo limite da requisição à API.');throw new Error('Falha na comunicação com a API: '+error.message);}
  finally{clearTimeout(timer);}
}
export async function checkApi(){
  const data=await jsonRequest(`${API_CONFIG.baseUrl}/posts`);
  if(!Array.isArray(data))throw new Error('Resposta inesperada de GET /posts.');
  return data.length;
}
export async function submitApiPost(now){
  // JSONPlaceholder aceita somente um post textual convencional.
  // Fotos e coordenadas exatas nunca são enviadas a esse serviço público.
  const body={userId:1,title:`NowPlace — ${now.username}`.slice(0,90),body:`${now.description||'Registrando meu agora.'} | ${now.locationLabel} | ${now.createdAt}`};
  const result=await jsonRequest(`${API_CONFIG.baseUrl}/posts`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!result || result.id==null)throw new Error('POST /posts retornou resposta sem ID.');
  return result;
}
export async function reverseGeocode(latitude,longitude){
  const params=new URLSearchParams({format:'jsonv2',lat:String(latitude),lon:String(longitude),zoom:'16',addressdetails:'1','accept-language':'pt-BR'});
  const data=await jsonRequest(`${API_CONFIG.reverseGeocodeUrl}?${params}`);
  const a=data.address||{};
  const label=[a.road||a.pedestrian||a.suburb||a.neighbourhood,a.city||a.town||a.village||a.municipality,a.state].filter(Boolean).join(', ')||data.display_name;
  if(!label)throw new Error('Endereço não encontrado pela API de mapas.');
  return {label};
}
