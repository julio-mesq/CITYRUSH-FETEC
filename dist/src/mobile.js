// Controles de toque e detecção de dispositivo. O teclado virtual escreve no
// mesmo objeto `teclas` usado pelo desktop, mantendo uma única lógica de jogo.
export function detectarMobile() {
  return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0 || innerWidth < 820;
}

export function iniciarControlesMobile({ teclas, jogador, olhar }) {
  const raiz = document.getElementById('mobileControls');
  if (!raiz) return { atualizar() {} };
  raiz.classList.add('on');
  document.body.classList.add('mobile');

  const chave = (code, down) => {
    teclas[code] = down;
    const key = ({ KeyE: 'e', KeyG: 'g', KeyT: 't', KeyM: 'm', KeyV: 'v', KeyQ: 'q', KeyR: 'r', KeyH: 'h' })[code] || '';
    dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key, bubbles: true }));
  };
  const toque = code => { navigator.vibrate?.(10); chave(code, true); setTimeout(() => chave(code, false), 50); };

  const joy = document.getElementById('joystick'), stick = document.getElementById('stick');
  let joyId = null;
  const limparJoy = () => {
    joyId = null; stick.style.transform = 'translate(-50%,-50%)';
    ['KeyW', 'KeyS', 'KeyA', 'KeyD'].forEach(k => teclas[k] = false);
  };
  const moverJoy = e => {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const limite = r.width * .34, d = Math.hypot(dx, dy) || 1, escala = Math.min(1, limite / d);
    dx *= escala; dy *= escala;
    stick.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    const zona = limite * .28;
    teclas.KeyA = dx < -zona; teclas.KeyD = dx > zona; teclas.KeyW = dy < -zona; teclas.KeyS = dy > zona;
  };
  joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); moverJoy(e); e.preventDefault(); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) moverJoy(e); });
  joy.addEventListener('pointerup', limparJoy); joy.addEventListener('pointercancel', limparJoy);
  addEventListener('blur', () => {
    limparJoy();
    ['ShiftLeft', 'Space', 'Mouse0'].forEach(k => teclas[k] = false);
    raiz.querySelectorAll('.pressionado').forEach(b => b.classList.remove('pressionado'));
  });

  const area = document.getElementById('touchLook');
  let lookId = null, lx = 0, ly = 0;
  area.addEventListener('pointerdown', e => { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; area.setPointerCapture(e.pointerId); e.preventDefault(); });
  area.addEventListener('pointermove', e => {
    if (e.pointerId !== lookId) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; olhar(dx, dy);
  });
  const fimOlhar = e => { if (e.pointerId === lookId) lookId = null; };
  area.addEventListener('pointerup', fimOlhar); area.addEventListener('pointercancel', fimOlhar);

  raiz.querySelectorAll('[data-tap]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); toque(b.dataset.tap); }));
  raiz.querySelectorAll('[data-hold]').forEach(b => {
    const code = b.dataset.hold;
    b.addEventListener('pointerdown', e => { e.preventDefault(); navigator.vibrate?.(8); b.setPointerCapture(e.pointerId); teclas[code] = true; b.classList.add('pressionado'); });
    const soltar = () => { teclas[code] = false; b.classList.remove('pressionado'); };
    b.addEventListener('pointerup', soltar); b.addEventListener('pointercancel', soltar);
  });
  document.getElementById('mRun').addEventListener('pointerdown', e => {
    if (!jogador().veiculo) return;
    e.stopImmediatePropagation(); e.preventDefault(); toque('KeyH');
  }, true);
  document.getElementById('mFull').addEventListener('pointerdown', async e => {
    e.preventDefault();
    try { if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.(); else await document.exitFullscreen?.(); } catch (_) {}
    screen.orientation?.lock?.('landscape').catch?.(() => {});
  });

  let emVeiculo = null;
  return { atualizar() {
    const v = !!jogador().veiculo;
    if (v === emVeiculo) return;
    emVeiculo = v;
    document.getElementById('mEnter').textContent = v ? 'SAIR' : 'ENTRAR';
    document.getElementById('mJump').textContent = v ? 'FREIO' : 'PULAR';
    document.getElementById('mRun').textContent = v ? 'BUZINA' : 'CORRER';
    document.getElementById('mAttack').classList.toggle('inativo', v);
  } };
}
