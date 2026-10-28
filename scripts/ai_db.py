"""Acesso da Garnet AI ao banco (API REST do Supabase), só com a biblioteca padrão.

Credenciais SEMPRE por variável de ambiente (o repositório é público, nunca grave chave aqui):
  SUPABASE_URL                 https://papaicnydbcajkfghwem.supabase.co (padrão, se não definida)
  SUPABASE_SERVICE_ROLE_KEY    chave secreta — ignora RLS (nunca é impressa)

Escrita (post/patch) SOMENTE em tabelas ai_*; qualquer outra é recusada (saída 2).
JSON pode ser inline ou @caminho/arquivo.json. Saída sempre JSON em stdout.
Códigos de saída: 0 ok | 1 erro HTTP/rede | 2 uso inválido/escrita recusada | 3 kill_switch ligado.

Uso (python3 -I scripts/ai_db.py ...):
  get <tabela|view> [query-postgrest]                 ex.: get ai_v_leads_alvo "prioridade=eq.1&limit=10"
  post <tabela_ai> <json> [--upsert] [--on-conflict col]   insere (lista ou objeto), retorna linhas;
                                                      --upsert faz merge-duplicates (pela pk, ou por col)
  patch <tabela_ai> <query> <json>                    atualiza, retorna linhas
  config <chave>                                      valor de ai_config
  turno-iniciar <tipo>                                sai com 3 se kill_switch = true; imprime {id}
  turno-finalizar <turno_id> <status> <resumo> [--metricas JSON]
  exec-iniciar <turno_id> <agente_id> <instancia|-> <tarefa>   imprime {id}; status = trabalhando
  exec-atualizar <execucao_id> <tarefa>               muda o "fazendo agora"
  exec-finalizar <execucao_id> <status> <resultado> [--erro TEXTO]
  evento <agente_id> <tipo> <mensagem> [--turno ID] [--execucao ID] [--lead ID] [--dados JSON]
  bloqueado <lead_id>                                 true/false

Filtros seguem o PostgREST: https://postgrest.org/en/stable/references/api/tables_views.html
"""
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

URL = os.environ.get('SUPABASE_URL', 'https://papaicnydbcajkfghwem.supabase.co').rstrip('/')
RE_TABELA = re.compile(r'^[a-z][a-z0-9_]*$')


def uso(msg=None, codigo=2):
    if msg:
        print(msg, file=sys.stderr)
    print(__doc__, file=sys.stderr)
    sys.exit(codigo)


def exigir_ai(tabela):
    if not RE_TABELA.match(tabela) or not tabela.startswith('ai_'):
        print(f'Escrita recusada: "{tabela}" não é uma tabela ai_*.', file=sys.stderr)
        sys.exit(2)


def json_arg(valor):
    try:
        if valor.startswith('@'):
            with open(valor[1:], encoding='utf-8') as f:
                return json.load(f)
        return json.loads(valor)
    except (OSError, ValueError) as e:
        print(f'JSON inválido ({e.__class__.__name__}): {e}', file=sys.stderr)
        sys.exit(2)


def requisitar(metodo, caminho, corpo=None, extra=None):
    chave = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    if not chave:
        print('Defina SUPABASE_SERVICE_ROLE_KEY no ambiente.', file=sys.stderr)
        sys.exit(2)
    h = {'apikey': chave, 'Authorization': f'Bearer {chave}', 'Content-Type': 'application/json',
         'Prefer': 'return=representation'}
    h.update(extra or {})
    dados = json.dumps(corpo).encode() if corpo is not None else None
    r = urllib.request.Request(URL + caminho, data=dados, method=metodo, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=60) as resp:
            texto = resp.read().decode()
            return json.loads(texto) if texto else None
    except urllib.error.HTTPError as e:
        corpo_erro = e.read().decode(errors='replace').replace(chave, '***')
        print(f'HTTP {e.code}: {corpo_erro}', file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f'Erro de rede: {str(e.reason).replace(chave, "***")}', file=sys.stderr)
        sys.exit(1)


def saida(dados):
    print(json.dumps(dados, ensure_ascii=False, indent=1))


def agora():
    return datetime.now(timezone.utc).isoformat()


def get(tabela, query=''):
    if not RE_TABELA.match(tabela):
        uso(f'Nome de tabela inválido: {tabela}')
    return requisitar('GET', f'/rest/v1/{tabela}' + (f'?{query}' if query else ''))


def post(tabela, corpo, upsert=False, on_conflict=None):
    exigir_ai(tabela)
    caminho = f'/rest/v1/{tabela}'
    extra = None
    if on_conflict:
        caminho += '?on_conflict=' + urllib.parse.quote(on_conflict, safe=',')
    if upsert or on_conflict:
        extra = {'Prefer': 'resolution=merge-duplicates,return=representation'}
    return requisitar('POST', caminho, corpo, extra)


