import {startCamera,capturePhoto,stopCamera} from './camera.js';
import {getLocation} from './location.js';
import {getUsername,setUsername,markPublished,canViewFeed,accessExpiresAt} from './storage.js';
import {submitApiPost,saveLocalNow,getLocalNows} from './api.js';
import {renderFeed} from './feed.js';
const el=id=>document.getElementById(id);
const video=el('camera'),canvas=el('captureCanvas');
let phase='environment',environmentPhoto=null,selfiePhoto=null,currentLocation=null,busy=false;
function notice(text,type=''){const e=el('message');e.textContent=text;e.className='message'+(type?' '+type:'');console.log('[NowPlace]',text);}
function showCamera(active){el('cameraPlaceholder').classList.toggle('hidden',active);}
function update(){
  el('cameraStep').textContent=phase==='environment'?'ETAPA 1 · AMBIENTE':phase==='selfie'?'ETAPA 2 · SELFIE':'CAPTURA CONCLUÍDA';
  el('capture').textContent=phase==='environment'?'Capturar ambiente':'Capturar selfie';
  const active=!!video.srcObject;
  el('startCamera').disabled=busy||active||phase==='done';
  el('capture').disabled=busy||!active||phase==='done';
  el('stopCamera').disabled=busy||!active;
  for(const id of ['locate','saveName','reset','loadFeed'])el(id).disabled=busy;
  el('publish').disabled=busy||!(environmentPhoto&&selfiePhoto&&getUsername());
  el('accessIndicator').textContent=canViewFeed()?'🔓 Feed liberado':'🔒 Bloqueado';
}
function setBusy(value){busy=value;update();}
function saveName(){const name=el('username').value.trim();if(!name)return notice('Preencha seu nome.','error');try{setUsername(name);notice('Nome salvo!','success');}catch{notice('Armazenamento do navegador indisponível.','error');}update();}
el('username').value=getUsername();el('saveName').addEventListener('click',saveName);
el('startCamera').addEventListener('click',async()=>{try{setBusy(true);await startCamera(video,phase==='selfie'?'user':'environment');showCamera(true);notice('Câmera ativa. '+(phase==='environment'?'Fotografe o ambiente.':'Capture sua selfie.'),'success');}catch(err){showCamera(false);notice(err.message,'error');}finally{setBusy(false);}});
el('capture').addEventListener('click',async()=>{try{
  const photo=capturePhoto(video,canvas);
  if(phase==='environment'){
    environmentPhoto=photo;el('environmentPreview').src=photo;el('previews').classList.remove('hidden');phase='selfie';setBusy(true);
    try{await startCamera(video,'user');showCamera(true);notice('Ambiente capturado! Tire agora a selfie.','success');}
    catch(err){stopCamera(video);showCamera(false);notice('Ambiente capturado. Clique em Ativar câmera para tirar a selfie. '+err.message,'error');}
    finally{setBusy(false);}
  }else if(phase==='selfie'){
    selfiePhoto=photo;el('selfiePreview').src=photo;phase='done';stopCamera(video);showCamera(false);notice('Fotos prontas! Informe o que está fazendo e publique.','success');
  }
  update();
}catch(err){notice(err.message,'error');}});
el('stopCamera').addEventListener('click',()=>{stopCamera(video);showCamera(false);notice('Câmera desligada.');update();});
el('locate').addEventListener('click',async()=>{try{setBusy(true);el('locationText').textContent='Consultando localização e endereço...';currentLocation=await getLocation();el('locationText').textContent=currentLocation.label;notice('Localização obtida do dispositivo.','success');}catch(err){currentLocation=null;el('locationText').textContent='Localização indisponível.';notice(err.message,'error');}finally{setBusy(false);}});
el('publish').addEventListener('click',async()=>{try{
  if(!getUsername()||!environmentPhoto||!selfiePhoto)throw new Error('Salve seu nome e capture as duas fotos.');
  setBusy(true);el('locationText').textContent='Atualizando localização no momento da publicação...';
  // Atualiza GPS sempre quando publica (RN03), mesmo que já tenha clicado Localizar.
  currentLocation=await getLocation();el('locationText').textContent=currentLocation.label;
  const now={id:crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`,username:getUsername(),description:el('description').value.trim(),environmentPhoto,selfiePhoto,latitude:currentLocation.latitude,longitude:currentLocation.longitude,locationLabel:currentLocation.label,createdAt:new Date().toISOString()};
  // Guarda imagens reais localmente. A API externa não tem campos para fotos, GPS ou busca por raio.
  await saveLocalNow(now);markPublished();
  try{const response=await submitApiPost(now);notice(`Now salvo no navegador e POST /posts confirmado (ID ${response.id}). Feed liberado por 24h.`,'success');}
  catch(err){notice('Now salvo e feed liberado por 24h, mas POST na API falhou: '+err.message,'error');}
  update();
}catch(err){notice('Não foi possível publicar: '+err.message,'error');}finally{setBusy(false);}});
el('radius').addEventListener('input',()=>el('radiusValue').textContent=el('radius').value+' km');
el('loadFeed').addEventListener('click',async()=>{try{
  if(!canViewFeed())throw new Error('Publique um Now nas últimas 24 horas antes de consultar o feed.');
  setBusy(true);currentLocation=await getLocation();el('locationText').textContent=currentLocation.label;
  const nows=await getLocalNows();renderFeed(el('feed'),nows,currentLocation,Number(el('radius').value));
  const expires=accessExpiresAt();notice(`Busca concluída. Seu acesso vence em ${expires.toLocaleString('pt-BR')}. O feed contém apenas Nows reais deste navegador.`,'success');
}catch(err){notice(err.message,'error');}finally{setBusy(false);}});
el('reset').addEventListener('click',()=>{stopCamera(video);showCamera(false);phase='environment';environmentPhoto=null;selfiePhoto=null;currentLocation=null;el('environmentPreview').removeAttribute('src');el('selfiePreview').removeAttribute('src');el('previews').classList.add('hidden');el('description').value='';el('locationText').textContent='Ainda não identificada.';notice('Pronto para registrar um novo Now.');update();});
window.addEventListener('pagehide',()=>stopCamera(video));document.addEventListener('visibilitychange',()=>{if(document.hidden&&video.srcObject){stopCamera(video);showCamera(false);update();}});
el('cameraPlaceholder').querySelector('small').textContent='Clique em Ativar câmera e permita o acesso. Use Live Server (localhost).';
update();
