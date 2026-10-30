"""Testes offline de scripts/zimbra.py (sem rede). Rodar: python3 -I scripts/tests/test_zimbra.py"""
import importlib.util
import json
import os
import unittest
from datetime import date
from unittest import mock

CAMINHO = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'zimbra.py')
spec = importlib.util.spec_from_file_location('zimbra', CAMINHO)
z = importlib.util.module_from_spec(spec)
spec.loader.exec_module(z)


class Montagem(unittest.TestCase):
    def test_auth(self):
        e = z.montar_auth('a@x.com', 'segredo')
        corpo = e['Body']['AuthRequest']
        self.assertEqual(corpo['_jsns'], 'urn:zimbraAccount')
        self.assertEqual(corpo['account'], {'by': 'name', '_content': 'a@x.com'})
        self.assertEqual(corpo['password'], {'_content': 'segredo'})
        self.assertNotIn('authToken', e['Header']['context'])

    def test_search_e_query(self):
        s = z.montar_search('in:inbox after:1792800000000', 30)
        self.assertEqual((s['_jsns'], s['types'], s['limit']), ('urn:zimbraMail', 'message', 30))
        self.assertEqual(z.montar_query_inbox(date(2026, 10, 25)), 'in:inbox after:1792800000000')
        env = z.montar_envelope('SearchRequest', s, 'tok')
        self.assertEqual(env['Header']['context']['authToken'], 'tok')

    def test_savedraft(self):
        d = z.montar_savedraft('l@x.com', 'Assunto', 'Olá', 'AID1')['m']
        self.assertEqual(d['e'], [{'t': 't', 'a': 'l@x.com'}])
        self.assertEqual(d['su'], 'Assunto')
        self.assertEqual(d['mp'], {'ct': 'text/plain', 'content': 'Olá'})
        self.assertEqual(d['attach'], {'aid': 'AID1'})
        self.assertNotIn('attach', z.montar_savedraft('l@x.com', 's', 'c')['m'])

    def test_sem_envio(self):
        with open(CAMINHO, encoding='utf-8') as f:
            self.assertNotIn('SendMsg', f.read())

    def test_aid(self):
        self.assertEqual(z.extrair_aid('200,\'null\',[{"aid":"abc:1","ct":"application/pdf"}]'), 'abc:1')
        self.assertEqual(z.extrair_aid("200,'null','xyz'"), 'xyz')
        self.assertIsNone(z.extrair_aid('500,"erro"'))


class Texto(unittest.TestCase):
    def test_link(self):
        t = 'Veja: https://x.supabase.co/storage/v1/object/public/ai-midia/propostas/abc.pdf. Obrigada! https://garnet.com.br'
        self.assertEqual(z.extrair_link_proposta(t),
                         'https://x.supabase.co/storage/v1/object/public/ai-midia/propostas/abc.pdf')
        g = 'Proposta (https://x.supabase.co/storage/v1/object/public/ai-midia/materiais/proposta-garnet.pdf)'
        self.assertTrue(z.extrair_link_proposta(g).endswith('/materiais/proposta-garnet.pdf'))
        self.assertIsNone(z.extrair_link_proposta('só https://garnetcosmeticos.com.br'))

    def test_limpeza(self):
        bruto = ('Oi, tenho interesse!\nQuero 1000 peças.\n\n'
                 'Em seg., 26 de out. de 2026 às 10:00, Garnet <c@garnet.com>\nescreveu:\n> proposta\n> blá\n')
        self.assertEqual(z.limpar_corpo(bruto), 'Oi, tenho interesse!\nQuero 1000 peças.')
        self.assertEqual(z.limpar_corpo('Sim.\n> citado\nFim\n-- \nMaria\n11 9999'), 'Sim.\nFim')
        self.assertEqual(z.limpar_corpo('Ok\n-----Original Message-----\nDe: x'), 'Ok')
        self.assertEqual(z.limpar_corpo('On Mon, A wrote:\n> x', 10), '')
        self.assertEqual(len(z.limpar_corpo('a' * 9000)), 4000)

    def test_corpo_e_remetente(self):
        msg = {'e': [{'t': 't', 'a': 'eu@x.com'}, {'t': 'f', 'a': 'Lead@X.com'}],
               'mp': [{'ct': 'multipart/alternative', 'mp': [
                   {'ct': 'text/plain', 'content': 'texto'}, {'ct': 'text/html', 'content': '<b>html</b>'}]}]}
        self.assertEqual(z.remetente(msg), 'lead@x.com')
        self.assertEqual(z.corpo_texto(msg), 'texto')
        so_html = {'mp': [{'ct': 'text/html', 'content': '<p>Oi&nbsp;você</p><br>fim'}]}
        self.assertIn('fim', z.corpo_texto(so_html))


