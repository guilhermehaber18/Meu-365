module.exports = async (req, res) => {
  try {
    // 1. Pega as chaves no cofre
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SECRET_KEY;
    if (!url || !chave) {
      return res.status(500).json({ erro: 'Falta alguma chave no cofre', achouUrl: !!url, achouChave: !!chave });
    }

    const tabela = `${url}/rest/v1/favoritos`;
    const cabecalho = { apikey: chave, 'Content-Type': 'application/json' };
    let resposta;

    if (req.method === 'GET') {
      // VER O EXTRATO: lista todos os favoritos, em ordem alfabética
      resposta = await fetch(`${tabela}?select=*&order=nome`, { headers: cabecalho });

    } else if (req.method === 'POST') {
      // DEPÓSITO: adiciona um time novo
      const { time_id, nome } = req.body;
      resposta = await fetch(tabela, {
        method: 'POST',
        headers: { ...cabecalho, Prefer: 'return=representation' },
        body: JSON.stringify({ time_id, nome })
      });

    } else if (req.method === 'DELETE') {
      // SAQUE: remove o time com aquele "CPF"
      const id = Number(req.query.time_id);
      resposta = await fetch(`${tabela}?time_id=eq.${id}`, { method: 'DELETE', headers: cabecalho });

    } else {
      return res.status(405).json({ erro: 'Ação não permitida' });
    }

    // 2. Entrega a resposta pro site (sem guardar em cache: favoritos mudam na hora)
    const texto = await resposta.text();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.status(resposta.status).send(texto || '{}');
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};