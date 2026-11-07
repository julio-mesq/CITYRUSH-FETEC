# CITY RUSH: remaster, primeira etapa

Branch: `claude/cityrush-remaster`. Nada foi enviado para `main`.

## O que foi medido e como

A ferramenta foi o Chromium headless com WebGL por software (SwiftShader), numa janela de 960×540.

- **Comparáveis entre versões:** draw calls, triângulos, geometrias, texturas, programas, heap JS e bytes baixados.
- **Não representativos:** FPS e ms por quadro. Na renderização por software eles ficam entre 1 e 50 FPS e oscilam muito. Por isso este relatório **não traz números de FPS**.
- Nada foi testado em GPU real nem em celular.

Os números de culling e LOD saíram de uma comparação A/B no mesmo processo. O jogador foi teleportado para as mesmas posições e direções, e o recurso foi ligado e desligado em cada uma.

## Resultados

| Métrica | Antes | Depois | Observação |
|---|---|---|---|
| Draw calls (spawn) | 873 | 286 | `run.js`, mesmo roteiro. No "antes", a câmera estava presa no chão (bug corrigido) |
| Triângulos (spawn) | 1,83 M | 227 k | idem |
| Draw calls (andando) | 434 | 291 | idem |
| Triângulos (andando) | 862 k | 199 k | idem |
| Geometrias na GPU (spawn) | 454 | 199 | idem |
| Texturas na GPU (spawn) | 109 | 48 | idem |
| Programas de shader | 65 | 42 | idem |
| Triângulos A/B em (0,30) | 786 k | 132 k | culling ligado/desligado no mesmo processo |
| Triângulos A/B em (-300,400) | 1,79 M | 435 k | idem |
| Triângulos A/B em (450,-200) | 751 k | 80 k | idem |
| Draw calls em (-300,400) | 1.213 | 231 | LOD dos veículos (25 de 25 carros distantes como impostor) |
| Instâncias enviadas à GPU | 34.049 | ~1.900 | culling por distância |
| Pasta `dist/assets` no git | 93,3 MB | 72,5 MB | meshopt em casas, cidade_nova e tools-workshop |
| GLBs comprimidos | 36,4 MB | 14,6 MB | só nos arquivos processados |
| Download até entrar no jogo | 45,1 MB | 41,8 MB | as casas grandes carregam por proximidade |

## O que mudou

### Desempenho
- **`src/culling.js`:** prédios, árvores, calçadas, faixas e semáforos (InstancedMesh) eram desenhados em todo o mapa de 2 km, mesmo atrás da neblina.
  - Agora só vão para a GPU as instâncias dentro do alcance da neblina e à frente da câmera, com folga para sombras e giros rápidos.
  - O cálculo é refeito quando a câmera anda 6 m ou gira cerca de 10°.
  - Funciona com a tela dividida.
  - A colisão não muda, porque usa listas próprias.
- **`src/lod.js`:** de longe, cada veículo vira uma única malha.
  - As cores vêm de cada vértice: cor do material multiplicada pela textura amostrada no UV.
  - Cai de cerca de 14 draw calls para 1 por carro.
  - O detalhe é escondido por camada de render, sem mexer em `visible`. Assim não interfere em luz de freio, setas, neon, garagem nem destruição.
  - O impostor é refeito ao trocar a pintura ou o tuning.
  - Distância de troca por perfil: 55 / 85 / 130 / 190 m.
- **Compressão meshopt** dos GLBs grandes, com o decoder ligado no GLTFLoader.
  - A geometria volta a float ao carregar. Assim a fusão estática e o recorte de portas e rodas continuam corretos.
  - Os veículos ficaram de fora de propósito.
  - Comparação original × comprimido na mesma câmera: imagens equivalentes (`docs/remaster/meshopt-*.jpg`).
