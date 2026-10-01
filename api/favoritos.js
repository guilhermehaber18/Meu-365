module.exports = async (req, res) => {
  try {
    // 1. Pega as chaves no cofre
    const url = process.env.SUPABASE_URL;
    const chave = process.env.SUPABASE_SECRET_KEY;

    // 2. Se faltar alguma, avisa qual (sem mostrar o valor!)
    if (!url || !chave) {
      return res.status(500).json({
        erro: 'Falta alguma chave no cofre',
        achouUrl: !!url,
        achouChave: !!chave
      });
    }

    // 3. Pede os favoritos ao Supabase
    const resposta = await fetch(`${url}/rest/v1/favoritos?select=*`, {
      headers: { apikey: chave }
    });
    const texto = await resposta.text();

    // 4. Entrega pro site
    res.setHeader('Content-Type', 'application/json');
    res.status(resposta.status).send(texto);
  } catch (erro) {
    // 5. Se travar, conta o motivo em vez de "desmaiar"
    res.status(500).json({ erro: erro.message });
  }
};