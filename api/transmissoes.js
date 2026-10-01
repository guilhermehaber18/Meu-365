module.exports = async (req, res) => {
  try {
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SECRET_KEY;
    if (!url || !chave) {
      return res.status(500).json({ erro: 'Falta alguma chave no cofre' });
    }

    const tabela = `${url}/rest/v1/transmissoes`;
    const cabecalho = { apikey: chave, 'Content-Type': 'application/json' };
    let resposta;

    if (req.method === 'GET') {
      resposta = await fetch(`${tabela}?select=jogo_id,canal`, { headers: cabecalho });

    } else if (req.method === 'POST') {
      const { jogo_id, canal } = req.body;
      resposta = await fetch(`${tabela}?on_conflict=jogo_id`, {
        method: 'POST',
        headers: { ...cabecalho, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ jogo_id, canal })
      });

    } else if (req.method === 'DELETE') {
      const id = Number(req.query.jogo_id);
      resposta = await fetch(`${tabela}?jogo_id=eq.${id}`, { method: 'DELETE', headers: cabecalho });

    } else {
      return res.status(405).json({ erro: 'Ação não permitida' });
    }

    const texto = await resposta.text();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json');
    res.status(resposta.status).send(texto || '{}');
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};