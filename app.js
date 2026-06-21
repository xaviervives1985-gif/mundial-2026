const SUPABASE_URL = "https://etfkwmeymzzwnyrxurfj.supabase.co";
const SUPABASE_KEY = "sb_publishable_FJ_mCbtiiGmxpT-30Pjw3A_k7MXxCKv";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const matches = [
  { id: 1, date: "20 junio", time: "13:00", group: "F", home: "Países Bajos", away: "Suecia", homeResult: 5, awayResult: 1, locked: true },
  { id: 2, date: "20 junio", time: "16:00", group: "E", home: "Alemania", away: "Costa de Marfil", homeResult: 2, awayResult: 1, locked: true },
  { id: 3, date: "20 junio", time: "22:00", group: "E", home: "Ecuador", away: "Curazao", homeResult: 0, awayResult: 0, locked: true },

  { id: 4, date: "21 junio", time: "12:00", group: "H", home: "España", away: "Arabia Saudí", homeResult: 4, awayResult: 0, locked: true },
  { id: 5, date: "21 junio", time: "15:00", group: "G", home: "Bélgica", away: "Irán", homeResult: 0, awayResult: 0, locked: true },
  { id: 6, date: "21 junio", time: "18:00", group: "H", home: "Uruguay", away: "Cabo Verde", homeResult: null, awayResult: null, locked: true },
  { id: 7, date: "21 junio", time: "21:00", group: "G", home: "Nueva Zelanda", away: "Egipto", homeResult: null, awayResult: null, locked: false },

  { id: 8, date: "22 junio", time: "13:00", group: "J", home: "Argentina", away: "Austria", homeResult: null, awayResult: null, locked: false },
  { id: 9, date: "22 junio", time: "17:00", group: "I", home: "Francia", away: "Irak", homeResult: null, awayResult: null, locked: false },
  { id: 10, date: "22 junio", time: "20:00", group: "I", home: "Noruega", away: "Senegal", homeResult: null, awayResult: null, locked: false },
  { id: 11, date: "22 junio", time: "23:00", group: "J", home: "Jordania", away: "Argelia", homeResult: null, awayResult: null, locked: false },

  { id: 12, date: "23 junio", time: "13:00", group: "K", home: "Portugal", away: "Uzbekistán", homeResult: null, awayResult: null, locked: false },
  { id: 13, date: "23 junio", time: "16:00", group: "L", home: "Inglaterra", away: "Ghana", homeResult: null, awayResult: null, locked: false },
  { id: 14, date: "23 junio", time: "19:00", group: "L", home: "Panamá", away: "Croacia", homeResult: null, awayResult: null, locked: false },
  { id: 15, date: "23 junio", time: "22:00", group: "K", home: "Colombia", away: "RD Congo", homeResult: null, awayResult: null, locked: false },

  { id: 16, date: "24 junio", time: "15:00", group: "B", home: "Suiza", away: "Canadá", homeResult: null, awayResult: null, locked: false },
  { id: 17, date: "24 junio", time: "15:00", group: "B", home: "Bosnia y Herzegovina", away: "Catar", homeResult: null, awayResult: null, locked: false },
  { id: 18, date: "24 junio", time: "18:00", group: "C", home: "Escocia", away: "Brasil", homeResult: null, awayResult: null, locked: false },
  { id: 19, date: "24 junio", time: "18:00", group: "C", home: "Marruecos", away: "Haití", homeResult: null, awayResult: null, locked: false },
  { id: 20, date: "24 junio", time: "21:00", group: "A", home: "República Checa", away: "México", homeResult: null, awayResult: null, locked: false },
  { id: 21, date: "24 junio", time: "21:00", group: "A", home: "Sudáfrica", away: "República de Corea", homeResult: null, awayResult: null, locked: false },

  { id: 22, date: "25 junio", time: "16:00", group: "E", home: "Curazao", away: "Costa de Marfil", homeResult: null, awayResult: null, locked: false },
  { id: 23, date: "25 junio", time: "16:00", group: "E", home: "Ecuador", away: "Alemania", homeResult: null, awayResult: null, locked: false },
  { id: 24, date: "25 junio", time: "19:00", group: "F", home: "Japón", away: "Suecia", homeResult: null, awayResult: null, locked: false },
  { id: 25, date: "25 junio", time: "19:00", group: "F", home: "Túnez", away: "Países Bajos", homeResult: null, awayResult: null, locked: false },
  { id: 26, date: "25 junio", time: "22:00", group: "D", home: "Turquía", away: "Estados Unidos", homeResult: null, awayResult: null, locked: false },
  { id: 27, date: "25 junio", time: "22:00", group: "D", home: "Paraguay", away: "Australia", homeResult: null, awayResult: null, locked: false },

  { id: 28, date: "26 junio", time: "15:00", group: "I", home: "Noruega", away: "Francia", homeResult: null, awayResult: null, locked: false },
  { id: 29, date: "26 junio", time: "15:00", group: "I", home: "Senegal", away: "Irak", homeResult: null, awayResult: null, locked: false },
  { id: 30, date: "26 junio", time: "20:00", group: "H", home: "Cabo Verde", away: "Arabia Saudí", homeResult: null, awayResult: null, locked: false },
  { id: 31, date: "26 junio", time: "20:00", group: "H", home: "Uruguay", away: "España", homeResult: null, awayResult: null, locked: false },
  { id: 32, date: "26 junio", time: "23:00", group: "G", home: "Egipto", away: "Irán", homeResult: null, awayResult: null, locked: false },
  { id: 33, date: "26 junio", time: "23:00", group: "G", home: "Nueva Zelanda", away: "Bélgica", homeResult: null, awayResult: null, locked: false },

  { id: 34, date: "27 junio", time: "17:00", group: "L", home: "Panamá", away: "Inglaterra", homeResult: null, awayResult: null, locked: false },
  { id: 35, date: "27 junio", time: "17:00", group: "L", home: "Croacia", away: "Ghana", homeResult: null, awayResult: null, locked: false },
  { id: 36, date: "27 junio", time: "19:30", group: "K", home: "Colombia", away: "Portugal", homeResult: null, awayResult: null, locked: false },
  { id: 37, date: "27 junio", time: "19:30", group: "K", home: "RD Congo", away: "Uzbekistán", homeResult: null, awayResult: null, locked: false },
  { id: 38, date: "27 junio", time: "22:00", group: "J", home: "Argelia", away: "Austria", homeResult: null, awayResult: null, locked: false },
  { id: 39, date: "27 junio", time: "22:00", group: "J", home: "Jordania", away: "Argentina", homeResult: null, awayResult: null, locked: false }
];