ENV = {'ZIMBRA_URL': 'https://w.example', 'ZIMBRA_USER': 'eu@garnet.com', 'ZIMBRA_PASSWORD': 'pw'}


class Idempotencia(unittest.TestCase):
    def setUp(self):
        p = mock.patch.dict(os.environ, ENV)
        p.start()
        self.addCleanup(p.stop)

    def busca(self):
        return {'m': [
            {'id': '10', 'e': [{'t': 'f', 'a': 'lead@x.com'}]},
            {'id': '11', 'e': [{'t': 'f', 'a': 'spam@y.com'}]},
            {'id': '12', 'e': [{'t': 'f', 'a': 'eu@garnet.com'}]}]}

    def run_ler(self, post_conflito=False, fila=None, dry=False):
        chamadas = []

        def fake_soap(nome, corpo):
            if nome == 'SearchRequest':
                return self.busca()
            return {'m': [{'mp': [{'ct': 'text/plain', 'content': 'Quero orçamento\n> citado'}]}]}

        def fake_db(*a):
            chamadas.append(a)
            if a[0] == 'get' and a[1] == 'leads':
                return [{'id': 'L1', 'nome': 'N', 'email': 'lead@x.com'}] if 'lead%40x.com' in a[2] else []
            if a[0] == 'get' and a[1] == 'ai_fila':
                return fila or []
            if a[0] == 'post' and a[1] == 'ai_interacoes':
                return [{'id': 'I1'}]
            return [{}]

        def fake_post_unico(tabela, corpo):
            chamadas.append(('post_unico', tabela, corpo))
            return (None, True) if post_conflito else ({'id': 'F1'}, False)

        with mock.patch.object(z, 'soap', fake_soap), mock.patch.object(z, 'db', fake_db), \
                mock.patch.object(z, 'db_post_unico', fake_post_unico):
            r = z.cmd_ler_respostas(date(2026, 10, 28), 50, dry)
        return r, chamadas

    def test_nova_e_ignoradas(self):
        r, ch = self.run_ler()
        self.assertEqual((r['lidas'], r['de_leads'], r['novas'], r['ignoradas']), (3, 1, 1, 2))
        fila = [c for c in ch if c[0] == 'post_unico'][0][2]
        self.assertEqual(fila['chave_idempotencia'], 'zimbra-10')
        self.assertEqual((fila['tipo'], fila['agente_id'], fila['prioridade']), ('classificar_resposta', 'atendimento', 1))
        inter = json.loads([c for c in ch if c[:2] == ('post', 'ai_interacoes')][0][2])
        self.assertEqual((inter['direcao'], inter['canal'], inter['registrado_por']), ('entrada', 'email', 'zimbra'))
        self.assertEqual(inter['conteudo'], 'Quero orçamento')
        patch = [c for c in ch if c[0] == 'patch'][0]
        self.assertEqual(json.loads(patch[3])['payload']['interacao_id'], 'I1')
        # nada gravado para remetentes que não são leads
        self.assertFalse(any('spam' in json.dumps(c) for c in ch if c[0] in ('post', 'post_unico')))

    def test_repetida_pula(self):
        r, ch = self.run_ler(fila=[{'id': 'F1', 'payload': {'interacao_id': 'I0'}}])
        self.assertEqual((r['novas'], r['repetidas']), (0, 1))
        self.assertFalse(any(c[0] in ('post_unico',) or c[:2] == ('post', 'ai_interacoes') for c in ch))

    def test_conflito_na_corrida(self):
        r, _ = self.run_ler(post_conflito=True)  # get da fila vazio -> trata como repetida
        self.assertEqual((r['novas'], r['repetidas']), (0, 1))

    def test_recupera_fila_sem_interacao(self):
        r, ch = self.run_ler(post_conflito=True, fila=[])
        self.assertEqual(r['novas'], 0)

    def test_dry_run_nao_grava(self):
        r, ch = self.run_ler(dry=True)
        self.assertEqual((r['novas'], r['dry_run']), (1, True))
        self.assertFalse(any(c[0] in ('post', 'patch', 'post_unico') for c in ch))


