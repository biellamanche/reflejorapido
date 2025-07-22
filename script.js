const startButton = document.getElementById("startButton");
const gameArea = document.getElementById("gameArea");
const letrasDiv = document.getElementById("letras");
const resultadosDiv = document.getElementById("resultados");
const listaResultados = document.getElementById("listaResultados");
const modoSelect = document.getElementById("modo");
const contador = document.getElementById("contador");

const vocales = ["A", "E", "I", "O", "U"];
const consonantes = "BCDFGHJKLMNPQRSTVWXYZ".split("");

let modo = "vocales";
let rodada = 0;
let maxRodadas = 20;
let tempoFixo = 1500; // 1,5 segundos por rodada

let resultados = [];

startButton.addEventListener("click", iniciarJogo);

function iniciarJogo() {
  modo = modoSelect.value;
  rodada = 0;
  resultados = [];
  startButton.classList.add("hidden");
  modoSelect.classList.add("hidden");
  document.getElementById("instructions").classList.add("hidden");
  resultadosDiv.classList.add("hidden");
  gameArea.classList.remove("hidden");
  gameArea.classList.add("fade-in");

  // Remove classe que expande container para o jogo iniciar com layout normal
  document.querySelector(".container").classList.remove("resultados-full");

  proximaRodada();
}

function proximaRodada() {
  if (rodada >= maxRodadas) {
    finalizarJogo();
    return;
  }

  const quantidadeLetras = Math.floor(Math.random() * 10) + 1;
  const grupo = gerarLetras(quantidadeLetras);
  letrasDiv.textContent = grupo.join(" ");
  letrasDiv.classList.add("fade-in-fast");

  let tempoRestante = tempoFixo;
  contador.textContent = `Tiempo restante: ${(tempoRestante / 1000).toFixed(1)}s`;

  const tempoInicioLocal = performance.now();
  let clicou = false;

  const countdown = setInterval(() => {
    tempoRestante -= 100;
    if (tempoRestante <= 0) {
      clearInterval(countdown);
    } else {
      contador.textContent = `Tiempo restante: ${(tempoRestante / 1000).toFixed(1)}s`;
    }
  }, 100);

  const handleClick = () => {
    if (clicou) return;
    clicou = true;
    clearInterval(countdown);

    const tempoResposta = (performance.now() - tempoInicioLocal).toFixed(2);
    const acertou = avaliar(grupo, modo, true);

    resultados.push({
      rodada: rodada + 1,
      letras: grupo.join(" "),
      modo,
      acertou,
      tempo: acertou ? tempoResposta : "Sin respuesta",
    });

    window.removeEventListener("click", handleClick);
    rodada++;
    setTimeout(proximaRodada, 800);
  };

  window.addEventListener("click", handleClick);

  setTimeout(() => {
    if (!clicou) {
      clearInterval(countdown);
      window.removeEventListener("click", handleClick);

      const acertou = avaliar(grupo, modo, false);

      resultados.push({
        rodada: rodada + 1,
        letras: grupo.join(" "),
        modo,
        acertou,
        tempo: acertou ? "Sin respuesta" : "Sin respuesta",
      });
      rodada++;
      setTimeout(proximaRodada, 800);
    }
  }, tempoFixo);
}

// Gera array de letras aleatórias (vogais + consoantes)
function gerarLetras(qtd) {
  let pool = [...vocales, ...consonantes];
  let letras = [];
  for (let i = 0; i < qtd; i++) {
    const rand = pool[Math.floor(Math.random() * pool.length)];
    letras.push(rand);
  }
  return letras;
}

// Avalia se o jogador acertou com base no grupo de letras, modo e se clicou ou não
function avaliar(letras, modo, clicou) {
  const temVogal = letras.some((l) => vocales.includes(l));
  const temConsoante = letras.some((l) => consonantes.includes(l));

  if (modo === "vocales") {
    if (clicou) {
      // clicou → acerto se tem pelo menos 1 vogal
      return temVogal;
    } else {
      // não clicou → acerto se não tem vogal
      return !temVogal;
    }
  } else {
    // modo consoantes (corrigido conforme sua regra)
    if (clicou) {
      // clicou → acerto SOMENTE se for SÓ consoantes (sem vogais)
      return !temVogal && temConsoante;
    } else {
      // não clicou → acerto se NÃO for só consoantes (ou seja, se tiver pelo menos uma vogal ou não tiver consoantes)
      return temVogal || !temConsoante;
    }
  }
}

function finalizarJogo() {
  gameArea.classList.add("hidden");
  resultadosDiv.classList.remove("hidden");

  // Expande container para ocupar mais largura na tela de resultados
  const container = document.querySelector(".container");
  container.classList.add("resultados-full");

  // Calcula média de tempo só das respostas válidas e corretas (não "Sin respuesta")
  let temposValidos = resultados
    .filter((r) => r.tempo !== "Sin respuesta" && r.acertou)
    .map((r) => parseFloat(r.tempo))
    .filter((t) => !isNaN(t));

  let mediaTempo = temposValidos.length
    ? (temposValidos.reduce((a, b) => a + b, 0) / temposValidos.length).toFixed(2)
    : "N/A";

  // Cria tabela com cabeçalho
  let tabelaHTML = `
    <table id="tablaResultados">
      <thead>
        <tr>
          <th>Ronda</th>
          <th>Letras</th>
          <th>Modo</th>
          <th>Correcto</th>
          <th>Tiempo (ms)</th>
        </tr>
      </thead>
      <tbody>
        ${resultados
          .map((r) => {
            return `
              <tr>
                <td>${r.rodada}</td>
                <td>${r.letras}</td>
                <td>${r.modo}</td>
                <td>${r.acertou ? "✅" : "❌"}</td>
                <td>${r.tempo === "Sin respuesta" ? r.tempo : r.tempo + " ms"}</td>
              </tr>`;
          })
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="4" style="text-align:right; font-weight:bold;">Media de tiempo (respuestas correctas):</td>
          <td style="font-weight:bold;">${mediaTempo} ms</td>
        </tr>
      </tfoot>
    </table>
  `;

  listaResultados.innerHTML = tabelaHTML;

  // Botão centralizado abaixo da tabela
  listaResultados.innerHTML += `<button onclick="location.reload()">Volver a comenzar</button>`;
}