let currentAlias = localStorage.getItem("alias") || "";
let predictions = [];

const aliasInput = document.getElementById("aliasInput");
const saveAliasBtn = document.getElementById("saveAliasBtn");
const currentUser = document.getElementById("currentUser");
const matchesContainer = document.getElementById("matchesContainer");
const rankingBody = document.getElementById("rankingBody");
const predictionsTable = document.getElementById("predictionsTable");

init();

async function init() {
  aliasInput.value = currentAlias;
  updateCurrentUser();

  await loadPredictions();

  renderMatches();
  renderRanking();
  renderPredictionsTable();
}

saveAliasBtn.addEventListener("click", async () => {
  const alias = aliasInput.value.trim();

  if (!alias) {
    alert("Escribe un nombre o alias.");
    return;
  }

  currentAlias = alias;
  localStorage.setItem("alias", currentAlias);

  await saveUser(alias);

  updateCurrentUser();
  renderMatches();
  renderRanking();

});

async function saveUser(alias) {
  const { error } = await supabaseClient
    .from("users")
    .insert([
      {
        alias: alias
      }
    ]);

  if (error) {
    console.error(error);
  }
}

async function loadPredictions() {
  const { data, error } = await supabaseClient
    .from("predictions")
    .select("*");

  if (error) {
    console.error(error);
    alert("Error cargando predicciones desde Supabase.");
    return;
  }

  predictions = data || [];
}

function updateCurrentUser() {
  currentUser.textContent = currentAlias
    ? `Usuario activo: ${currentAlias}`
    : "Todavía no has guardado usuario.";
}

function renderMatches() {
  matchesContainer.innerHTML = "";

  matches.forEach(match => {
    const saved = predictions.find(
      p => p.match_id === match.id && p.user_alias === currentAlias
    );

    const div = document.createElement("div");
    div.className = "match-card";

    div.innerHTML = `
      <div class="match-info">
        <strong>${match.date} · ${match.time}</strong>
        <span>Grupo ${match.group}</span>
      </div>

      <div class="teams">
        <span>${match.home}</span>
        <strong>VS</strong>
        <span>${match.away}</span>
      </div>

      <div class="prediction-row">
        <input 
          type="number" 
          min="0" 
          id="home-${match.id}" 
          value="${saved ? saved.home_score : ""}" 
          placeholder="0"
          ${match.locked ? "disabled" : ""}
        >

        <span>-</span>

        <input 
          type="number" 
          min="0" 
          id="away-${match.id}" 
          value="${saved ? saved.away_score : ""}" 
          placeholder="0"
          ${match.locked ? "disabled" : ""}
        >
      </div>

      <button 
        onclick="savePrediction(${match.id})"
        ${match.locked ? "disabled" : ""}
      >
        ${match.locked ? "Partido cerrado" : "Guardar pronóstico"}
      </button>
    `;

    matchesContainer.appendChild(div);
  });
}

