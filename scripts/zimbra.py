"""Integração da Garnet AI com o e-mail comercial (Zimbra) pela API HTTPS, só com a biblioteca padrão.

Lê respostas de leads (caixa de entrada) e cria RASCUNHOS dos e-mails aprovados no painel.
NUNCA envia e-mail: este arquivo não tem nenhuma chamada de envio (regra absoluta 1: envio é humano).

Credenciais SEMPRE por variável de ambiente (nunca impressas, nunca gravadas):
  ZIMBRA_URL        ex.: https://webmail.email.com.br   (https obrigatório)
  ZIMBRA_USER       endereço completo da conta
  ZIMBRA_PASSWORD   senha da conta
  (Supabase: as mesmas de scripts/ai_db.py, chamado por subprocess; escrita só em ai_*)

Códigos de saída: 0 ok | 1 erro HTTP/SOAP/rede/banco | 2 uso inválido ou variáveis ausentes.
Saída sempre JSON em stdout; erros curtos em stderr.

Uso (python3 -I scripts/zimbra.py ...):
  testar                                   autentica e chama GetInfoRequest; {"ok":true,"conta":"..."}
  ler-respostas [--desde AAAA-MM-DD] [--limite 50] [--dry-run]
        Busca `in:inbox after:<data>` (padrão: últimos 3 dias). Só mensagens de remetentes que são
        leads são gravadas (ai_fila `zimbra-<id da msg>` + ai_interacoes entrada/email/zimbra);
        as demais são ignoradas sem gravar nada. Saída: {"lidas","de_leads","novas","ignoradas","repetidas"}.
  criar-rascunhos [--dry-run]
        Para cada ai_rascunhos aprovado, canal email e ainda sem `zdraft-<id>` na fila: converte o texto em
        HTML (multipart text/plain + text/html) com a assinatura de `ai_config.assinatura` e salva o RASCUNHO
        no Zimbra. Anexo: a proposta, se o texto trouxer o link dela (2º contato); senão a apresentação
        (`ai_config.anexo_primeiro_contato`) quando passo_cadencia for 0 ou 1. Não muda o status do rascunho.
  marcar-enviados [--dry-run]
        Para cada rascunho aprovado de e-mail com `zdraft-<id>` concluído, procura em `in:sent to:<lead>` uma
        mensagem de mesmo assunto; se achar: rascunho `enviado` (+ enviado_em), ai_interacoes saída/email,
        ai_fila `zsent-<id>` e evento. Saída: contadores JSON.
"""
import html as html_mod
import json
import os
import re
import subprocess
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from datetime import date, datetime, timedelta, timezone

AI_DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ai_db.py')
TIMEOUT = 60
LIMITE_PDF = 15 * 1024 * 1024
RE_EMAIL = re.compile(r'^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$')
MARCADORES_PROPOSTA = ('/ai-midia/propostas/', '/materiais/proposta-garnet.pdf')
LOGO_URL = 'https://papaicnydbcajkfghwem.supabase.co/storage/v1/object/public/ai-midia/materiais/assinatura-garnet.png'
AVISO_SAIR = 'Caso não queira receber novos contatos, é só nos avisar.'
NOME_APRESENTACAO = 'Apresentacao Comercial Garnet.pdf'
NOME_PROPOSTA = 'Proposta Garnet.pdf'

_cache = {'token': None}


class ZimbraErro(Exception):
    pass