class Rascunhos(unittest.TestCase):
    def setUp(self):
        p = mock.patch.dict(os.environ, ENV)
        p.start()
        self.addCleanup(p.stop)

    def roda(self, feitos=(), pdf_falha=False, dry=False):
        link = 'https://papaicnydbcajkfghwem.supabase.co/storage/v1/object/public/ai-midia/propostas/u.pdf'
        ras = [{'id': 'R1', 'lead_id': 'L1', 'assunto': 'Proposta', 'texto': 'Oi ' + link, 'texto_final': None},
               {'id': 'R2', 'lead_id': 'L1', 'assunto': 'x', 'texto': 'oi', 'texto_final': 'final'}]
        ch, saves = [], []

        def fake_db(*a):
            ch.append(a)
            if a[:2] == ('get', 'ai_rascunhos'):
                return ras
            if a[:2] == ('get', 'ai_fila'):
                return [{'chave_idempotencia': k} for k in feitos]
            if a[:2] == ('get', 'leads'):
                return [{'id': 'L1', 'nome': 'Maria', 'email': 'm@x.com', 'extras': {}}]
            if a[0] == 'bloqueado':
                return False
            if a[:2] == ('config', 'assinatura'):
                return {'nome': 'Lucas', 'cargo': 'Dir', 'telefone': '+55 (11) 1', 'site': 'g.com.br'}
            if a[:2] == ('config', 'anexo_primeiro_contato'):
                return 'https://papaicnydbcajkfghwem.supabase.co/storage/v1/object/public/ai-midia/materiais/apresentacao-garnet.pdf'
            return [{}]

        def fake_soap(nome, corpo):
            saves.append(corpo)
            return {'m': [{'id': 'D9'}]}

        def fake_baixar(l):
            if pdf_falha:
                raise z.ZimbraErro('falhou')
            return b'%PDF-x'

        with mock.patch.object(z, 'db', fake_db), mock.patch.object(z, 'soap', fake_soap), \
                mock.patch.object(z, 'baixar_pdf', fake_baixar), \
                mock.patch.object(z, 'upload_zimbra', lambda n, c, t='application/pdf': 'AID'), \
                mock.patch.object(z, 'db_post_unico', lambda t, c: (ch.append(('unico', t, c)) or ({}, False))):
            r = z.cmd_criar_rascunhos(dry)
        return r, ch, saves

    def test_cria_com_anexo_e_idempotencia(self):
        r, ch, saves = self.roda(feitos=['zdraft-R2'])
        self.assertEqual((r['criados'], r['ja_criados'], r['sem_anexo']), (1, 1, 0))
        self.assertEqual(saves[0]['m']['attach'], {'aid': 'AID'})
        marca = [c for c in ch if c[0] == 'unico'][0][2]
        self.assertEqual((marca['chave_idempotencia'], marca['tipo'], marca['status']),
                         ('zdraft-R1', 'rascunho_zimbra', 'concluida'))
        self.assertEqual(marca['resultado']['zimbra_draft_id'], 'D9')
        self.assertFalse(any(c[:2] == ('patch', 'ai_rascunhos') for c in ch))

    def test_sem_anexo_registra_aviso(self):
        r, ch, saves = self.roda(feitos=['zdraft-R2'], pdf_falha=True)
        self.assertEqual(r['sem_anexo'], 1)
        self.assertNotIn('attach', saves[0]['m'])
        self.assertIn('aviso', [c for c in ch if c[0] == 'unico'][0][2]['resultado'])

    def test_usa_texto_final(self):
        _, _, saves = self.roda(feitos=['zdraft-R1'])
        plano = saves[0]['m']['mp']['mp'][0]['content']
        self.assertTrue(plano.startswith('final'))

    def test_dry_run(self):
        r, ch, saves = self.roda(dry=True)
        self.assertEqual(saves, [])
        self.assertFalse(any(c[0] in ('unico', 'post', 'evento') for c in ch))


