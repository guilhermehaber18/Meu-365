// ===== TROCAR DE ABA (o controle remoto) =====
function abrirAba(nome, botao) {
  document.querySelectorAll('.conteudo').forEach(sec => sec.classList.remove('ativo'));
  document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
  document.getElementById(nome).classList.add('ativo');
  botao.classList.add('ativa');
}

// ===== AJUDANTES DE HORÁRIO (Londres → Brasília) =====
function diaBrasilia(data) {
  return data.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}
function horaBrasilia(data) {
  return data.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
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

// ===== BUSCAR OS JOGOS DE HOJE =====
async function carregarHoje() {
  const prateleira = document.getElementById('lista-hoje');
  prateleira.innerHTML = '<p class="aviso">Carregando jogos...</p>';

  const agora = new Date();
     const amanha = new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000);
  const hoje = diaBrasilia(agora);

  try {
    // Pergunta ao atendente (nunca direto à API!)
    const resposta = await fetch(`/api/jogos?de=${hoje}&ate=${diaBrasilia(amanha)}`);
    const dados = await resposta.json();

    // Fica só com os jogos que são HOJE no horário de Brasília
    const jogosHoje = (dados.matches || []).filter(j => diaBrasilia(new Date(j.utcDate)) === hoje);

    if (jogosHoje.length === 0) {
      prateleira.innerHTML = '<p class="aviso">Nenhum jogo hoje nos seus campeonatos.</p>';
      return;
    }
    prateleira.innerHTML = jogosHoje.map(criarCartao).join('');
  } catch (erro) {
    prateleira.innerHTML = '<p class="aviso">Erro ao carregar os jogos 😢</p>';
  }
}

// Quando o site abre, já busca os jogos
carregarHoje();