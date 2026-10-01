// Lista de convidados: só esses campeonatos podem ser pedidos
const PERMITIDOS = ['BSA', 'PL', 'CL'];

module.exports = async (req, res) => {
  try {
    const codigo = req.query.campeonato;
    if (!PERMITIDOS.includes(codigo)) {
      return res.status(400).json({ erro: 'Campeonato não permitido' });
    }

    const resposta = await fetch(`https://api.football-data.org/v4/competitions/${codigo}/standings`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_TOKEN }
    });
    const dados = await resposta.json();

    // A tabela muda devagar: guarda por 5 minutos (300 segundos)
    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(resposta.status).json(dados);
  } catch (erro) {
    res.status(500).json({ erro: erro.message });
  }
};