async function savePrediction(matchId) {
  if (!currentAlias) {
    alert("Primero guarda tu usuario.");
    return;
  }

  const match = matches.find(m => m.id === matchId);

  if (match.locked) {
    alert("Este partido ya está cerrado.");
    return;
  }

  const homeValue = document.getElementById(`home-${matchId}`).value;
  const awayValue = document.getElementById(`away-${matchId}`).value;

  if (homeValue === "" || awayValue === "") {
    alert("Pon los dos resultados.");
    return;
  }

  const oldPrediction = predictions.find(
    p => p.match_id === matchId && p.user_alias === currentAlias
  );

  if (oldPrediction) {
    const { error } = await supabaseClient
      .from("predictions")
      .update({
        home_score: Number(homeValue),
        away_score: Number(awayValue)
      })
      .eq("id", oldPrediction.id);

    if (error) {
      console.error(error);
      alert("Error actualizando pronóstico.");
      return;
    }
  } else {
    const { error } = await supabaseClient
      .from("predictions")
      .insert([
        {
          user_alias: currentAlias,
          match_id: matchId,
          home_score: Number(homeValue),
          away_score: Number(awayValue)
        }
      ]);

    if (error) {
      console.error(error);
      alert("Error guardando pronóstico.");
      return;
    }
  }

  await loadPredictions();
  renderMatches();
  renderRanking();
  renderPredictionsTable();

  alert("Pronóstico guardado online.");
}

function getWinner(home, away) {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
}

function calculatePointsForAlias(alias) {
  let points = 0;

  predictions
    .filter(p => p.user_alias === alias)
    .forEach(prediction => {
      const match = matches.find(m => m.id === prediction.match_id);

      if (!match || match.homeResult === null || match.awayResult === null) {
        return;
      }

      const predictedWinner = getWinner(
        prediction.home_score,
        prediction.away_score
      );

      const realWinner = getWinner(
        match.homeResult,
        match.awayResult
      );

      if (predictedWinner === realWinner) {
        points += 3;
      }

      // +1 punto por resultado exacto
      if (
        prediction.home_score === match.homeResult &&
        prediction.away_score === match.awayResult
      ) {
        points += 1;
      }
    });

  return points;
}

function renderRanking() {
  rankingBody.innerHTML = "";

  const aliases = [...new Set(predictions.map(p => p.user_alias))];

  if (aliases.length === 0) {
    rankingBody.innerHTML = `
      <tr>
        <td colspan="2">Todavía no hay pronósticos guardados.</td>
      </tr>
    `;
    return;
  }

  const ranking = aliases
    .map(alias => ({
      alias: alias,
      points: calculatePointsForAlias(alias)
    }))
    .sort((a, b) => b.points - a.points);

  ranking.forEach((user, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}. ${user.alias}</td>
      <td>${user.points}</td>
    `;

    rankingBody.appendChild(row);
  });

}
function renderPredictionsTable() {

  if (!predictionsTable) return;

  predictionsTable.innerHTML = "";

  let lastMatchId = null;

  predictions
    .sort((a, b) => a.match_id - b.match_id)
    .forEach(prediction => {

      const match = matches.find(
        m => m.id === prediction.match_id
      );

      if (!match) return;

      // Cabecera de partido
      if (lastMatchId !== prediction.match_id) {

        const titleRow = document.createElement("tr");

        titleRow.innerHTML = `
          <td colspan="4"
              style="
                background: rgba(255,215,0,0.15);
                font-weight: bold;
                text-align: center;
                padding: 12px;
                border-top: 2px solid rgba(255,255,255,0.2);
              ">
            ⚽ ${match.home} vs ${match.away}
          </td>
        `;

        predictionsTable.appendChild(titleRow);

        lastMatchId = prediction.match_id;
      }

      let points = 0;

      if (
        match.homeResult !== null &&
        match.awayResult !== null
      ) {

        const predictedWinner = getWinner(
          prediction.home_score,
          prediction.away_score
        );

        const realWinner = getWinner(
          match.homeResult,
          match.awayResult
        );

        if (predictedWinner === realWinner) {
          points += 3;
        }

        if (
          prediction.home_score === match.homeResult &&
          prediction.away_score === match.awayResult
        ) {
          points += 1;
        }
      }

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${prediction.user_alias}</td>
        <td>${prediction.home_score} - ${prediction.away_score}</td>
        <td>${points}</td>
      `;

      predictionsTable.appendChild(row);

    });

}