def uso(msg=None, codigo=2):
    if msg:
        print(msg, file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(codigo)


# ---------------------------------------------------------------- configuração

def config():
    url = os.environ.get('ZIMBRA_URL', '').strip().rstrip('/')
    user = os.environ.get('ZIMBRA_USER', '').strip()
    senha = os.environ.get('ZIMBRA_PASSWORD', '')
    faltam = [n for n, v in (('ZIMBRA_URL', url), ('ZIMBRA_USER', user), ('ZIMBRA_PASSWORD', senha)) if not v]
    if faltam:
        print('Defina no ambiente: ' + ', '.join(faltam) + '. '
              '(ZIMBRA_URL=https://webmail.email.com.br, ZIMBRA_USER=conta completa, ZIMBRA_PASSWORD=senha)',
              file=sys.stderr)
        sys.exit(2)
    if not url.lower().startswith('https://'):
        print('ZIMBRA_URL deve começar com https://', file=sys.stderr)
        sys.exit(2)
    return url, user, senha


def censurar(texto):
    """Remove senha e token de qualquer mensagem de erro."""
    texto = str(texto)
    for segredo in (os.environ.get('ZIMBRA_PASSWORD', ''), _cache.get('token') or ''):
        if segredo:
            texto = texto.replace(segredo, '***')
    return texto


# ---------------------------------------------------------------- montagem dos JSON SOAP

def montar_contexto(token=None):
    ctx = {'_jsns': 'urn:zimbra', 'userAgent': {'name': 'garnet-ai', 'version': '1.0'}}
    if token:
        ctx['authToken'] = token
    return ctx


def montar_envelope(nome, corpo, token=None):
    return {'Header': {'context': montar_contexto(token)}, 'Body': {nome: corpo}}


def montar_auth(user, senha):
    return montar_envelope('AuthRequest', {
        '_jsns': 'urn:zimbraAccount',
        'account': {'by': 'name', '_content': user},
        'password': {'_content': senha},
    })


def montar_getinfo():
    return {'_jsns': 'urn:zimbraAccount', 'sections': 'mbox'}


def montar_search(query, limite=50):
    return {'_jsns': 'urn:zimbraMail', 'types': 'message', 'query': query,
            'limit': int(limite), 'sortBy': 'dateDesc'}


def montar_getmsg(msg_id):
    return {'_jsns': 'urn:zimbraMail', 'm': {'id': str(msg_id), 'html': 0, 'neuter': 1, 'max': 50000}}


def montar_savedraft(para, assunto, corpo, aid=None, html=None):
    """Com `html`: multipart/alternative (text/plain + text/html); sem: só texto simples."""
    if html:
        mp = {'ct': 'multipart/alternative', 'mp': [{'ct': 'text/plain', 'content': corpo},
                                                    {'ct': 'text/html', 'content': html}]}
    else:
        mp = {'ct': 'text/plain', 'content': corpo}
    m = {'e': [{'t': 't', 'a': para}], 'su': assunto, 'mp': mp}
    if aid:
        m['attach'] = {'aid': aid}
    return {'_jsns': 'urn:zimbraMail', 'm': m}


def montar_query_enviados(email, desde_ms):
    return f'in:sent to:{email} after:{int(desde_ms)}'


def montar_query_inbox(desde):
    """`after:` em milissegundos (formatos de data do Zimbra dependem do idioma da conta; AAAA/MM/DD dá
    QUERY_PARSE_ERROR). Recua 1 dia (meia-noite UTC) para cobrir o fuso; a idempotência cobre a sobreposição."""
    inicio = datetime(desde.year, desde.month, desde.day, tzinfo=timezone.utc) - timedelta(days=1)
    return 'in:inbox after:' + str(int(inicio.timestamp()) * 1000)


# ---------------------------------------------------------------- HTTP / SOAP

def _abrir(req):
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.read().decode('utf-8', errors='replace')
    except urllib.error.HTTPError as e:
        corpo = e.read().decode('utf-8', errors='replace')
        falha = _falha_soap(corpo)
        raise ZimbraErro(f'HTTP {e.code}' + (f': {falha}' if falha else ''))
    except urllib.error.URLError as e:
        raise ZimbraErro(f'Erro de rede: {e.reason}')
    except TimeoutError:
        raise ZimbraErro('Tempo esgotado (60s) falando com o Zimbra.')


def _falha_soap(texto):
    try:
        dados = json.loads(texto)
    except ValueError:
        return None
    f = (dados.get('Body') or {}).get('Fault')
    if not f:
        return None
    razao = (f.get('Reason') or {}).get('Text') or 'falha SOAP'
    codigo = (((f.get('Detail') or {}).get('Error') or {}).get('Code'))
    return f'{codigo}: {razao}' if codigo else razao


def _post_json(url, envelope):
    req = urllib.request.Request(url + '/service/soap', data=json.dumps(envelope).encode(), method='POST',
                                 headers={'Content-Type': 'application/json; charset=utf-8'})
    texto = _abrir(req)
    falha = _falha_soap(texto)
    if falha:
        raise ZimbraErro(falha)
    try:
        return json.loads(texto)['Body']
    except (ValueError, KeyError):
        raise ZimbraErro('Resposta do Zimbra em formato inesperado.')


def auth():
    """AuthRequest; o token fica em memória durante o processo."""
    if _cache['token']:
        return _cache['token']
    url, user, senha = config()
    corpo = _post_json(url, montar_auth(user, senha))
    try:
        token = corpo['AuthResponse']['authToken'][0]['_content']
    except (KeyError, IndexError, TypeError):
        raise ZimbraErro('AuthResponse sem authToken (conta com 2FA/senha de aplicativo?).')
    _cache['token'] = token
    return token


def soap(nome, corpo):
    """Chama uma request autenticada e devolve o conteúdo de <nome>Response."""
    url, _, _ = config()
    token = auth()
    body = _post_json(url, montar_envelope(nome, corpo, token))
    return body.get(nome.replace('Request', 'Response'), {})


def upload_zimbra(nome_arquivo, conteudo, tipo='application/pdf'):
    """Upload `/service/upload?fmt=raw,extended`; devolve o aid do anexo."""
    url, _, _ = config()
    token = auth()
    nome_seguro = re.sub(r'[^A-Za-z0-9._ -]', '_', nome_arquivo) or 'anexo.pdf'
    req = urllib.request.Request(
        url + '/service/upload?fmt=raw,extended', data=conteudo, method='POST',
        headers={'Content-Type': tipo, 'Cookie': 'ZM_AUTH_TOKEN=' + token,
                 'Content-Disposition': f'attachment; filename="{nome_seguro}"'})
    aid = extrair_aid(_abrir(req))
    if not aid:
        raise ZimbraErro('Upload sem aid na resposta.')
    return aid


def extrair_aid(texto):
    """Respostas: `200,'null','<aid>'` (raw) ou `200,'null',[{"aid":"...",...}]` (extended)."""
    m = re.search(r'"aid"\s*:\s*"([^"]+)"', texto)
    if m:
        return m.group(1)
    m = re.match(r"\s*200\s*,\s*'[^']*'\s*,\s*'([^']+)'", texto)
    return m.group(1) if m else None


# ---------------------------------------------------------------- texto

def extrair_link_proposta(texto):
    for m in re.finditer(r'https?://[^\s<>"\')\]]+', texto or ''):
        link = m.group(0).rstrip('.,;:!?')
        if any(k in link for k in MARCADORES_PROPOSTA):
            return link
    return None


def limpar_corpo(texto, limite=4000):
    """Remove citação, linhas '>' e assinatura ('-- '); limita o tamanho."""
    t = (texto or '').replace('\r\n', '\n').replace('\r', '\n')
    cortes = [
        r'^[ \t]*Em\s[^\n]{0,250}\n?[^\n]{0,120}?escreveu:',
        r'^[ \t]*On\s[^\n]{0,250}\n?[^\n]{0,120}?wrote:',
        r'^[ \t]*-{2,}\s*(Original Message|Mensagem original|Forwarded message|Mensagem encaminhada)\s*-{2,}',
        r'^[ \t]*_{5,}\s*$',
        r'^-- ?$',
    ]
    pos = len(t)
    for padrao in cortes:
        m = re.search(padrao, t, re.MULTILINE | re.IGNORECASE)
        if m:
            pos = min(pos, m.start())
    t = t[:pos]
    linhas = [ln for ln in t.split('\n') if not ln.lstrip().startswith('>')]
    t = '\n'.join(linhas)
    t = re.sub(r'^[ \t]*(Enviado do meu .*|Sent from my .*)$', '', t, flags=re.MULTILINE | re.IGNORECASE)
    t = re.sub(r'[ \t]+\n', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t).strip()
    return t[:limite]


def resumo_de(texto, tamanho=200):
    return re.sub(r'\s+', ' ', texto or '').strip()[:tamanho]


def html_para_texto(h):
    h = re.sub(r'(?is)<(script|style).*?</\1>', '', h)
    h = re.sub(r'(?i)<br\s*/?>|</p>|</div>|</li>|</tr>', '\n', h)
    h = re.sub(r'<[^>]+>', '', h)
    return html_mod.unescape(h)


def corpo_texto(msg):
    """Percorre a árvore mp de um GetMsgResponse.m; prefere text/plain, cai para text/html."""
    planos, htmls = [], []

    def anda(p):
        if not isinstance(p, dict):
            return
        if p.get('cd') != 'attachment' and 'content' in p:
            if p.get('ct') == 'text/plain':
                planos.append(p['content'])
            elif p.get('ct') == 'text/html':
                htmls.append(p['content'])
        for f in p.get('mp') or []:
            anda(f)

    for raiz in msg.get('mp') or []:
        anda(raiz)
    if planos:
        return '\n'.join(planos)
    if htmls:
        return html_para_texto('\n'.join(htmls))
    return msg.get('fr', '')


def remetente(msg):
    for e in msg.get('e') or []:
        if e.get('t') == 'f' and e.get('a'):
            return e['a'].strip().lower()
    return None


# ---------------------------------------------------------------- rascunho em HTML

RE_TELEFONE = re.compile(r'\(?\d{2}\)?[\s.-]*9?\d{4}[\s.-]?\d{4}')
RE_ASSINATURA_ANTIGA = re.compile(
    r'garnet\s+cosm[eé]ticos|equipe\s+garnet|@garnetcosmeticos|@\S+\.\S+|www\.|https?://'
    r'|n[aã]o\s+receber|responda\s+com|\bsair\b', re.IGNORECASE)


def remover_assinatura_antiga(texto):
    """Corta, depois de 'Atenciosamente,', as linhas de assinatura antiga (Garnet Cosméticos, Equipe Garnet,
    telefone, e-mail, @garnetcosmeticos, aviso de opt-out). O texto deve terminar em 'Atenciosamente,'."""
    linhas = (texto or '').replace('\r\n', '\n').replace('\r', '\n').split('\n')
    idx = None
    for i, ln in enumerate(linhas):
        if re.match(r'^\s*Atenciosamente,?\s*$', ln, re.IGNORECASE):
            idx = i
    if idx is None:
        return '\n'.join(linhas).strip()
    resto = [ln for ln in linhas[idx + 1:]
             if ln.strip() and not (RE_ASSINATURA_ANTIGA.search(ln) or RE_TELEFONE.search(ln))]
    return '\n'.join(linhas[:idx + 1] + resto).strip()


ESTILO_P = 'margin:0 0 12px 0'


def texto_para_html(texto):
    """Parágrafos separados por linha em branco; linhas '- ' viram <ul><li>; tudo escapado."""
    saida = []
    for bloco in re.split(r'\n\s*\n', (texto or '').replace('\r\n', '\n').strip()):
        par, itens = [], []

        def fecha_par():
            if par:
                saida.append(f'<p style="{ESTILO_P}">' + '<br>'.join(par) + '</p>')
                par.clear()

        def fecha_lista():
            if itens:
                saida.append('<ul style="margin:0 0 12px 0;padding-left:30px">'
                             + ''.join(f'<li style="margin:0">{i}</li>' for i in itens) + '</ul>')
                itens.clear()

        for ln in bloco.split('\n'):
            if not ln.strip():
                continue
            if ln.lstrip().startswith('- '):
                fecha_par()
                itens.append(html_mod.escape(ln.lstrip()[2:].strip()))
            else:
                fecha_lista()
                par.append(html_mod.escape(ln.strip()))
        fecha_par()
        fecha_lista()
    return '\n'.join(saida)


def assinatura_valida(a):
    return a if isinstance(a, dict) and a.get('nome') else None


def assinatura_html(a, logo_url=LOGO_URL):
    e = lambda k: html_mod.escape(str(a.get(k) or ''))
    fone = e('telefone')
    tel = re.sub(r'[^\d+]', '', a.get('telefone') or '')
    linhas = [f'<div style="font-weight:bold;font-size:12px;color:#000">{e("nome")}</div>']
    if a.get('cargo'):
        linhas.append(f'<div style="font-size:11px;color:#444;margin-top:2px">{e("cargo")}</div>')
    if fone:
        linhas.append(f'<div style="font-size:11px;margin-top:12px"><a href="tel:{tel}" '
                      f'style="color:#0072c6;text-decoration:none">{fone}</a></div>')
    if a.get('site'):
        linhas.append(f'<div style="font-size:11px;color:#444;margin-top:4px">{e("site")}</div>')
    return ('<table cellpadding="0" cellspacing="0" border="0" style="margin-top:28px"><tr>'
            f'<td style="vertical-align:top;padding-right:24px"><img src="{html_mod.escape(logo_url)}" '
            'width="80" height="80" alt="Garnet" style="border-radius:50%;display:block"></td>'
            '<td style="vertical-align:top;padding-top:2px;font-family:Arial,Helvetica,sans-serif">'
            + ''.join(linhas) + '</td></tr></table>')


def montar_html(texto, assinatura):
    corpo = texto_para_html(remover_assinatura_antiga(texto))
    partes = ['<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;line-height:1.3">',
              corpo]
    a = assinatura_valida(assinatura)
    if a:
        partes.append(assinatura_html(a))
    partes.append(f'<p style="margin:20px 0 0 0;font-size:11px;color:#888">{html_mod.escape(AVISO_SAIR)}</p></div>')
    return '\n'.join(partes)


def montar_texto_plano(texto, assinatura):
    t = remover_assinatura_antiga(texto)
    a = assinatura_valida(assinatura)
    if a:
        t += '\n\n' + '\n'.join(str(a[k]) for k in ('nome', 'cargo', 'telefone', 'site') if a.get(k))
    return t + '\n\n' + AVISO_SAIR


def escolher_anexo(texto, passo, url_apresentacao):
    """(tipo, link, nome_do_arquivo) ou None. Proposta no texto = 2º contato; senão apresentação nos passos 0/1."""
    link = extrair_link_proposta(texto)
    if link:
        return 'proposta', link, NOME_PROPOSTA
    if passo in (0, 1) and url_apresentacao:
        return 'apresentacao', url_apresentacao, NOME_APRESENTACAO
    return None


def normalizar_assunto(s):
    s = unicodedata.normalize('NFKD', s or '')
    s = ''.join(c for c in s if not unicodedata.combining(c)).casefold()
    s = re.sub(r'^\s*((re|res|enc|fwd?|fw)\s*:\s*)+', '', s)
    return re.sub(r'\s+', ' ', s).strip()


# ---------------------------------------------------------------- banco (via ai_db, subprocess)

def db_cru(*args):
    r = subprocess.run([sys.executable, '-I', AI_DB, *args], capture_output=True, text=True, timeout=120)
    return r.returncode, r.stdout, r.stderr


def db(*args):
    """Roda ai_db e devolve o JSON; erro vira ZimbraErro."""
    rc, out, err = db_cru(*args)
    if rc != 0:
        raise ZimbraErro('ai_db: ' + censurar(err.strip().splitlines()[0] if err.strip() else f'saída {rc}'))
    try:
        return json.loads(out) if out.strip() else None
    except ValueError:
        raise ZimbraErro('ai_db devolveu saída inválida.')


def db_post_unico(tabela, corpo):
    """post; devolve (linha, False) ou (None, True) se a chave única já existia (HTTP 409)."""
    rc, out, err = db_cru('post', tabela, json.dumps(corpo, ensure_ascii=False))
    if rc == 0:
        linhas = json.loads(out)
        return (linhas[0] if linhas else {}), False
    if 'HTTP 409' in err or '23505' in err:
        return None, True
    raise ZimbraErro('ai_db: ' + censurar(err.strip().splitlines()[0] if err.strip() else f'saída {rc}'))


def q(valor):
    return urllib.parse.quote(str(valor), safe='')


def buscar_lead_por_email(addr):
    addr = (addr or '').strip().lower()
    if not RE_EMAIL.match(addr):
        return None
    for l in db('get', 'leads', f'select=id,nome,email&email=ilike.{q(addr)}&limit=5') or []:
        if (l.get('email') or '').strip().lower() == addr:
            return l
    filtro = json.dumps({'contatos': [{'email': addr}]}, separators=(',', ':'), ensure_ascii=False)
    achados = db('get', 'leads', f'select=id,nome,email&extras=cs.{q(filtro)}&limit=1') or []
    return achados[0] if achados else None


def fila_existente(chave):
    r = db('get', 'ai_fila', f'chave_idempotencia=eq.{q(chave)}&select=id,payload,lead_id&limit=1') or []
    return r[0] if r else None


# ---------------------------------------------------------------- comandos

def cmd_testar():
    info = soap('GetInfoRequest', montar_getinfo())
    conta = info.get('name')
    if not conta:
        raise ZimbraErro('GetInfoResponse sem nome da conta.')
    return {'ok': True, 'conta': conta}


def registrar_resposta(msg_id, lead, texto_limpo):
    """Idempotência pela fila; devolve 'nova' ou 'repetida'."""
    chave = f'zimbra-{msg_id}'
    linha, conflito = db_post_unico('ai_fila', {
        'tipo': 'classificar_resposta', 'agente_id': 'atendimento', 'lead_id': lead['id'],
        'prioridade': 1, 'status': 'pendente', 'chave_idempotencia': chave,
        'payload': {'interacao_id': None, 'rascunho_id': None, 'origem': 'zimbra'}})
    if conflito:
        existente = fila_existente(chave)
        # recuperação: fila criada mas o processo caiu antes de gravar a interação
        if not existente or (existente.get('payload') or {}).get('interacao_id'):
            return 'repetida'
        fila_id = existente['id']
    else:
        fila_id = linha['id']
    inter = db('post', 'ai_interacoes', json.dumps({
        'lead_id': lead['id'], 'canal': 'email', 'direcao': 'entrada', 'registrado_por': 'zimbra',
        'resumo': resumo_de(texto_limpo), 'conteudo': texto_limpo}, ensure_ascii=False))
    inter_id = inter[0]['id']
    db('patch', 'ai_fila', f'id=eq.{fila_id}', json.dumps(
        {'payload': {'interacao_id': inter_id, 'rascunho_id': None, 'origem': 'zimbra'}}))
    return 'nova'


def cmd_ler_respostas(desde, limite, dry):
    _, user, _ = config()
    res = soap('SearchRequest', montar_search(montar_query_inbox(desde), limite))
    msgs = res.get('m') or []
    cont = {'lidas': len(msgs), 'de_leads': 0, 'novas': 0, 'ignoradas': 0, 'repetidas': 0}
    for m in msgs:
        addr = remetente(m)
        if not addr or addr == user.lower():
            cont['ignoradas'] += 1
            continue
        lead = buscar_lead_por_email(addr)
        if not lead:
            cont['ignoradas'] += 1  # não é lead: nada é gravado
            continue
        cont['de_leads'] += 1
        chave = f'zimbra-{m["id"]}'
        if dry:
            ex = fila_existente(chave)
            if ex and (ex.get('payload') or {}).get('interacao_id'):
                cont['repetidas'] += 1
            else:
                cont['novas'] += 1
            continue
        ex = fila_existente(chave)
        if ex and (ex.get('payload') or {}).get('interacao_id'):
            cont['repetidas'] += 1
            continue
        det = soap('GetMsgRequest', montar_getmsg(m['id']))
        msg = (det.get('m') or [{}])[0]
        texto = limpar_corpo(corpo_texto(msg)) or resumo_de(msg.get('fr', ''))
        cont['novas' if registrar_resposta(m['id'], lead, texto) == 'nova' else 'repetidas'] += 1
    if dry:
        cont['dry_run'] = True
    return cont


def baixar_pdf(link):
    base = urllib.parse.urlparse(os.environ.get('SUPABASE_URL', 'https://papaicnydbcajkfghwem.supabase.co'))
    alvo = urllib.parse.urlparse(link)
    if alvo.scheme != 'https' or alvo.hostname != base.hostname:
        raise ZimbraErro('link da proposta fora do domínio permitido')
    with urllib.request.urlopen(urllib.request.Request(link), timeout=TIMEOUT) as resp:
        dados = resp.read(LIMITE_PDF + 1)
    if len(dados) > LIMITE_PDF:
        raise ZimbraErro('PDF maior que 15 MB')
    if not dados.startswith(b'%PDF'):
        raise ZimbraErro('arquivo baixado não é PDF')
    return dados


def email_do_lead(lead_id):
    r = db('get', 'leads', f'id=eq.{q(lead_id)}&select=id,nome,email,extras&limit=1') or []
    if not r:
        return None, None
    lead = r[0]
    email = (lead.get('email') or '').strip()
    if not RE_EMAIL.match(email):
        email = ''
        contatos = ((lead.get('extras') or {}).get('contatos')) or []
        for c in contatos:
            e = (c.get('email') or '').strip() if isinstance(c, dict) else ''
            if RE_EMAIL.match(e):
                email = e
                break
    return (lead.get('nome') or 'lead'), (email or None)


def cmd_criar_rascunhos(dry):
    rascunhos = db('get', 'ai_rascunhos',
                   'status=eq.aprovado&canal=eq.email&select=id,lead_id,assunto,texto,texto_final,passo_cadencia'
                   '&order=aprovado_em.asc&limit=50') or []
    cont = {'aprovados_email': len(rascunhos), 'criados': 0, 'sem_anexo': 0, 'ja_criados': 0, 'ignorados': 0}
    if rascunhos:
        chaves = ','.join(f'zdraft-{r["id"]}' for r in rascunhos)
        feitos = {x['chave_idempotencia'] for x in
                  db('get', 'ai_fila', f'chave_idempotencia=in.({q(chaves)})&select=chave_idempotencia') or []}
    else:
        feitos = set()
    cfg = {}
    for r in rascunhos:
        chave = f'zdraft-{r["id"]}'
        if chave in feitos:
            cont['ja_criados'] += 1
            continue
        nome, email = email_do_lead(r['lead_id'])
        corpo = (r.get('texto_final') or r.get('texto') or '').strip()
        if not email or not corpo or db('bloqueado', r['lead_id']) is True:
            motivo = ('lead bloqueado' if email and corpo else 'sem e-mail ou sem texto')
            cont['ignorados'] += 1
            if not dry:
                db('post', 'ai_fila', json.dumps({
                    'tipo': 'rascunho_zimbra', 'agente_id': 'atendimento', 'lead_id': r['lead_id'], 'prioridade': 3,
                    'status': 'falhou', 'chave_idempotencia': chave, 'payload': {'rascunho_id': r['id']},
                    'resultado': {'motivo': motivo}}))
                db('evento', 'atendimento', 'alerta',
                   f'Rascunho de e-mail não enviado ao Zimbra ({motivo}); abra no painel.', '--lead', r['lead_id'])
            continue
        if not cfg:
            ap = db('config', 'anexo_primeiro_contato')
            cfg['apresentacao'] = ap if isinstance(ap, str) else None
            cfg['assinatura'] = db('config', 'assinatura')
        anexo = escolher_anexo(corpo, r.get('passo_cadencia'), cfg['apresentacao'])
        if dry:
            cont['criados'] += 1
            cont['sem_anexo'] += 0 if anexo else 1
            cont.setdefault('anexo_proposta', 0)
            cont.setdefault('anexo_apresentacao', 0)
            if anexo:
                cont['anexo_' + anexo[0]] += 1
            continue
        aid, aviso = None, None
        if anexo:
            try:
                aid = upload_zimbra(anexo[2], baixar_pdf(anexo[1]))
            except (ZimbraErro, urllib.error.URLError, OSError) as e:
                aviso = censurar(f'anexo não criado: {e}')
        if not aid:
            cont['sem_anexo'] += 1
        res = soap('SaveDraftRequest', montar_savedraft(
            email, r.get('assunto') or 'Garnet Cosméticos', montar_texto_plano(corpo, cfg['assinatura']), aid,
            montar_html(corpo, cfg['assinatura'])))
        draft_id = ((res.get('m') or [{}])[0]).get('id')
        if not draft_id:
            raise ZimbraErro('SaveDraftResponse sem id do rascunho.')
        resultado = {'zimbra_draft_id': draft_id, 'anexo': bool(aid)}
        if aid:
            resultado['anexo_tipo'] = anexo[0]
        if aviso:
            resultado['aviso'] = aviso
        db_post_unico('ai_fila', {
            'tipo': 'rascunho_zimbra', 'agente_id': 'atendimento', 'lead_id': r['lead_id'], 'prioridade': 3,
            'status': 'concluida', 'chave_idempotencia': chave, 'payload': {'rascunho_id': r['id']},
            'resultado': resultado})
        db('evento', 'atendimento', 'acao', f'Rascunho criado no Zimbra para {nome}; é só abrir e enviar',
           '--lead', r['lead_id'], '--dados', json.dumps({'rascunho_id': r['id'], **resultado}))
        if aviso:
            db('evento', 'atendimento', 'alerta', f'Rascunho criado sem o anexo: {aviso}',
               '--lead', r['lead_id'])
        cont['criados'] += 1
    if dry:
        cont['dry_run'] = True
    return cont


def cmd_marcar_enviados(dry):
    rascunhos = db('get', 'ai_rascunhos', 'status=eq.aprovado&canal=eq.email&select=id,lead_id,assunto'
                   '&order=aprovado_em.asc&limit=100') or []
    cont = {'aprovados_email': len(rascunhos), 'marcados': 0, 'sem_zdraft': 0, 'nao_encontrados': 0,
            'ja_marcados': 0}
    if not rascunhos:
        return {**cont, **({'dry_run': True} if dry else {})}
    zd = {x['chave_idempotencia']: x for x in db(
        'get', 'ai_fila', 'chave_idempotencia=in.(' + q(','.join(f'zdraft-{r["id"]}' for r in rascunhos))
        + ')&status=eq.concluida&select=chave_idempotencia,created_at') or []}
    zs = {x['chave_idempotencia'] for x in db(
        'get', 'ai_fila', 'chave_idempotencia=in.(' + q(','.join(f'zsent-{r["id"]}' for r in rascunhos))
        + ')&select=chave_idempotencia') or []}
    for r in rascunhos:
        marca = zd.get(f'zdraft-{r["id"]}')
        if not marca:
            cont['sem_zdraft'] += 1
            continue
        if f'zsent-{r["id"]}' in zs:
            cont['ja_marcados'] += 1
            continue
        nome, email = email_do_lead(r['lead_id'])
        if not email:
            cont['nao_encontrados'] += 1
            continue
        criado = datetime.fromisoformat(marca['created_at'].replace('Z', '+00:00'))
        res = soap('SearchRequest', montar_search(montar_query_enviados(email, criado.timestamp() * 1000 - 60000), 20))
        alvo = normalizar_assunto(r.get('assunto'))
        achada = next((m for m in res.get('m') or [] if normalizar_assunto(m.get('su')) == alvo), None)
        if not achada:
            cont['nao_encontrados'] += 1
            continue
        if dry:
            cont['marcados'] += 1
            continue
        enviado_em = datetime.fromtimestamp(int(achada['d']) / 1000, tz=timezone.utc).isoformat()
        assunto = r.get('assunto') or achada.get('su') or ''
        db('patch', 'ai_rascunhos', f'id=eq.{q(r["id"])}', json.dumps({'status': 'enviado', 'enviado_em': enviado_em}))
        db('post', 'ai_interacoes', json.dumps({
            'lead_id': r['lead_id'], 'rascunho_id': r['id'], 'canal': 'email', 'direcao': 'saida',
            'registrado_por': 'zimbra',
            'resumo': f'E-mail enviado pelo Zimbra: {assunto}'}, ensure_ascii=False))
        db_post_unico('ai_fila', {
            'tipo': 'rascunho_zimbra', 'agente_id': 'atendimento', 'lead_id': r['lead_id'], 'prioridade': 3,
            'status': 'concluida', 'chave_idempotencia': f'zsent-{r["id"]}', 'payload': {'rascunho_id': r['id']},
            'resultado': {'enviado_em': enviado_em, 'zimbra_msg_id': achada.get('id')}})
        db('evento', 'atendimento', 'acao', f'E-mail enviado pelo Zimbra para {nome}; rascunho marcado como enviado',
           '--lead', r['lead_id'], '--dados', json.dumps({'rascunho_id': r['id'], 'enviado_em': enviado_em}))
        cont['marcados'] += 1
    if dry:
        cont['dry_run'] = True
    return cont


# ---------------------------------------------------------------- main

def principal(argv):
    if len(argv) < 2 or argv[1] in ('-h', '--help', 'help'):
        uso(codigo=0)
    acao, a = argv[1], argv[2:]
    dry = '--dry-run' in a
    a = [x for x in a if x != '--dry-run']
    try:
        if acao == 'testar':
            r = cmd_testar()
        elif acao == 'ler-respostas':
            desde, limite, i = date.today() - timedelta(days=3), 50, 0
            while i < len(a):
                if a[i] == '--desde' and i + 1 < len(a):
                    try:
                        desde = datetime.strptime(a[i + 1], '%Y-%m-%d').date()
                    except ValueError:
                        uso('--desde deve ser AAAA-MM-DD')
                elif a[i] == '--limite' and i + 1 < len(a) and a[i + 1].isdigit() and int(a[i + 1]) > 0:
                    limite = int(a[i + 1])
                else:
                    uso(f'Argumento inválido: {a[i]}')
                i += 2
            r = cmd_ler_respostas(desde, limite, dry)
        elif acao == 'criar-rascunhos':
            if a:
                uso(f'Argumento inválido: {a[0]}')
            r = cmd_criar_rascunhos(dry)
        elif acao == 'marcar-enviados':
            if a:
                uso(f'Argumento inválido: {a[0]}')
            r = cmd_marcar_enviados(dry)
        else:
            uso(f'Ação desconhecida: {acao}')
    except ZimbraErro as e:
        print('Erro: ' + censurar(e), file=sys.stderr)
        sys.exit(1)
    print(json.dumps(r, ensure_ascii=False))


if __name__ == '__main__':
    principal(sys.argv)
