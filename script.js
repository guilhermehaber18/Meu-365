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

// ===== CANAL AUTOMÁTICO POR CAMPEONATO (temporada 2026/27) =====
const CANAL_PADRAO = {
  BSA: 'Premiere (maioria dos jogos)',
  PL: 'Disney+ · ESPN (alguns jogos)',
  CL: 'HBO Max · TNT/Space/SBT (alguns jogos)'
};

// ===== MEMÓRIA DO SITE =====
let todosJogos = [];     // a "compra do mês"
let favoritos = [];      // lista do Supabase
let transmissoes = {};   // agenda: número do jogo → canal
let classificacao = [];  // tabela do campeonato escolhido nas Estatísticas

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

  // Primeiro o que você cadastrou; se não tiver, usa a regra do campeonato
  const canal = transmissoes[jogo.id] || CANAL_PADRAO[jogo.competition.code];
  const ondePassa = canal
    ? `<div class="onde-passa" onclick="editarCanal(${jogo.id})">📺 ${canal}</div>`
    : `<button class="botao-canal" onclick="editarCanal(${jogo.id})">+ onde passa</button>`;

  return `
    <div class="jogo ${temFavorito ? 'favorito' : ''}">
      <div class="campeonato">${campeonato} · ${horaBrasilia(data)}</div>
      <div class="placar">
        <span class="time">${estrela(jogo.homeTeam.id, casa)} ${casa}</span>
        <span class="vs">${meio}</span>
        <span class="time">${fora} ${estrela(jogo.awayTeam.id, fora)}</span>
      </div>
      ${ondePassa}
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

  const jogosHoje = todosJogos.filter(j => diaDe(j) === hoje);
  const jogosSemana = todosJogos.filter(j => diaDe(j) >= hoje && diaDe(j) < fimSemana);
  const jogosMes = todosJogos.filter(j => diaDe(j) >= hoje && diaDe(j) < fimMes);
  const jogosFav = jogosMes.filter(j => ehFavorito(j.homeTeam.id) || ehFavorito(j.awayTeam.id));

  document.getElementById('lista-hoje').innerHTML = montarLista(jogosHoje, false, 'Nenhum jogo hoje nos seus campeonatos.');
  document.getElementById('lista-semana').innerHTML = montarLista(jogosSemana, true, 'Nenhum jogo nos próximos 7 dias.');
  document.getElementById('lista-mes').innerHTML = montarLista(jogosMes, true, 'Nenhum jogo nos próximos 30 dias.');

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

  // Se a tabela já foi carregada, redesenha (pra atualizar os destaques dos favoritos)
  if (classificacao.length > 0) desenharClassificacao();
}

// ===== BUSCAR OS FAVORITOS =====
async function carregarFavoritos() {
  try {
    const resposta = await fetch('/api/favoritos');
    const dados = await resposta.json();
    favoritos = Array.isArray(dados) ? dados : [];
  } catch (erro) {
    favoritos = [];
  }
}

// ===== BUSCAR AS TRANSMISSÕES (a agenda) =====
async function carregarTransmissoes() {
  try {
    const resposta = await fetch('/api/transmissoes');
    const dados = await resposta.json();
    transmissoes = Array.isArray(dados)
      ? Object.fromEntries(dados.map(t => [t.jogo_id, t.canal]))
      : {};
  } catch (erro) {
    transmissoes = {};
  }
}

// ===== CLICAR NA ESTRELA =====
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
    await carregarFavoritos();
    desenharTudo();
  } catch (erro) {
    alert('Não consegui salvar o favorito 😢');
    botao.disabled = false;
  }
}

// ===== CADASTRAR / EDITAR / APAGAR O CANAL =====
async function editarCanal(jogoId) {
  const atual = transmissoes[jogoId] || '';
  const resposta = prompt('Onde passa esse jogo? (ex.: Globo, Premiere, Prime Video)\nDeixe vazio para voltar ao padrão.', atual);
  if (resposta === null) return;   // clicou em Cancelar
  const canal = resposta.trim();

  try {
    if (canal === '') {
      await fetch(`/api/transmissoes?jogo_id=${jogoId}`, { method: 'DELETE' });
    } else {
      await fetch('/api/transmissoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jogo_id: jogoId, canal })
      });
    }
    await carregarTransmissoes();
    desenharTudo();
  } catch (erro) {
    alert('Não consegui salvar o canal 😢');
  }
}

// ===== ESTATÍSTICAS: BUSCAR A TABELA DO CAMPEONATO =====
async function carregarClassificacao(codigo, botao) {
  // Pinta de verde o botão do campeonato escolhido
  if (botao) {
    document.querySelectorAll('.filtro').forEach(b => b.classList.remove('ativa'));
    botao.classList.add('ativa');
  }

  const caixa = document.getElementById('lista-estatisticas');
  caixa.innerHTML = '<p class="aviso">Carregando tabela...</p>';

  try {
    const resposta = await fetch(`/api/classificacao?campeonato=${codigo}`);
    const dados = await resposta.json();
    // A API manda várias tabelas (geral, só em casa, só fora): pegamos a geral
    const geral = (dados.standings || []).find(s => s.type === 'TOTAL');
    classificacao = geral ? geral.table : [];
    desenharClassificacao();
  } catch (erro) {
    caixa.innerHTML = '<p class="aviso">Erro ao carregar a tabela 😢</p>';
  }
}

// ===== APROVEITAMENTO (a mesma conta do seu estatisticas.py!) =====
function aproveitamento(linha) {
  if (linha.playedGames === 0) return 0;
  return Math.round(linha.points / (linha.playedGames * 3) * 100);
}

// ===== ESTATÍSTICAS: DESENHAR CARTÕES + TABELA =====
function desenharClassificacao() {
  const caixa = document.getElementById('lista-estatisticas');
  if (classificacao.length === 0) {
    caixa.innerHTML = '<p class="aviso">Tabela indisponível para esse campeonato agora.</p>';
    return;
  }

  let html = '';

  // 1. Cartões com os números dos MEUS times
  const meus = classificacao.filter(linha => ehFavorito(linha.team.id));
  if (meus.length > 0) {
    html += '<h3 class="subtitulo">Meus times</h3>';
    html += meus.map(linha => `
      <div class="jogo favorito">
        <div class="cabeca-time">
          <img src="${linha.team.crest}" alt="">
          <strong>${linha.position}º · ${linha.team.shortName || linha.team.name}</strong>
        </div>
        <div class="numeros">
          <div><span>${linha.points}</span>pontos</div>
          <div><span>${linha.won}-${linha.draw}-${linha.lost}</span>V-E-D</div>
          <div><span>${linha.goalsFor}:${linha.goalsAgainst}</span>gols</div>
          <div><span>${linha.goalDifference > 0 ? '+' : ''}${linha.goalDifference}</span>saldo</div>
          <div><span>${aproveitamento(linha)}%</span>aprov.</div>
        </div>
      </div>`).join('');
  }

  // 2. Tabela completa, com os favoritos em destaque
  html += '<h3 class="subtitulo">Classificação</h3>';
  html += `
    <table class="tabela">
      <tr><th>#</th><th class="esq">Time</th><th>P</th><th>J</th><th>SG</th><th>%</th></tr>
      ${classificacao.map(linha => `
        <tr class="${ehFavorito(linha.team.id) ? 'meu-time' : ''}">
          <td>${linha.position}</td>
          <td class="esq"><img src="${linha.team.crest}" alt=""> ${linha.team.shortName || linha.team.name}</td>
          <td><strong>${linha.points}</strong></td>
          <td>${linha.playedGames}</td>
          <td>${linha.goalDifference}</td>
          <td>${aproveitamento(linha)}</td>
        </tr>`).join('')}
    </table>`;

  caixa.innerHTML = html;
}

// ===== QUANDO O SITE ABRE =====
async function iniciar() {
  const ids = ['lista-hoje', 'lista-semana', 'lista-mes', 'lista-favoritos'];
  ids.forEach(id => document.getElementById(id).innerHTML = '<p class="aviso">Carregando...</p>');

  const agora = new Date();
  try {
    const [resposta] = await Promise.all([
      fetch(`/api/jogos?de=${diaBrasilia(agora)}&ate=${diaBrasilia(somarDias(agora, 31))}`),
      carregarFavoritos(),
      carregarTransmissoes()
    ]);
    const dados = await resposta.json();
    todosJogos = dados.matches || [];
    desenharTudo();
  } catch (erro) {
    ids.forEach(id => document.getElementById(id).innerHTML = '<p class="aviso">Erro ao carregar 😢</p>');
  }
}

iniciar();
carregarClassificacao('BSA');