def patch(tabela, query, corpo):
    exigir_ai(tabela)
    if not query:
        uso('patch exige uma query de filtro (ex.: id=eq.<uuid>).')
    return requisitar('PATCH', f'/rest/v1/{tabela}?{query}', corpo)


def opcoes(args, nomes):
    """Separa --flag valor do resto; retorna (posicionais, {flag: valor})."""
    pos, op, i = [], {}, 0
    while i < len(args):
        if args[i] in nomes:
            if i + 1 >= len(args):
                uso(f'{args[i]} exige um valor.')
            op[args[i]] = args[i + 1]
            i += 2
        else:
            pos.append(args[i])
            i += 1
    return pos, op


def primeira(linhas):
    if not linhas:
        print('Nenhuma linha afetada (id inexistente ou sem permissão).', file=sys.stderr)
        sys.exit(1)
    return linhas[0]


def valor_config(chave):
    linhas = get('ai_config', 'select=valor&chave=eq.' + urllib.parse.quote(chave, safe=''))
    return linhas[0]['valor'] if linhas else None


def principal(argv):
    if len(argv) < 2 or argv[1] in ('-h', '--help', 'help'):
        uso(codigo=0)
    acao, a = argv[1], argv[2:]

    def n(minimo):
        if len(a) < minimo:
            uso(f'Argumentos insuficientes para "{acao}".')

    if acao == 'get':
        n(1)
        saida(get(a[0], a[1] if len(a) > 1 else 'limit=20'))
    elif acao == 'post':
        pos, op = opcoes([x for x in a if x != '--upsert'], {'--on-conflict'})
        if len(pos) < 2:
            uso('post <tabela_ai> <json> [--upsert] [--on-conflict col]')
        exigir_ai(pos[0])
        saida(post(pos[0], json_arg(pos[1]), '--upsert' in a, op.get('--on-conflict')))
    elif acao == 'patch':
        n(3)
        exigir_ai(a[0])
        saida(patch(a[0], a[1], json_arg(a[2])))
    elif acao == 'config':
        n(1)
        saida(valor_config(a[0]))
    elif acao == 'turno-iniciar':
        n(1)
        if valor_config('kill_switch') is True:
            print('kill_switch ligado: turno não iniciado.', file=sys.stderr)
            sys.exit(3)
        t = primeira(post('ai_turnos', {'tipo': a[0], 'status': 'em_andamento'}))
        saida({'id': t['id']})
    elif acao == 'turno-finalizar':
        pos, op = opcoes(a, {'--metricas'})
        if len(pos) < 3:
            uso('turno-finalizar <turno_id> <status> <resumo> [--metricas JSON]')
        corpo = {'status': pos[1], 'resumo': pos[2], 'finalizado_em': agora()}
        if '--metricas' in op:
            corpo['metricas'] = json_arg(op['--metricas'])
        saida(primeira(patch('ai_turnos', 'id=eq.' + pos[0], corpo)))
    elif acao == 'exec-iniciar':
        n(4)
        corpo = {'turno_id': a[0], 'agente_id': a[1], 'status': 'trabalhando', 'tarefa': a[3]}
        if a[2] != '-':
            corpo['instancia'] = a[2]
        saida({'id': primeira(post('ai_execucoes', corpo))['id']})
    elif acao == 'exec-atualizar':
        n(2)
        saida(primeira(patch('ai_execucoes', 'id=eq.' + a[0], {'tarefa': a[1]})))
    elif acao == 'exec-finalizar':
        pos, op = opcoes(a, {'--erro'})
        if len(pos) < 3:
            uso('exec-finalizar <execucao_id> <status> <resultado> [--erro TEXTO]')
        corpo = {'status': pos[1], 'resultado': pos[2], 'finalizado_em': agora()}
        if '--erro' in op:
            corpo['erro'] = op['--erro']
        saida(primeira(patch('ai_execucoes', 'id=eq.' + pos[0], corpo)))
    elif acao == 'evento':
        pos, op = opcoes(a, {'--turno', '--execucao', '--lead', '--dados'})
        if len(pos) < 3:
            uso('evento <agente_id> <tipo> <mensagem> [--turno ID] [--execucao ID] [--lead ID] [--dados JSON]')
        corpo = {'agente_id': pos[0], 'tipo': pos[1], 'mensagem': pos[2]}
        for flag, campo in (('--turno', 'turno_id'), ('--execucao', 'execucao_id'), ('--lead', 'lead_id')):
            if flag in op:
                corpo[campo] = op[flag]
        if '--dados' in op:
            corpo['dados'] = json_arg(op['--dados'])
        saida(primeira(post('ai_eventos', corpo)))
    elif acao == 'bloqueado':
        n(1)
        r = requisitar('POST', '/rest/v1/rpc/ai_lead_bloqueado', {'lead': a[0]})
        print('true' if r is True else 'false')
    else:
        uso(f'Ação desconhecida: {acao}')


if __name__ == '__main__':
    principal(sys.argv)
