# City Rush — checklist de melhorias e correções (todas as versões)

Legenda: [x] feito e coberto por teste automático (pasta `tests/`) · [~] feito, mas precisa de conferência visual/real no aparelho · [ ] pendente.
Rodar todos os testes: `for t in tests/*.mjs; do node $t; done` (Node.js 18+).

## v32 — Correções após teste de outra pessoa (tests/v32-fixes.mjs)

### Início dentro de casa (travava / "limbo")
- [x] Causa encontrada: o pré-aquecimento de shaders (v30) rodava depois de abrir a casa e a trocava pelo interior do mercado.
- [x] Pré-aquecimento restaura o interior ativo (e os móveis do jogador).
- [x] Primeiro veículo nasce na vaga da garagem (frente da casa), não dentro do quarto; jogador nasce em espaço livre.
- [~] Conferir: criar personagem com casa inicial, entrar no jogo, andar, sair e voltar.

### Arma ao contrário
- [x] Correção automática do sentido do cano para qualquer modelo/osso de mão (testada executando a função com quaternions reais: cano para trás, para cima, já correto).
- [x] Ossos do braço em cache (antes `getObjectByName` percorria o esqueleto a cada quadro ao mirar).
- [~] Conferir visualmente com os 5 modelos de personagem (jogador, homem, mulher, mulher2, soldado), mirando e andando.

### FPS em qualidade média e alta
- [x] Luzes: 8 postes sempre ativos + 4 de interior → 4 luzes compartilhadas (2 no celular); troca de poste sem "pulo" de luz.
- [x] Sombras: área de 360 m → 190 m, atualizadas a cada 2 quadros, alvo em grade de 2 m.
- [x] Resolução dinâmica (degraus de 15%); sombras só são desligadas se ainda ficar lento na resolução mínima; modo mínimo por último.
- [x] Bloom em meia resolução; qualidade média mantém sombras ao trocar no menu.
- [~] Medir em partida real (celular e computador, média e alta): andar pela cidade à noite, dirigir, atirar, entrar em casa.

### Link para celular
- [x] Botão "LINK PARA CELULAR" (copiar/compartilhar), link da sala usa o endereço público, QR do link público em /celular.
- [x] `dist/link-publico.json`, `PUBLICAR.txt` (4 opções) e `.github/workflows/pages.yml`.
- [x] Servidor local testado de verdade: página /celular com e sem link configurado.
- [ ] Publicar a pasta dist e preencher `dist/link-publico.json` (depende do dono do projeto).

## v31 — Offline no modo solo + casas refeitas

### Modo offline (tests/offline.mjs, tests/sw-behavior.mjs)
- [x] Jogar sozinho funciona sem internet: service worker salva ~150 arquivos (≈20 MB) no aparelho.
- [x] Teste simula o navegador offline: código, modelos, página inicial e three.js da CDN são servidos do cache.
- [x] Código (html/js/css) usa "rede primeiro": quem tem internet recebe atualizações; offline usa a última versão salva.
- [x] three.js: usa `dist/vendor/three` se existir (criado por `Preparar offline.bat` / `tools/offline.py`), senão a CDN, que é guardada na primeira visita.
- [x] `tools/offline.py` resolve sozinho as dependências dos addons do three.js (testado com pacote sintético) e gera `precache.json`.
- [x] Menu mostra "Salvando…", "Pronto para jogar offline" ou "SEM INTERNET".
- [x] Sem internet o botão de entrar online fica desativado, com mensagem clara; o solo segue liberado.
- [x] Multiplayer segue 100% online: Trystero é carregado só ao entrar na sala e nunca passa pelo cache.
- [x] Fonte do Google não bloqueia o carregamento offline; ícones e manifest para instalar como aplicativo.
- [x] Corrigidos dois defeitos do service worker achados pelo teste (mensagem de "pronto" podia se perder; status offline não lia a lista de arquivos).
- [~] Conferir num navegador real: abrir com internet, esperar o aviso verde, desligar a internet e recarregar. (Não foi possível executar um navegador no ambiente de desenvolvimento.)
- [~] `tools/offline.py` baixa o three.js do npm: precisa ser executado uma vez com internet (não foi possível testar o download no ambiente de desenvolvimento).

### Casas (tests/house-layout.mjs)
- [x] Planta nova coerente: garagem na frente (vaga do carro em x=-7, z=4.8), quarto e banheiro nos fundos, sala na frente e cozinha/jantar nos fundos.
- [x] Corrigido: o carro estacionava dentro do quarto, em cima da cama.
- [x] Nenhum móvel sobrepõe outro móvel, parede, vão/giro de porta ou a vaga do carro (38 móveis validados).
- [x] Cada cômodo tem os móveis certos (cama no quarto, fogão e geladeira na cozinha, sofá na sala, vaso/banheira no banheiro, bancada na garagem).
- [x] Móveis procedurais com acabamento (pés, almofadas, portas, puxadores, tampos, livros) e cores naturais; 3 paletas, uma por casa.
- [x] Interior fundido por material (≈480 peças → poucas dezenas de malhas) para rodar leve no celular.
- [x] Colisores de paredes e móveis gerados a partir do mesmo projeto da casa.
- [x] Modo construção: 12 pontos livres validados; catálogo com os novos móveis e tamanhos que cabem no ponto, mesmo girados.
- [x] 4 portas reposicionadas nos novos vãos; cama de dormir acompanha a nova posição.
- [~] Conferir visualmente as 3 casas (cores, proporções, iluminação) em uma partida real.
- [ ] Mercado, posto e oficina ainda usam os móveis antigos.

