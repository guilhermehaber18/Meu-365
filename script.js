function abrirAba(nome, botao) {
  // 1. Esconde todas as abas
  document.querySelectorAll('.conteudo').forEach(sec => sec.classList.remove('ativo'));

  // 2. Tira o verde de todos os botões
  document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));

  // 3. Mostra a aba escolhida e pinta o botão clicado de verde
  document.getElementById(nome).classList.add('ativo');
  botao.classList.add('ativa');
}