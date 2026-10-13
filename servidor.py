# Servidor local do City Rush: sem cache, tipos corretos para .js/.glb, acessível pelo celular na mesma rede Wi-Fi.
import http.server, os, socket, sys

def ips_da_rede():
    achados = []
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('10.255.255.255', 1)); achados.append(s.getsockname()[0]); s.close()
    except Exception: pass
    try: achados += socket.gethostbyname_ex(socket.gethostname())[2]
    except Exception: pass
    def privado(ip):
        p = ip.split('.')
        return ip.startswith(('192.168.', '10.')) or (ip.startswith('172.') and 16 <= int(p[1]) <= 31)
    vistos = []
    for ip in achados:
        if privado(ip) and ip not in vistos: vistos.append(ip)
    return vistos

PAGINA = '''<!DOCTYPE html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>City Rush no celular</title>
<body style="font-family:system-ui,sans-serif;background:#08131f;color:#fff;text-align:center;padding:24px">
<h1 style="color:#fc0">City Rush no celular</h1>
{{PUBLICO}}
<h2 style="color:#9fd">Pelo Wi-Fi de casa (precisa deste computador ligado)</h2>
<p>Conecte o celular no <b>mesmo Wi-Fi</b> deste computador e abra:</p>
{{LISTA}}
<div id="qr" style="background:#fff;display:inline-block;padding:12px;margin:16px;border-radius:8px"></div>
<p style="color:#9ab">Se não abrir: rode "Liberar acesso do celular.bat" como administrador (uma vez) e confira se o Wi-Fi do PC está como rede Privada.</p>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
<script>try{new QRCode(document.getElementById('qr'),{text:{{QRLOCAL}},width:220,height:220});{{QRPUBLICO}}}catch(e){document.getElementById('qr').remove()}</script></body></html>'''

def link_publico():
    # Endereço https onde a pasta dist foi publicada (dist/link-publico.json). Vazio = ainda não publicado.
    try:
        import json
        with open(os.path.join(os.getcwd(), 'link-publico.json'), encoding='utf-8') as f:
            url = json.load(f).get('url', '').strip()
        return url.rstrip('/') + '/' if url.lower().startswith('https://') else ''
    except Exception:
        return ''

def montar_pagina(urls):
    import json, html
    publico = link_publico()
    lista = ''.join('<p style="font-size:26px;color:#fc0"><b>%s</b></p>' % html.escape(u) for u in urls) or '<p>Não achei o IP da rede. Veja na janela preta ou use "ipconfig".</p>'
    if publico:
        bloco = ('<h2 style="color:#9fd">Link que funciona sem o computador</h2><p style="font-size:26px;color:#fc0"><b>%s</b></p>'
                 '<div id="qrp" style="background:#fff;display:inline-block;padding:12px;margin:12px;border-radius:8px"></div>'
                 '<p style="color:#9ab">Abra no celular, jogue e use "Adicionar à tela inicial": o modo solo passa a funcionar até sem internet.</p><hr style="border-color:#234">') % html.escape(publico)
        qrp = "new QRCode(document.getElementById('qrp'),{text:%s,width:220,height:220});" % json.dumps(publico)
    else:
        bloco = ('<h2 style="color:#9fd">Link que funciona sem o computador</h2>'
                 '<p style="color:#ffb454">Ainda não configurado. Publique a pasta <b>dist</b> (passo a passo em PUBLICAR.txt) e cole o endereço em <b>dist/link-publico.json</b>.</p><hr style="border-color:#234">')
        qrp = ''
    return (PAGINA.replace('{{PUBLICO}}', bloco).replace('{{LISTA}}', lista)
            .replace('{{QRLOCAL}}', json.dumps(urls[0] if urls else '')).replace('{{QRPUBLICO}}', qrp)).encode('utf-8')

class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    def do_GET(self):
        if self.path.split('?')[0] == '/celular':
            urls = ['http://%s:%d' % (ip, PORTA) for ip in ips_da_rede()]
            corpo = montar_pagina(urls)
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(corpo))); self.end_headers(); self.wfile.write(corpo); return
        super().do_GET()
    def log_message(self, *a): pass

PORTA = int(sys.argv[1]); os.chdir(sys.argv[2])
try:
    srv = http.server.ThreadingHTTPServer(('', PORTA), H)
except OSError:
    print('ERRO: a porta %d ja esta em uso. Feche as outras janelas do City Rush e tente de novo.' % PORTA); sys.exit(1)
print('City Rush rodando no computador: http://localhost:%d' % PORTA)
ips = ips_da_rede()
print('')
print('PARA JOGAR NO CELULAR (mesmo Wi-Fi):')
for ip in ips: print('    http://%s:%d' % (ip, PORTA))
if not ips: print('    (nao achei o IP da rede - use o comando ipconfig)')
print('Com QR code: abra http://localhost:%d/celular no computador.' % PORTA)
_pub = link_publico()
print('')
print('LINK PARA CELULAR SEM O COMPUTADOR: ' + (_pub if _pub else '(ainda nao configurado - veja PUBLICAR.txt)'))
print('')
sys.stdout.flush()
srv.serve_forever()
