module.exports = async (req, res) => {
  // 1. Lê as datas que o site pediu (de quando até quando)
  const { de, ate } = req.query;

  // 2. Monta o pedido: 3 campeonatos numa consulta só (econômico!)
  const url = `https://api.football-data.org/v4/matches?competitions=BSA,PL,CL&dateFrom=${de}&dateTo=${ate}`;

  // 3. Faz o pedido mostrando o crachá, que ele pega no cofre
  const resposta = await fetch(url, {
    headers: { 'X-Auth-Token': process.env.FOOTBALL_TOKEN }
  });
  const dados = await resposta.json();

  // 4. Guarda a resposta por 60 segundos, pra não gastar consultas à toa
  res.setHeader('Cache-Control', 's-maxage=60');

  // 5. Entrega os dados pro site
  res.status(resposta.status).json(dados);
};