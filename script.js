// ===== TROCAR DE ABA (o controle remoto) =====
function abrirAba(nome, botao) {
  document.querySelectorAll('.conteudo').forEach(sec => sec.classList.remove('ativo'));
  document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
  document.getElementById(nome).classList.add('ativo');
  botao.classList.add('ativa');
}

// ===== AJUDANTES DE DATA E HORÁRIO (Londres → Brasília) =====
function diaBrasilia(data) {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}
function horaBrasilia(data) {
  return data.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
}
function tituloDia(data) {
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: '2-digit' });
}
function somarDias(data, dias) {
  return new Date(data.getTime() + dias * 24 * 60 * 60 * 1000);
}

// ===== NOMES BONITOS DOS CAMPEONATOS =====
const CAMPEONATOS = { BSA: 'Brasileirão', PL: 'Premier League', CL: 'Champions League' };

// ===== MEMÓRIA DO SITE =====
let todosJogos = [];   // a "compra do mês"
let favoritos = [];    // a lista que vem do Supabase

function ehFavorito(id) {
  return favoritos.some(f => f.time_id === id);
}

// ===== A ESTRELA ☆ / ★ =====
function estrela(id, nome) {
  const ativa = ehFavorito(id);
  return `<button class="estrela ${ativa ? 'ativa' : ''}" data-id="${id}" data-nome="${nome}" onclick="alternarFavorito(this)">${ativa ? '★' : '☆'}</button>`;
}

// ===== MONTAR UM CARTÃO DE JOGO (o carimbo) =====
function criarCartao(jogo) {
  const data = new Date(jogo.utcDate);
  const campeonato = CAMPEONATOS[jogo.competition.code] || jogo.competition.name;
  const casa = jogo.homeTeam.shortName || jogo.homeTeam.name;
  const fora = jogo.awayTeam.shortName || jogo.awayTeam.name;
  const gCasa = jogo.score.fullTime.home;
  const gFora = jogo.score.fullTime.away;
  const meio = gCasa === null ? 'x' : `${gCasa} - ${gFora}`;
  const temFavorito = ehFavorito(jogo.homeTeam.id) || ehFavorito(jogo.awayTeam.id);

  return `
    <div class="jogo ${temFavorito ? 'favorito' : ''}">
      <div class="campeonato">${campeonato} · ${horaBrasilia(data)}</div>
      <div class="placar">
        <span class="time">${estrela(jogo.homeTeam.id, casa)} ${casa}</span>
        <span class="vs">${meio}</span>
        <span class="time">${fora} ${estrela(jogo.awayTeam.id, fora)}</span>
      </div>
    </div>`;
}

// ===== MONTAR UMA LISTA (com ou sem divisórias por dia) =====
function montarLista(jogos, separarPorDia, textoVazio) {
  if (jogos.length === 0) return `<p class="aviso">${textoVazio}</p>`;
  if (!separarPorDia) return jogos.map(criarCartao).join('');

  let html = '';
  let diaAnterior = '';
  jogos.forEach(jogo => {
    const data = new Date(jogo.utcDate);
    const dia = diaBrasilia(data);
    if (dia !== diaAnterior) {
      html += `<div class="dia">${tituloDia(data)}</div>`;
      diaAnterior = dia;
    }
    html += criarCartao(jogo);
  });
  return html;
}

// ===== DESENHAR TODAS AS ABAS =====
function desenharTudo() {
  const agora = new Date();
  const hoje = diaBrasilia(agora);
  const fimSemana = diaBrasilia(somarDias(agora, 7));
  const fimMes = diaBrasilia(somarDias(agora, 30));
  const diaDe = jogo => diaBrasilia(new Date(jogo.utcDate));

  // Separa a compra do mês nas sacolas
  const jogosHoje = todosJogos.filter(j => diaDe(j) === hoje);
  const jogosSemana = todosJogos.filter(j => diaDe(j) >= hoje && diaDe(j) < fimSemana);
  const jogosMes = todosJogos.filter(j => diaDe(j) >= hoje && diaDe(j) < fimMes);
  const jogosFav = jogosMes.filter(j => ehFavorito(j.homeTeam.id) || ehFavorito(j.awayTeam.id));

  document.getElementById('lista-hoje').innerHTML = montarLista(jogosHoje, false, 'Nenhum jogo hoje nos seus campeonatos.');
  document.getElementById('lista-semana').innerHTML = montarLista(jogosSemana, true, 'Nenhum jogo nos próximos 7 dias.');
  document.getElementById('lista-mes').innerHTML = montarLista(jogosMes, true, 'Nenhum jogo nos próximos 30 dias.');

  // Aba Favoritos: meus times + próximos jogos deles
  let html = '<h3 class="subtitulo">Meus times</h3>';
  if (favoritos.length === 0) {
    html += '<p class="aviso">Toque na ☆ de um time pra favoritar.</p>';
  } else {
    html += favoritos.map(f => `
      <div class="jogo linha-fav">
        <strong>${f.nome}</strong>
        ${estrela(f.time_id, f.nome)}
      </div>`).join('');
  }
  html += '<h3 class="subtitulo">Próximos jogos</h3>';
  html += montarLista(jogosFav, true, 'Nenhum jogo dos seus times nos próximos 30 dias.');
  document.getElementById('lista-favoritos').innerHTML = html;
}

// ===== BUSCAR OS FAVORITOS (GET = ver o extrato) =====
async function carregarFavoritos() {
  try {
    const resposta = await fetch('/api/favoritos');
    const dados = await resposta.json();
    favoritos = Array.isArray(dados) ? dados : [];
  } catch (erro) {
    favoritos = [];
  }
}

// ===== CLICAR NA ESTRELA (POST = depósito, DELETE = saque) =====
async function alternarFavorito(botao) {
  const id = Number(botao.dataset.id);
  const nome = botao.dataset.nome;
  botao.disabled = true;

  try {
    if (ehFavorito(id)) {
      await fetch(`/api/favoritos?time_id=${id}`, { method: 'DELETE' });
    } else {
      await fetch('/api/favoritos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_id: id, nome })
      });
    }
    // Busca a lista atualizada e redesenha o site
    await carregarFavoritos();
    desenharTudo();
  } catch (erro) {
    alert('Não consegui salvar o favorito 😢');
    botao.disabled = false;
  }
}

// ===== QUANDO O SITE ABRE =====
async function iniciar() {
  const ids = ['lista-hoje', 'lista-semana', 'lista-mes', 'lista-favoritos'];
  ids.forEach(id => document.getElementById(id).innerHTML = '<p class="aviso">Carregando...</p>');

  const agora = new Date();
  try {
    // Faz as duas buscas AO MESMO TEMPO: jogos (API) e favoritos (Supabase)
    const [resposta] = await Promise.all([
      fetch(`/api/jogos?de=${diaBrasilia(agora)}&ate=${diaBrasilia(somarDias(agora, 31))}`),
      carregarFavoritos()
    ]);
    const dados = await resposta.json();
    todosJogos = dados.matches || [];
    desenharTudo();
  } catch (erro) {
    ids.forEach(id => document.getElementById(id).innerHTML = '<p class="aviso">Erro ao carregar 😢</p>');
  }
}

iniciar();