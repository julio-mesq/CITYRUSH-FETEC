// Reputação persistente: sobe com história, trabalhos e competições.
const estado={xp:0};
export function carregar(d){estado.xp=Math.max(0,Number(d?.xp)||0);}
export const dados=()=>({...estado});
export const nivel=()=>Math.min(50,1+Math.floor(Math.sqrt(estado.xp/180)));
export const progresso=()=>{const n=nivel(),inicio=(n-1)**2*180,fim=n**2*180;return {nivel:n,xp:estado.xp,atual:estado.xp-inicio,meta:fim-inicio};};
export const bonus=()=>1+Math.min(.5,(nivel()-1)*.025);
export function ganhar(q){const antes=nivel();estado.xp+=Math.max(0,Math.round(q));const depois=nivel();return depois>antes?depois:0;}
