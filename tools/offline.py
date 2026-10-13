#!/usr/bin/env python3
"""City Rush — prepara o jogo para funcionar 100% offline (modo solo).

Uso:   python tools/offline.py            (precisa de internet SÓ nesta etapa)

1) Baixa o three.js 0.160.0 (pacote oficial do npm) e copia para dist/vendor/three apenas os
   arquivos que o jogo usa (resolve as dependências dos módulos automaticamente).
   Depois disso o jogo nunca mais precisa da CDN.
2) Gera dist/precache.json: a lista de arquivos que o service worker salva no aparelho.
Sem o passo 1 o jogo também funciona offline, mas só depois de ter sido aberto UMA vez com internet.
"""
import io, json, os, re, sys, tarfile, urllib.request

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(RAIZ, 'dist')
VERSAO = '0.160.0'
URL = f'https://registry.npmjs.org/three/-/three-{VERSAO}.tgz'
IMPORT = re.compile(r"""(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]""")


def addons_usados():
    achados = set()
    for base, _, arqs in os.walk(DIST):
        if os.sep + 'vendor' in base:
            continue
        for a in arqs:
            if a.endswith(('.js', '.mjs', '.html')):
                with open(os.path.join(base, a), encoding='utf-8', errors='ignore') as f:
                    achados.update(re.findall(r"three/addons/([\w./-]+\.js)", f.read()))
    return sorted(achados)


def fechamento(arquivos_tar, iniciais):
    """Resolve imports relativos entre módulos de examples/jsm. arquivos_tar: dict caminho -> bytes."""
    prontos, fila = {}, [f'examples/jsm/{i}' for i in iniciais]
    while fila:
        caminho = os.path.normpath(fila.pop()).replace(os.sep, '/')
        if caminho in prontos:
            continue
        if caminho not in arquivos_tar:
            raise FileNotFoundError(f'{caminho} não existe no pacote three@{VERSAO}')
        dados = arquivos_tar[caminho]; prontos[caminho] = dados
        for m in IMPORT.finditer(dados.decode('utf-8', 'ignore')):
            alvo = m.group(1) or m.group(2)
            if alvo and alvo.startswith('.'):
                fila.append(os.path.join(os.path.dirname(caminho), alvo))
    return prontos


def baixar_three():
    print(f'Baixando three@{VERSAO} …')
    with urllib.request.urlopen(URL, timeout=60) as r:
        bruto = r.read()
    arquivos = {}
    with tarfile.open(fileobj=io.BytesIO(bruto), mode='r:gz') as tar:
        for membro in tar.getmembers():
            if membro.isfile() and membro.name.startswith('package/'):
                nome = membro.name[len('package/'):]
                if nome.startswith(('build/', 'examples/jsm/')) or nome in ('LICENSE', 'package.json'):
                    arquivos[nome] = tar.extractfile(membro).read()
    return arquivos


def instalar_vendor(arquivos):
    usados = addons_usados()
    escolhidos = fechamento(arquivos, usados)
    escolhidos['build/three.module.js'] = arquivos['build/three.module.js']
    if 'build/three.core.js' in arquivos:
        escolhidos['build/three.core.js'] = arquivos['build/three.core.js']
    if 'LICENSE' in arquivos:
        escolhidos['LICENSE'] = arquivos['LICENSE']
    for caminho, dados in escolhidos.items():
        destino = os.path.join(DIST, 'vendor', 'three', *caminho.split('/'))
        os.makedirs(os.path.dirname(destino), exist_ok=True)
        with open(destino, 'wb') as f:
            f.write(dados)
    print(f'  {len(escolhidos)} arquivos do three.js copiados para dist/vendor/three')
    return len(escolhidos)


def gerar_precache():
    arquivos = []
    for base, _, arqs in os.walk(DIST):
        for a in sorted(arqs):
            rel = os.path.relpath(os.path.join(base, a), DIST).replace(os.sep, '/')
            if rel in ('sw.js', 'precache.json') or a.startswith('.') or a.endswith('.md'):
                continue
            arquivos.append(rel)
    arquivos.sort(key=lambda r: (not r.endswith(('.html', '.js', '.css', '.webmanifest')), r))  # código primeiro
    arquivos.insert(0, './')
    with open(os.path.join(DIST, 'precache.json'), 'w', encoding='utf-8') as f:
        json.dump({'versao': 'v32', 'arquivos': arquivos}, f, ensure_ascii=False, indent=0)
    tamanho = sum(os.path.getsize(os.path.join(DIST, a)) for a in arquivos if a != './' and os.path.exists(os.path.join(DIST, a)))
    print(f'  precache.json: {len(arquivos)} arquivos, {tamanho / 1048576:.1f} MB')


if __name__ == '__main__':
    if '--so-lista' not in sys.argv:
        try:
            instalar_vendor(baixar_three())
        except Exception as erro:
            print(f'ATENÇÃO: não foi possível baixar o three.js ({erro}).')
            print('O jogo continua funcionando; abra-o uma vez com internet para ele se salvar sozinho.')
    gerar_precache()
    print('Pronto. Abra o jogo normalmente (Abrir City Rush.bat).')
