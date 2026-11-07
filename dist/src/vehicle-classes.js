// Física por classe de veículo. Antes todos usavam as mesmas constantes de
// freio, esterço, arrasto e aderência; só vmax/acel mudavam. Aqui cada classe
// tem peso, freio, resposta do volante e comportamento em curva próprios.
// O "sedan" reproduz exatamente os valores antigos, então carros comuns mantêm
// a sensação que o jogador já conhece.
//
//  freio       desaceleração ao inverter o pedal (m/s²)          antigo: 34
//  giro        taxa de esterço (rad/s por unidade de volante)    antigo: 1.85
//  volanteVel  rapidez com que o volante chega ao alvo           antigo: 9
//  arrasto     perda em ponto morto (1/s)                        antigo: .46
//  arrastoAcel perda acelerando (1/s)                            antigo: .14
//  re          velocidade máxima de ré (m/s)                     antigo: 9
//  aderencia   multiplicador de aderência lateral (drift)        antigo: 1
//  rolagem     inclinação da carroceria em curva                 antigo: .025
//  altaVel     quanto o esterço cai em alta velocidade (0..1)    antigo: .62
//  impacto     fração do dano em colisões                        antigo: 1
export const CLASSES = {
  sedan:      { nome: 'Sedã',        freio: 34, giro: 1.85, volanteVel: 9,  arrasto: .46, arrastoAcel: .14, re: 9,  aderencia: 1,    rolagem: .025, altaVel: .62, impacto: 1 },
  compacto:   { nome: 'Compacto',    freio: 36, giro: 2.05, volanteVel: 11, arrasto: .5,  arrastoAcel: .15, re: 8,  aderencia: .96,  rolagem: .03,  altaVel: .6,  impacto: 1.1 },
  esportivo:  { nome: 'Esportivo',   freio: 44, giro: 1.95, volanteVel: 12, arrasto: .38, arrastoAcel: .1,  re: 9,  aderencia: 1.22, rolagem: .014, altaVel: .7,  impacto: 1 },
  super:      { nome: 'Supercarro',  freio: 50, giro: 1.9,  volanteVel: 13, arrasto: .34, arrastoAcel: .08, re: 9,  aderencia: 1.32, rolagem: .01,  altaVel: .74, impacto: .95 },
  suv:        { nome: 'SUV',         freio: 30, giro: 1.6,  volanteVel: 8,  arrasto: .5,  arrastoAcel: .16, re: 8,  aderencia: .9,   rolagem: .045, altaVel: .58, impacto: .8 },
  pickup:     { nome: 'Picape',      freio: 27, giro: 1.5,  volanteVel: 7,  arrasto: .52, arrastoAcel: .17, re: 7,  aderencia: .84,  rolagem: .05,  altaVel: .55, impacto: .7 },
  van:        { nome: 'Van',         freio: 25, giro: 1.45, volanteVel: 6.5,arrasto: .55, arrastoAcel: .18, re: 7,  aderencia: .8,   rolagem: .055, altaVel: .52, impacto: .75 },
  caminhao:   { nome: 'Caminhão',    freio: 20, giro: 1.15, volanteVel: 5,  arrasto: .6,  arrastoAcel: .2,  re: 6,  aderencia: .75,  rolagem: .06,  altaVel: .5,  impacto: .5 },
  onibus:     { nome: 'Ônibus',      freio: 18, giro: 1.0,  volanteVel: 4.5,arrasto: .6,  arrastoAcel: .2,  re: 5,  aderencia: .72,  rolagem: .05,  altaVel: .48, impacto: .45 },
  policial:   { nome: 'Viatura',     freio: 40, giro: 1.95, volanteVel: 11, arrasto: .42, arrastoAcel: .12, re: 10, aderencia: 1.1,  rolagem: .022, altaVel: .66, impacto: .85 },
  classico:   { nome: 'Clássico',    freio: 26, giro: 1.6,  volanteVel: 7,  arrasto: .5,  arrastoAcel: .16, re: 7,  aderencia: .85,  rolagem: .045, altaVel: .55, impacto: 1 },
  moto:       { nome: 'Moto',        freio: 38, giro: 2.4,  volanteVel: 12, arrasto: .44, arrastoAcel: .12, re: 3,  aderencia: 1.05, rolagem: .29,  altaVel: .7,  impacto: 1.4 },
  bike:       { nome: 'Bicicleta',   freio: 22, giro: 2.6,  volanteVel: 12, arrasto: .8,  arrastoAcel: .3,  re: 2,  aderencia: 1,    rolagem: .2,   altaVel: .8,  impacto: 1.2 },
};

const POR_GLB = {
  carroCompacto: 'compacto', carroUrbano: 'sedan', suv: 'suv', esportivoPack: 'esportivo', pickup: 'pickup', van: 'van',
  policial: 'policial', rollsroyce: 'suv', dodge: 'esportivo', rx7: 'esportivo', antigo: 'classico', moto: 'moto', moto2: 'moto',
  lambo: 'super', spectral: 'super', onibus: 'onibus', bike: 'bike', ambulancia: 'van', entrega: 'van', bombeiros: 'caminhao', coleta: 'caminhao',
};

/** Classe física do modelo (campo `classe` em MODELOS tem prioridade). */
export function classeDoModelo(m) {
  const k = m?.classe || POR_GLB[m?.glb] || 'sedan';
  return { id: k, ...(CLASSES[k] || CLASSES.sedan) };
}
