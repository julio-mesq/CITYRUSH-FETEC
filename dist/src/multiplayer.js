// Multiplayer P2P por salas: personagens, veículos, pinturas, chat e modos de jogo.
// Trystero é fixado em uma versão conhecida para mudanças futuras não quebrarem a sala.
import * as THREE from 'three';
import { criarHumano, animar } from './player.js';
import { Carro, MODELOS } from './vehicles.js';

const peers = new Map();
let sala = null, cena = null, eu = null, perfil = null, salaId = '', modo = 'coop';
let estadoAcao = null, perfilAcao = null, chatAcao = null, danoAcao = null, abateAcao = null, reviveAcao = null;
let acumulado = 0, tempo = 0, velLocal = 0, temPosicao = false, kills = 0, deaths = 0;
let aoStatus = () => {}, aoMensagem = () => {}, aoDano = () => false, aoReviver = () => {};
const alvo = new THREE.Vector3(), posLocal = new THREE.Vector3(), esfera = new THREE.Sphere(), hit = new THREE.Vector3();

const limitarTexto = (valor, max) => String(valor ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const enviar = (acao, dados, target) => {
  if (!acao) return;
  try { const promessa = acao.send(dados, target ? { target } : undefined); promessa?.catch?.(erro => console.warn('[online/envio]', erro)); }
  catch (erro) { console.warn('[online/envio]', erro); }
};

function etiqueta(nome) {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
  const c = cv.getContext('2d'); c.fillStyle = '#06111ddd'; c.roundRect(4, 4, 504, 84, 18); c.fill();
  c.strokeStyle = modo === 'deathmatch' ? '#ff5364' : '#55f2bd'; c.lineWidth = 4; c.stroke(); c.fillStyle = '#fff';
  c.font = '700 42px Rajdhani, sans-serif'; c.textAlign = 'center'; c.fillText(limitarTexto(nome || 'Jogador', 20), 256, 61);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  s.scale.set(3.5, .66, 1); s.renderOrder = 20; cena.add(s); return s;
}
function criarPeer(id, p = {}) {
  let r = peers.get(id); if (r) return r;
  if (peers.size >= 24) return null;
  const avatar = criarHumano(p.camisa || 0x296ca8, p.pele, p.cabelo, p.calca, 'jogador');
  avatar.position.set(0, -100, 0); cena.add(avatar);
  r = { id, avatar, carro: null, modelo: -1, nome: limitarTexto(p.nome || 'Jogador online', 20), label: etiqueta(p.nome), alvo: new THREE.Vector3(), yaw: 0, zona: 'world', vel: 0, hp: 100, morto: false, visto: performance.now(), tuning: '' };
  peers.set(id, r); atualizarStatus(); return r;
}
function aplicarPerfil(d, id) {
  if (!d || typeof d !== 'object') return;
  const r = criarPeer(id, d); if (!r) return;
  const novo = criarHumano(d.camisa || 0x296ca8, d.pele, d.cabelo, d.calca, 'jogador');
  novo.position.copy(r.avatar.position); novo.rotation.copy(r.avatar.rotation); novo.visible = r.avatar.visible;
  cena.remove(r.avatar); cena.add(novo); r.avatar = novo; r.nome = limitarTexto(d.nome || 'Jogador online', 20);
  cena.remove(r.label); r.label.material.map.dispose(); r.label.material.dispose(); r.label = etiqueta(r.nome);
}
function receberEstado(d, id) {
  if (!d || !Number.isFinite(d.x) || !Number.isFinite(d.z)) return;
  const r = criarPeer(id); if (!r) return;
  r.alvo.set(Math.max(-4000, Math.min(4000, d.x)), Number.isFinite(d.y) ? d.y : 0, Math.max(-4000, Math.min(4000, d.z)));
  r.yaw = Number.isFinite(d.yaw) ? d.yaw : 0; r.vel = Number.isFinite(d.vel) ? Math.abs(d.vel) : 0;
  r.zona = limitarTexto(d.zona || 'world', 24); r.hp = Math.max(0, Math.min(100, Number(d.vida) || 0)); r.morto = !!d.morto; r.visto = performance.now();
  const modelo = Number.isInteger(d.modelo) && d.modelo >= 0 && d.modelo < MODELOS.length ? d.modelo : -1;
  if (modelo !== r.modelo) {
    if (r.carro) { cena.remove(r.carro.obj); r.carro = null; }
    r.modelo = modelo;
    if (modelo >= 0) { r.carro = new Carro(cena, r.alvo.x, r.alvo.z, MODELOS[modelo], r.yaw); r.carro.indiceModelo = modelo; r.tuning = ''; }
  }
  if (r.carro && d.tuning && typeof d.tuning === 'object') {
    const seguro = {
      motor: Math.max(0, Math.min(3, d.tuning.motor | 0)),
      pintura: Number.isFinite(d.tuning.pintura) ? Math.max(0, Math.min(0xffffff, d.tuning.pintura | 0)) : r.carro.m.cor,
      aerofolio: Math.max(0, Math.min(2, d.tuning.aerofolio | 0)), rodas: Math.max(0, Math.min(2, d.tuning.rodas | 0)),
      suspensao: Math.max(0, Math.min(2, d.tuning.suspensao | 0)), turbo: !!d.tuning.turbo,
      neon: Number.isFinite(d.tuning.neon) ? Math.max(0, Math.min(0xffffff, d.tuning.neon | 0)) : 0
    };
    const assinatura = JSON.stringify(seguro); if (assinatura !== r.tuning) { r.tuning = assinatura; r.carro.aplicarCustomizacao(seguro); }
  }
  if (r.carro) { r.carro.hp = Number.isFinite(d.hp) ? Math.max(0, Math.min(100, d.hp)) : 100; r.carro.definirFarol(!!d.farol); }
}
function remover(id) {
  const r = peers.get(id); if (!r) return;
  cena.remove(r.avatar, r.label); if (r.carro) cena.remove(r.carro.obj);
  r.label.material.map.dispose(); r.label.material.dispose(); peers.delete(id); atualizarStatus();
}
function atualizarStatus() { aoStatus({ online: !!sala, sala: salaId, modo, jogadores: peers.size + (sala ? 1 : 0), kills, deaths }); }
function dadosPerfil() { return { nome: limitarTexto(perfil.nome, 20), camisa: perfil.camisa, pele: perfil.pele, cabelo: perfil.cabelo, calca: perfil.calca }; }
function estadoLocal(zona) {
  const c = eu.veiculo, p = c ? c.obj.position : eu.obj.position;
  return { x: p.x, y: p.y, z: p.z, yaw: c ? c.yaw : eu.yaw, vel: c ? c.v : velLocal, modelo: c ? (c.indiceModelo ?? 0) : -1, zona, vida: eu.hp, morto: eu.morto, hp: c?.hp, farol: c?.farolLigado, tuning: c?.dadosCustomizacao() };
}
function enviarEstado(target, zona = 'world') { enviar(estadoAcao, estadoLocal(zona), target); }

export async function entrar(scene, jog, personagem, codigo, tipo = 'coop', hooks = {}) {
  sair(); cena = scene; eu = jog; perfil = personagem; aoStatus = hooks.status || (() => {}); aoMensagem = hooks.mensagem || (() => {}); aoDano = hooks.dano || (() => false); aoReviver = hooks.reviver || (() => {});
  salaId = String(codigo || 'cidade-1').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24) || 'cidade-1';
  modo = tipo === 'deathmatch' ? 'deathmatch' : 'coop';
  const { joinRoom } = await import('https://esm.run/trystero@0.25.4');
  sala = joinRoom({ appId: 'city-rush-online-2026' }, salaId + '-' + modo, { onJoinError: evento => console.warn('[online/conexao]', evento?.error || evento) });
  estadoAcao = sala.makeAction('estado'); perfilAcao = sala.makeAction('perfil'); chatAcao = sala.makeAction('chat');
  danoAcao = sala.makeAction('dano'); abateAcao = sala.makeAction('abate'); reviveAcao = sala.makeAction('revive');
  estadoAcao.onMessage = (d, { peerId }) => receberEstado(d, peerId);
  perfilAcao.onMessage = (d, { peerId }) => aplicarPerfil(d, peerId);
  chatAcao.onMessage = (d, { peerId }) => { const r = peers.get(peerId) || criarPeer(peerId); const texto = limitarTexto(d?.texto, 140); if (texto) aoMensagem(r?.nome || 'Jogador', texto, false); };
  danoAcao.onMessage = (d, { peerId }) => {
    if (modo !== 'deathmatch' || eu.morto) return;
    const valor = Math.max(0, Math.min(100, Number(d?.valor) || 0));
    if (valor && aoDano(valor, peers.get(peerId)?.nome || 'Rival')) { deaths++; enviar(abateAcao, { ok: true }, peerId); atualizarStatus(); }
  };
  abateAcao.onMessage = d => { if (modo === 'deathmatch' && d?.ok) { kills++; atualizarStatus(); } };
  reviveAcao.onMessage = (d, { peerId }) => { if (modo === 'coop' && d?.ok && eu.morto) aoReviver(peers.get(peerId)?.nome || 'Companheiro'); };
  sala.onPeerJoin = id => { criarPeer(id); enviar(perfilAcao, dadosPerfil(), id); enviarEstado(id); atualizarStatus(); };
  sala.onPeerLeave = remover;
  aoMensagem('SISTEMA', modo === 'coop' ? 'Cooperativo ativo: fogo amigo desligado e aliados podem reanimar.' : 'Deathmatch ativo: elimine rivais e acompanhe o placar.', false);
  atualizarStatus(); return salaId;
}
export function enviarChat(texto) {
  const seguro = limitarTexto(texto, 140); if (!sala || !seguro) return false;
  enviar(chatAcao, { texto: seguro }); aoMensagem(limitarTexto(perfil.nome, 20) || 'Você', seguro, true); return true;
}
export function alvoDoRaio(ray, distancia, zona = 'world') {
  if (!sala || modo !== 'deathmatch') return null;
  let melhor = null, menor = distancia;
  for (const r of peers.values()) {
    if (r.zona !== zona || r.morto || performance.now() - r.visto > 5000) continue;
    const p = r.carro ? r.carro.obj.position : r.avatar.position;
    esfera.center.copy(p); esfera.center.y += r.carro ? 1 : 1.05; esfera.radius = r.carro ? 1.7 : .72;
    const ponto = ray.intersectSphere(esfera, hit); if (!ponto) continue;
    const d = ponto.distanceTo(ray.origin); if (d < menor) { menor = d; melhor = { id: r.id, dist: d, ponto: ponto.clone() }; }
  }
  return melhor;
}
export function danificar(id, valor) { if (modo === 'deathmatch' && peers.has(id)) enviar(danoAcao, { valor: Math.max(0, Math.min(100, valor)) }, id); }
export function reanimarProximo(posicao, zona = 'world') {
  if (!sala || modo !== 'coop') return '';
  let achado = null, d = 4;
  for (const r of peers.values()) { const di = r.alvo.distanceTo(posicao); if (r.zona === zona && r.morto && di < d) { achado = r; d = di; } }
  if (!achado) return ''; enviar(reviveAcao, { ok: true }, achado.id); return achado.nome;
}
export function atualizar(dt, zona = 'world') {
  if (!sala) return; acumulado += dt; tempo += dt;
  const p = eu.veiculo ? eu.veiculo.obj.position : eu.obj.position;
  if (temPosicao && !eu.veiculo) velLocal += (Math.min(12, p.distanceTo(posLocal) / Math.max(.001, dt)) - velLocal) * (1 - Math.exp(-10 * dt)); else if (eu.veiculo) velLocal = 0;
  posLocal.copy(p); temPosicao = true;
  if (acumulado >= .1) { acumulado = 0; enviarEstado(null, zona); }
  const agora = performance.now();
  peers.forEach(r => {
    const mesmaZona = r.zona === zona && agora - r.visto < 5000, usandoCarro = !!r.carro;
    r.avatar.visible = mesmaZona && !usandoCarro; if (r.carro) r.carro.obj.visible = mesmaZona && usandoCarro; r.label.visible = mesmaZona;
    if (!mesmaZona) return;
    const o = usandoCarro ? r.carro.obj : r.avatar;
    o.position.lerp(r.alvo, 1 - Math.exp(-10 * dt));
    o.rotation.y += Math.atan2(Math.sin(r.yaw - o.rotation.y), Math.cos(r.yaw - o.rotation.y)) * Math.min(1, dt * 12);
    if (!usandoCarro) { animar(r.avatar, r.morto ? 0 : r.vel, tempo, dt); r.avatar.rotation.x = r.morto ? 1.5 : 0; }
    alvo.copy(o.position); alvo.y += usandoCarro ? Math.max(1.8, r.carro.m.h + .65) : 2.25; r.label.position.lerp(alvo, 1 - Math.exp(-12 * dt));
  });
}
export function posicoes(zona = 'world') { return [...peers.values()].filter(r => r.zona === zona && performance.now() - r.visto < 5000).map(r => ({ x: r.alvo.x, z: r.alvo.z, morto: r.morto, nome: r.nome })); }
export function sair() {
  sala?.leave?.(); sala = estadoAcao = perfilAcao = chatAcao = danoAcao = abateAcao = reviveAcao = null;
  for (const id of [...peers.keys()]) remover(id); salaId = ''; temPosicao = false; velLocal = 0; kills = deaths = 0; atualizarStatus();
}
export const conectado = () => !!sala;
export const modoAtual = () => modo;