- **Service worker** v47 e precache v33, para os jogadores receberem os arquivos novos.
- **Painel F3:** FPS, ms, pior quadro, draw calls, triângulos, memória.
  - `?perf` na URL expõe o estado para testes.
  - `?fixo` desliga a queda automática de qualidade, só para medições.

### Correções
- **Câmera presa no chão ou olhando para o céu:** ao travar o mouse, alguns navegadores mandam um primeiro movimento gigante. Esse salto agora é ignorado, e há também uma altura mínima da câmera.
- **Câmera vista de cima da cabeça perto de paredes:** a colisão puxava a câmera para o mesmo ponto do jogador. Agora ela também desce até a altura dos olhos.
- **Asfalto quase preto:** a textura escura era multiplicada por uma cor escura.

### Visual
- O sol ficou mais forte e a luz ambiente agora tem retorno quente do chão. A exposição foi calibrada para o meio-dia não ficar azulado.
- Presets de qualidade **Auto / Baixa / Média / Alta / Ultra** no menu de pausa, cada um com uma dica.
  - Auto escolhe o perfil pelo aparelho e mantém a redução adaptativa que já existia.
  - Ultra: resolução até 2×, sombra 2048 cobrindo ±130 m, neblina mais distante.

### Física
- **`src/vehicle-classes.js`:** 13 classes (compacto, sedã, esportivo, supercarro, SUV, picape, van, caminhão, ônibus, viatura, clássico, moto e bicicleta).
- Cada classe tem os seus próprios valores de freio, esterço, rapidez do volante, arrasto, ré, aderência, rolagem, perda de esterço em alta velocidade e dano de colisão.
- O sedã reproduz exatamente as constantes antigas.

### Orientação (conferida, sem defeito encontrado)
- **Trânsito:** a frente acompanha o yaw nos dois eixos e os carros andam na faixa da direita.
- **NPCs:** olham para a direção em que andam.

## Testes
- `node tests/<arquivo>.mjs`: os 22 arquivos passam. O novo é `tests/vehicle-classes.mjs`.
  - `tests/offline.mjs` falha se existir uma cópia completa do three em `dist/vendor`, porque ela não está no precache. Isso vem do ambiente, não é defeito do jogo.
- `SMOKE=1 node tests/smoke-navegador.mjs` (novo, precisa do Playwright): carrega o jogo de verdade e falha na hora se houver erro de página.
  - Passou: 218 draw calls, 25 veículos, sem erros.
  - Conferi que ele falha quando reintroduzo de propósito um defeito de carregamento.
- **Conferido no jogo:** entrar, acelerar, virar e frear com o ônibus e com o coupé esportivo, sem erros.

## Imagens (`docs/remaster/`)
- `antes-depois-spawn.jpg`: antes à esquerda, depois à direita. A câmera do "antes" ainda não tinha se acomodado.
- `depois-cenas.jpg`: três pontos da cidade, no perfil Alta. Foi capturado antes do último ajuste de exposição (0,95 → 0,9).
- `lod-detalhe-x-impostor.jpg`: os mesmos carros com o modelo detalhado e com o impostor.
- `meshopt-*.jpg`: GLB original × comprimido.

## Ainda não feito (próximas etapas)
- **Prédios:** continuam como caixas instanciadas com textura de janelas. Para chegar perto do visual pedido, faltam modelos de prédios com licença compatível. Nenhum asset foi inventado.
- **Vida na cidade:**
  - Pedestres com rotas pelas calçadas.
  - Mais trânsito, com curvas suaves nas esquinas (hoje o carro troca de eixo no cruzamento).
  - O clima e o ciclo dia/noite já existiam e não foram alterados.
- **Áudio:** não foi alterado.
- **Loop de jogo e progressão:** não foram alterados.
- **Interface:** não foi alterada.
- **Desempenho em hardware real:** medir FPS numa GPU real e num celular com o painel F3.
- **Veículos:** comprimir os GLBs exigiria adaptar o recorte de portas e rodas em `vehicle-dynamics.js`.
