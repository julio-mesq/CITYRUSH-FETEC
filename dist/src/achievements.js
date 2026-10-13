const DEFINICOES=[
  {id:'boas_vindas',nome:'Primeiros passos',desc:'Jogue por 5 segundos',teste:c=>c.tempo>=5},
  {id:'motorista',nome:'Minha primeira garagem',desc:'Tenha um veículo',teste:c=>c.carros>=1},
  {id:'proprietario',nome:'Lar, doce lar',desc:'Tenha uma casa',teste:c=>c.casas>=1},
  {id:'historia',nome:'Nome na cidade',desc:'Conclua uma missão principal',teste:c=>c.missoes>=1},
  {id:'procurado',nome:'Inimigo público',desc:'Chegue a 5 estrelas',teste:c=>c.estrelas>=5},
  {id:'combate',nome:'Veterano',desc:'Derrote 10 inimigos',teste:c=>c.kills>=10},
  {id:'reputacao',nome:'Respeitado',desc:'Alcance reputação nível 5',teste:c=>c.rep>=5},
  {id:'rico',nome:'Vida de luxo',desc:'Tenha $100.000',teste:c=>c.dinheiro>=100000},
  {id:'parkour',nome:'Por cima do problema',desc:'Faça 5 movimentos de parkour',teste:c=>c.parkour>=5},
  {id:'piloto',nome:'Piloto de rua',desc:'Vença uma corrida',teste:c=>c.corrida>0},
  {id:'custom',nome:'Estilo próprio',desc:'Modifique um veículo',teste:c=>c.custom>0},
  {id:'online',nome:'Cidade conectada',desc:'Entre em uma sala online',teste:c=>c.online}
];
const estado={desbloqueadas:[],stats:{parkour:0,esquiva:0}};
export function carregar(d){if(!d)return;estado.desbloqueadas=[...new Set(d.desbloqueadas||[])];Object.assign(estado.stats,d.stats||{});}
export const dados=()=>({desbloqueadas:[...estado.desbloqueadas],stats:{...estado.stats}});
export const lista=()=>DEFINICOES.map(d=>({...d,ok:estado.desbloqueadas.includes(d.id)}));
export function registrar(tipo){if(tipo in estado.stats)estado.stats[tipo]++;}
export function avaliar(contexto){const c={...contexto,...estado.stats},novas=[];for(const d of DEFINICOES)if(!estado.desbloqueadas.includes(d.id)&&d.teste(c)){estado.desbloqueadas.push(d.id);novas.push(d);}return novas;}
