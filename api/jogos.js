// Os campeonatos que o site acompanha (pra adicionar, é só incluir o código aqui)
const CAMPEONATOS = ['BSA', 'PL', 'CL'];

module.exports = async (req, res) => {
  // 1. Lê as datas que o site pediu
  const { de, ate } = req.query;

  // 2. Faz um pedido pra cada campeonato, todos ao mesmo tempo
  const pedidos = CAMPEONATOS.map(codigo =>
    fetch(`https://api.football-data.org/v4/competitions/${codigo}/matches?dateFrom=${de}&dateTo=${ate}`, {
      headers: { 'X-Auth-Token': process.env.FOOTBALL_TOKEN }
    }).then(r => r.json())
  );
  const respostas = await Promise.all(pedidos);

  // 3. Junta os jogos dos 3 campeonatos e ordena por horário
  const jogos = respostas.flatMap(r => r.matches || []);
  jogos.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  // 4. Se algum pedido deu problema, guarda o aviso (ajuda a achar erros)
  const avisos = respostas.filter(r => r.message).map(r => r.message);

  // 5. Guarda a resposta por 60 segundos e entrega pro site
  res.setHeader('Cache-Control', 's-maxage=60');
  res.status(200).json({ matches: jogos, avisos });
};