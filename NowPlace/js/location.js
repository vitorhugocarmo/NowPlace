import { reverseGeocode } from './api.js';
export async function getLocation(){
  if(!navigator.geolocation) throw new Error('Geolocalização indisponível neste navegador.');
  const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:0})).catch(err=>{throw new Error(err.code===1?'Permissão de localização negada.':err.code===3?'Tempo limite ao obter localização.':'Não foi possível obter a localização.');});
  const {latitude,longitude}=position.coords;
  const result=await reverseGeocode(latitude,longitude);
  return {latitude,longitude,label:result.label};
}
export function distanceKm(a,b){const r=6371,toRad=v=>v*Math.PI/180,dLat=toRad(b.latitude-a.latitude),dLon=toRad(b.longitude-a.longitude);const x=Math.sin(dLat/2)**2+Math.cos(toRad(a.latitude))*Math.cos(toRad(b.latitude))*Math.sin(dLon/2)**2;return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