class HtmlEAnexo(unittest.TestCase):
    ASSIN = {'nome': 'Lucas Lubrano', 'cargo': 'Diretor', 'telefone': '+55 (11) 93229-4144', 'site': 'garnetcosmeticos.com.br'}
    URL_APRES = 'https://x.supabase.co/storage/v1/object/public/ai-midia/materiais/apresentacao-garnet.pdf'

    def test_paragrafos_lista_escape(self):
        h = z.texto_para_html('Oi <b>Ana</b> & cia\nsegunda linha\n\nClientes:\n- Boca Rosa\n- A&B <x>\n\nFim')
        self.assertIn('<p style="margin:0 0 12px 0">Oi &lt;b&gt;Ana&lt;/b&gt; &amp; cia<br>segunda linha</p>', h)
        self.assertIn('<li style="margin:0">Boca Rosa</li><li style="margin:0">A&amp;B &lt;x&gt;</li>', h)
        self.assertEqual(h.count('<ul'), 1)
        self.assertEqual(h.count('<p '), 3)
        self.assertNotIn('<b>', h)

    def test_remove_assinatura_antiga(self):
        t = ('Olá!\n\nAtenciosamente,\nEquipe Garnet Cosméticos\ncontato@garnetcosmeticos.com.br · (11) 98153-1188 · '
             '@garnetcosmeticos\n\nSe preferir não receber mais mensagens nossas, responda com \'sair\'.')
        self.assertEqual(z.remover_assinatura_antiga(t), 'Olá!\n\nAtenciosamente,')
        self.assertEqual(z.remover_assinatura_antiga('Olá\n\nAtenciosamente,'), 'Olá\n\nAtenciosamente,')

    def test_html_completo(self):
        h = z.montar_html('Oi\n\nAtenciosamente,\nEquipe Garnet', self.ASSIN)
        self.assertNotIn('Equipe Garnet', h)
        self.assertIn('Lucas Lubrano', h)
        self.assertIn('width="80" height="80"', h)
        self.assertIn('border-radius:50%', h)
        self.assertIn(z.AVISO_SAIR, h)
        self.assertTrue(h.index('Atenciosamente') < h.index('Lucas Lubrano') < h.index(z.AVISO_SAIR))
        self.assertNotIn('<table', z.montar_html('Oi', None))
        plano = z.montar_texto_plano('Oi\n\nAtenciosamente,', self.ASSIN)
        self.assertIn('Lucas Lubrano\nDiretor', plano)
        self.assertTrue(plano.endswith(z.AVISO_SAIR))

    def test_savedraft_multipart_com_anexo(self):
        m = z.montar_savedraft('l@x.com', 'As', 'txt', 'AID', '<p>h</p>')['m']
        self.assertEqual(m['mp']['ct'], 'multipart/alternative')
        self.assertEqual([p['ct'] for p in m['mp']['mp']], ['text/plain', 'text/html'])
        self.assertEqual(m['mp']['mp'][1]['content'], '<p>h</p>')
        self.assertEqual(m['attach'], {'aid': 'AID'})

    def test_escolha_do_anexo(self):
        prop = 'https://x.supabase.co/storage/v1/object/public/ai-midia/propostas/u.pdf'
        self.assertEqual(z.escolher_anexo('veja ' + prop, 1, self.URL_APRES), ('proposta', prop, 'Proposta Garnet.pdf'))
        self.assertEqual(z.escolher_anexo('oi', 0, self.URL_APRES),
                         ('apresentacao', self.URL_APRES, 'Apresentacao Comercial Garnet.pdf'))
        self.assertEqual(z.escolher_anexo('oi', 1, self.URL_APRES)[0], 'apresentacao')
        self.assertIsNone(z.escolher_anexo('oi', 2, self.URL_APRES))
        self.assertIsNone(z.escolher_anexo('oi', None, self.URL_APRES))
        self.assertIsNone(z.escolher_anexo('oi', 0, None))

    def test_assunto_normalizado(self):
        self.assertEqual(z.normalizar_assunto('RE:  Retomando:  Uma Linha'), z.normalizar_assunto('retomando: uma linha'))
        self.assertEqual(z.normalizar_assunto('Proposta é boa'), z.normalizar_assunto('proposta e boa'))

    def test_query_enviados(self):
        self.assertEqual(z.montar_query_enviados('a@x.com', 1792800000000.0), 'in:sent to:a@x.com after:1792800000000')


