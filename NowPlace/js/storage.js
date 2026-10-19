const USER_KEY='nowplace_username';const POST_KEY='nowplace_last_post';const DAY=24*60*60*1000;
export const getUsername=()=>localStorage.getItem(USER_KEY)||'';
export function setUsername(name){localStorage.setItem(USER_KEY,name);}
export function markPublished(timestamp=Date.now()){localStorage.setItem(POST_KEY,String(timestamp));}
export function canViewFeed(){const ts=Number(localStorage.getItem(POST_KEY));return Number.isFinite(ts)&&ts>0&&ts<=Date.now()&&Date.now()-ts<DAY;}
export function accessExpiresAt(){const ts=Number(localStorage.getItem(POST_KEY));return ts>0?new Date(ts+DAY):null;}
