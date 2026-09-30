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

// ===== MONTAR UM CARTÃO DE JOGO (o carimbo) =====
function criarCartao(jogo) {
  const data = new Date(jogo.utcDate);
  const campeonato = CAMPEONATOS[jogo.competition.code] || jogo.competition.name;
  const casa = jogo.homeTeam.shortName || jogo.homeTeam.name;
  const fora = jogo.awayTeam.shortName || jogo.awayTeam.name;
  const gCasa = jogo.score.fullTime.home;
  const gFora = jogo.score.fullTime.away;
  const meio = gCasa === null ? 'x' : `${gCasa} - ${gFora}`;

  return `
    <div class="jogo">
      <div class="campeonato">${campeonato} · ${horaBrasilia(data)}</div>
      <div class="placar">
        <span class="time">${casa}</span>
        <span class="vs">${meio}</span>
        <span class="time">${fora}</span>
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
    // Quando muda o dia, coloca uma divisória nova
    if (dia !== diaAnterior) {
      html += `<div class="dia">${tituloDia(data)}</div>`;
      diaAnterior = dia;
    }
    html += criarCartao(jogo);
  });
  return html;
}

// ===== A COMPRA DO MÊS: busca tudo uma vez e separa em casa =====
async function carregarJogos() {
  const ids = ['lista-hoje', 'lista-semana', 'lista-mes'];
  ids.forEach(id => document.getElementById(id).innerHTML = '<p class="aviso">Carregando jogos...</p>');

  const agora = new Date();
  const hoje = diaBrasilia(agora);
  const fimSemana = diaBrasilia(somarDias(agora, 7));
  const fimMes = diaBrasilia(somarDias(agora, 30));

  // Diz se um jogo está entre duas datas (no horário de Brasília)
  const entre = (jogo, inicio, fim) => {
    const dia = diaBrasilia(new Date(jogo.utcDate));
    return dia >= inicio && dia < fim;
  };

  try {
    const resposta = await fetch(`/api/jogos?de=${hoje}&ate=${diaBrasilia(somarDias(agora, 31))}`);
    const dados = await resposta.json();
    const todos = dados.matches || [];

    // Separa a compra em 3 sacolas
    const jogosHoje = todos.filter(j => diaBrasilia(new Date(j.utcDate)) === hoje);
    const jogosSemana = todos.filter(j => entre(j, hoje, fimSemana));
    const jogosMes = todos.filter(j => entre(j, hoje, fimMes));

    document.getElementById('lista-hoje').innerHTML = montarLista(jogosHoje, false, 'Nenhum jogo hoje nos seus campeonatos.');
    document.getElementById('lista-semana').innerHTML = montarLista(jogosSemana, true, 'Nenhum jogo nos próximos 7 dias.');
    document.getElementById('lista-mes').innerHTML = montarLista(jogosMes, true, 'Nenhum jogo nos próximos 30 dias.');
  } catch (erro) {
    ids.forEach(id => document.getElementById(id).innerHTML = '<p class="aviso">Erro ao carregar os jogos 😢</p>');
  }
}

// Quando o site abre, faz a compra do mês
carregarJogos();