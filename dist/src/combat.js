// Regras independentes da renderização: munição finita e absorção pelo colete.
export class Arsenal {
  constructor(armas, save = {}) {
    this.armas=armas;
    this.carregador=armas.map((a,i)=>Math.max(0,Math.min(a.mun,save.carregador?.[i]??a.mun)));
    this.reserva=armas.map((a,i)=>Math.max(0,Math.min(a.mun*12,save.reserva?.[i]??a.mun*4)));
    this.recarga=null;
  }
  recarregar(i) {
    const a=this.armas[i];
    if(this.recarga || a.melee || this.carregador[i]>=a.mun || this.reserva[i]<=0)return false;
    this.recarga={i,falta:a.recarga??1.7};return true;
  }
  atualizar(dt) {
    const r=this.recarga;if(!r)return;
    r.falta-=dt;if(r.falta>0)return;
    const n=Math.min(this.armas[r.i].mun-this.carregador[r.i],this.reserva[r.i]);
    this.carregador[r.i]+=n;this.reserva[r.i]-=n;this.recarga=null;
  }
  disparar(i) {if(this.recarga || this.carregador[i]<=0)return false;this.carregador[i]--;return true;}
  reabastecer() {this.armas.forEach((a,i)=>this.reserva[i]=a.mun*4);}
  dados(){return {carregador:this.carregador,reserva:this.reserva};}
}
export function receberDano(j,quantidade,ignoraColete=false) {
  if(j.morto || !Number.isFinite(quantidade) || quantidade<=0)return 0;
  const absorvido=ignoraColete?0:Math.min(j.colete||0,quantidade*.8);
  j.colete=Math.max(0,(j.colete||0)-absorvido);j.hp=Math.max(0,j.hp-quantidade+absorvido);
  return quantidade-absorvido;
}
