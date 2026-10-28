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
        self.assertEqual(saves[0]['m']['mp']['content'], 'final')

    def test_dry_run(self):
        r, ch, saves = self.roda(dry=True)
        self.assertEqual(saves, [])
        self.assertFalse(any(c[0] in ('unico', 'post', 'evento') for c in ch))


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