## v30 — Desempenho, portas e primeira pessoa (tests/v30-fixes.mjs)
- [x] Queda de FPS: nenhuma luz é criada/ligada/desligada durante o jogo (faróis, neon e interiores usam luzes fixas que só se movem).
- [x] Shaders de interiores, tiros e explosões pré-compilados na tela de carregamento.
- [x] Tiro: caixa dos carros calculada uma vez por disparo, só para carros ao alcance (antes: por projétil e por carro).
- [x] Modo desempenho automático não mexe em sombras e não dispara por um único quadro travado.
- [x] Colisão da cidade com chaves numéricas (menos alocações).
- [x] Portas com batente, verga, dobradiça no vão e maçaneta; E abre/fecha; colisão acompanha a porta; não fecha com alguém no vão.
- [x] Primeira pessoa: arma e braços ~34% maiores (constante `FP_ESCALA`).
- [~] Conferir fluidez ao atirar de escopeta, entrar/sair de carros à noite e entrar em prédios, em celular e computador.

## v29
- [x] Primeira pessoa: arma reduzida e braços refeitos (manga até o punho, antebraço fino, mãos com polegar). Tamanho ajustado de novo na v30.

## v28
- [x] Textos e painéis da tela menores; botões de toque só um pouco menores.
- [x] Arma na mão em 3ª pessoa com proporção realista.
- [x] Notebook/tablet com tela de toque volta a mostrar os botões de toque.

## v27 (a–d)
- [x] Missão abaixo da barra de vida; áreas separadas para minimapa, arma/munição, dicas e botões no celular.
- [x] Atalho usa `servidor.py` (sem cache); PC com toque + mouse usa modo computador.
- [x] Aviso quando a porta 8765 já está em uso.
- [x] Jogar no celular pela rede local (QR code, liberar acesso).

## v26 — Otimização

Ordem: 1 → 3 → 4 → 2 → 5 → 6 → 7 → 8 → 9 → 10.
Cada bloco é validado e publicado no mesmo Site, preservando o acesso público.


- [x] Efeitos de sangue, tiros e explosões reutilizam objetos e não causam picos de memória.
- [x] NPC derrotado não continua processando combate e reaparece sem duplicar abates.
- [x] Visão e busca de cobertura da polícia rodam em intervalos controlados.
- [x] Quantidade de pessoas, trânsito, partículas e resolução se adaptam ao aparelho.
- [x] Perfil médio mantém iluminação e reflexos, com pós-processamento pesado apenas no alto.
- [x] Carregamento dos GLBs foi limitado em paralelo para evitar congelamentos.

- [x] 1. Movimento: idle/walk/run/jump, stamina, agachar, esquiva, transições, direção/drift/danos, parkour. Detecção furtiva será conectada à IA no bloco 4.
- [x] 3. Combate: mira desktop/touch, quatro armas e extras, recarga/reserva, dano em pessoas/veículos, colete, partículas. Testes de recarga/absorção aprovados; conferência visual pendente.
- [x] 4. Mundo: pedestres com pausas/fuga, trânsito/sinais e distância, procurado 1–5, perseguição a pé e em viaturas, detecção furtiva, dia/noite e clima automático. Sintaxe validada; equilíbrio das perseguições requer partida real.
- [x] 2. Casa: compra, interiores detalhados, modo construção com móveis persistentes, garagem por imóvel e sono que avança para manhã e recupera vida/stamina.
- [x] 5. Missões: GPS com distância, história por carreira e diálogos, entregas/corridas secundárias, recompensas de dinheiro/armas/carros e chefe final dedicado.
- [x] 6. Economia: dinheiro por trabalhos, lojas de armas/roupas/carros, aparência atualizável, tuning com pintura/neon e reputação com níveis e bônus.
- [x] 7. Interface: minimapa circular/GPS, mapa M, vida/colete/stamina, arma/munição, pausa com qualidade/sensibilidade/volume e 12 conquistas persistentes.
- [x] 8. Online: salas/link por modo, sincronização de personagens/veículos/pinturas/neon, chat seguro, cooperativo sem fogo amigo com reanimação e Deathmatch com dano/placar.
- [x] 9. Imersão: sombras/reflexos, bloom, rastro de movimento em qualidade alta, sons de cidade/tiros/passos, cinco opções de rádio e primeira pessoa a pé/no veículo.
- [x] 10. Mobile: controles touch completos, carregamento inicial dividido com cenário assíncrono, LOD por distância e modo desempenho adaptativo que também desliga sombras/pós-processamento.

Validação visual 3D depende de um navegador com WebGL; não confundir verificações automatizadas com uma partida real em dois aparelhos.

Bloco 1: verificações de sintaxe de todos os módulos, testes de movimento independente de FPS, salto/parkour, drift e direção normalizada. Atalho de internet para pendrive disponível no menu; não é uma versão offline.

## Demo Pública

- [x] Cinco missões encadeadas: entrega, corrida, táxi, recuperação e fuga.
- [x] Início na casa escolhida, veículo inicial dentro da garagem e campanha aceita pelo celular.
- [x] Pontos de condutor por modelo e poses diferentes para carro, moto e bicicleta.
- [x] Armas maiores, presas à posição e rotação real da mão, com disparo partindo da boca.
- [x] Câmera com proteção contra paredes e móveis; colisores internos em casa, lojas e oficina.
- [x] Movimento com subpassos, HUD/minimapa limitados e motion blur apenas em alta velocidade.
- [x] Direção de pedestres baseada na velocidade real e orientação corrigida da moto esportiva.
- [x] Exposição, bloom, asfalto e balanço de carroceria refinados.
