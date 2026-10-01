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
  PL: 'Disney+ · ESPN (alguns jogos)',
  CL: 'HBO Max · TNT/Space/SBT (alguns jogos)'
};

// ===== MEMÓRIA DO SITE =====
let todosJogos = [];     // a "compra do mês"
let favoritos = [];      // lista do Supabase
let transmissoes = {};   // agenda: número do jogo → canal

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
    ? `<div class="onde-passa" onclick="editarCanal(${jogo.id})">📺