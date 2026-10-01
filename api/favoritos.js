   module.exports = async (req, res) => {
     // Pede ao Supabase todas as linhas da tabela "favoritos"
     const resposta = await fetch(`${process.env.SUPABASE_URL}/rest/v1/favoritos?select=*`, {
       headers: { apikey: process.env.SUPABASE_SECRET_KEY }
     });
     const dados = await resposta.json();

     // Entrega pro site
     res.status(resposta.status).json(dados);
   };