class MarcarEnviados(unittest.TestCase):
    def setUp(self):
        p = mock.patch.dict(os.environ, ENV)
        p.start()
        self.addCleanup(p.stop)

    def roda(self, msgs, zsent=(), dry=False, zdraft=True):
        ch = []
        ras = [{'id': 'R1', 'lead_id': 'L1', 'assunto': 'Retomando: Linha'}]

        def fake_db(*a):
            ch.append(a)
            if a[:2] == ('get', 'ai_rascunhos'):
                return ras
            if a[:2] == ('get', 'ai_fila'):
                if 'zsent' in a[2]:
                    return [{'chave_idempotencia': k} for k in zsent]
                return [{'chave_idempotencia': 'zdraft-R1', 'created_at': '2026-10-28T21:45:13+00:00'}] if zdraft else []
            if a[:2] == ('get', 'leads'):
                return [{'id': 'L1', 'nome': 'Maria', 'email': 'm@x.com', 'extras': {}}]
            return [{}]

        buscas = []
        with mock.patch.object(z, 'db', fake_db), \
                mock.patch.object(z, 'soap', lambda n, c: (buscas.append(c) or {'m': msgs})), \
                mock.patch.object(z, 'db_post_unico', lambda t, c: (ch.append(('unico', t, c)) or ({}, False))):
            r = z.cmd_marcar_enviados(dry)
        return r, ch, buscas

    def test_marca(self):
        r, ch, buscas = self.roda([{'id': '9', 'su': 'RE: retomando: linha', 'd': 1793000000000}])
        self.assertEqual(r['marcados'], 1)
        self.assertTrue(buscas[0]['query'].startswith('in:sent to:m@x.com after:'))
        patch = [c for c in ch if c[:2] == ('patch', 'ai_rascunhos')][0]
        self.assertEqual(json.loads(patch[3])['status'], 'enviado')
        self.assertIn('enviado_em', json.loads(patch[3]))
        inter = json.loads([c for c in ch if c[:2] == ('post', 'ai_interacoes')][0][2])
        self.assertEqual((inter['direcao'], inter['canal'], inter['registrado_por']), ('saida', 'email', 'zimbra'))
        self.assertEqual(inter['resumo'], 'E-mail enviado pelo Zimbra: Retomando: Linha')
        self.assertEqual([c for c in ch if c[0] == 'unico'][0][2]['chave_idempotencia'], 'zsent-R1')
        self.assertTrue(any(c[0] == 'evento' and c[1] == 'atendimento' for c in ch))

    def test_nao_encontrado_ja_marcado_sem_zdraft_e_dry(self):
        r, ch, _ = self.roda([{'id': '9', 'su': 'Outro assunto', 'd': 1793000000000}])
        self.assertEqual((r['marcados'], r['nao_encontrados']), (0, 1))
        r, ch, buscas = self.roda([], zsent=['zsent-R1'])
        self.assertEqual((r['ja_marcados'], buscas), (1, []))
        r, _, _ = self.roda([], zdraft=False)
        self.assertEqual(r['sem_zdraft'], 1)
        r, ch, _ = self.roda([{'id': '9', 'su': 'Retomando: Linha', 'd': 1793000000000}], dry=True)
        self.assertEqual(r['marcados'], 1)
        self.assertFalse(any(c[0] in ('patch', 'post', 'evento', 'unico') for c in ch))


class Config(unittest.TestCase):
    def test_sem_variaveis_sai_2(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(SystemExit) as c:
                z.config()
        self.assertEqual(c.exception.code, 2)

    def test_fault(self):
        t = json.dumps({'Body': {'Fault': {'Reason': {'Text': 'authentication failed'},
                                           'Detail': {'Error': {'Code': 'account.AUTH_FAILED'}}}}})
        self.assertEqual(z._falha_soap(t), 'account.AUTH_FAILED: authentication failed')


if __name__ == '__main__':
    unittest.main(verbosity=1)
