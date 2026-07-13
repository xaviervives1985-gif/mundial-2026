import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase.js";

const stageLabels = {
  group: "Fase de grupos",
  round_32: "Dieciseisavos de final",
  round_16: "Octavos de final",
  quarter_final: "Cuartos de final",
  semi_final: "Semifinales",
  third_place: "Tercer puesto",
  final: "Final"
};

const statusLabels = {
  pending: "Pendiente",
  open: "Abierto",
  locked: "Cerrado",
  finished: "Finalizado"
};

const state = {
  alias: localStorage.getItem("wc_alias") || "",
  matches: [],
  players: [],
  predictions: [],
  leaderboard: [],
  predictionsOverview: [],
  topScorers: [],
  bestPlayers: []
};

const els = {
  aliasForm: document.getElementById("aliasForm"),
  aliasInput: document.getElementById("aliasInput"),
  currentUser: document.getElementById("currentUser"),
  configWarning: document.getElementById("configWarning"),
  stageFilter: document.getElementById("stageFilter"),
  refreshButton: document.getElementById("refreshButton"),
  matchesList: document.getElementById("matchesList"),
  leaderboardBody: document.getElementById("leaderboardBody"),
  predictionsList: document.getElementById("predictionsList"),
  predictionsRefreshButton: document.getElementById("predictionsRefreshButton"),
  topScorersList: document.getElementById("topScorersList"),
  bestPlayersList: document.getElementById("bestPlayersList"),
  toast: document.getElementById("toast")
};

init();

function init() {
  if (SUPABASE_URL.includes("PEGA_AQUI") || SUPABASE_ANON_KEY.includes("PEGA_AQUI")) {
    els.configWarning.classList.remove("hidden");
  }

  if (state.alias) {
    els.aliasInput.value = state.alias;
    renderCurrentUser();
  }

  els.aliasForm.addEventListener("submit", handleAliasSubmit);
  els.stageFilter.addEventListener("change", renderMatches);
  els.refreshButton.addEventListener("click", loadAll);
  els.predictionsRefreshButton?.addEventListener("click", async () => {
    await loadPredictionsOverview();
    renderPredictionsOverview();
    renderQuarterBracket();
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  els.matchesList.addEventListener("submit", handlePredictionSubmit);
  els.matchesList.addEventListener("change", handlePredictionChange);
  const quarterBracket = document.getElementById("quarterBracket");

quarterBracket?.addEventListener("submit", handlePredictionSubmit);
quarterBracket?.addEventListener("change", handlePredictionChange);

  // Al entrar en la web, mostrar directamente Cuartos de final.
  if (els.stageFilter) {
    els.stageFilter.value = "semi_final";
  }

  loadAll();
}

function activateTab(tabId) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });

  document.querySelectorAll(".tab-section").forEach((section) => {
    section.classList.toggle("active", section.id === tabId);
  });

  if (tabId === "predictionsSection") {
    loadPredictionsOverview().then(renderPredictionsOverview);
  }
}

async function handleAliasSubmit(event) {
  event.preventDefault();

  const alias = normalizeAlias(els.aliasInput.value);
  if (!alias) {
    showToast("Escribe un alias válido.");
    return;
  }

  state.alias = alias;
  localStorage.setItem("wc_alias", alias);

  await ensureUser(alias);
  renderCurrentUser();
  await loadPredictions();
  renderMatches();
  renderQuarterBracket();
  showToast(`Has entrado como ${alias}.`);
}

function normalizeAlias(value) {
  return value.trim().toLowerCase();
}

async function ensureUser(alias) {
  const { error } = await supabase.rpc("ensure_user_alias", {
    p_alias: alias
  });

  if (error) {
    console.error(error);
    showToast(error.message || "No se pudo crear o comprobar el usuario.");
  }
}

function renderCurrentUser() {
  els.currentUser.textContent = state.alias
    ? `Usuario activo: ${state.alias}`
    : "";
}

async function loadAll() {
  await Promise.all([
    loadPlayers(),
    loadMatches(),
    loadLeaderboard(),
    loadPredictionsOverview(),
    loadTopScorers(),
    loadBestPlayers()
  ]);

  if (state.alias) {
    await loadPredictions();
  }

  renderMatches();
  renderLeaderboard();
  renderPredictionsOverview();
  renderQuarterBracket();
  renderTopScorers();
  renderBestPlayers();
}

async function loadMatches() {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      id,
      stage,
      match_number,
      sort_order,
      kickoff_at,
      home_placeholder,
      away_placeholder,
      home_score,
      away_score,
      status,
      went_extra_time,
      went_penalties,
      winner_team_id,
      home_team:home_team_id(id, name, code, flag_emoji, flag_url),
      away_team:away_team_id(id, name, code, flag_emoji, flag_url),
      mvp:mvp_player_id(id, name)
    `)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("kickoff_at", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    showToast("No se pudieron cargar los partidos.");
    return;
  }

  state.matches = data || [];
}

async function loadPlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("id, name, position, team_id, teams:team_id(id, name, code, flag_emoji)")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    state.players = [];
    return;
  }

  state.players = data || [];
}

async function loadPredictions() {
  if (!state.alias) {
    state.predictions = [];
    return;
  }

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .ilike("user_alias", state.alias);

  if (error) {
    console.error(error);
    showToast("No se pudieron cargar tus pronósticos.");
    return;
  }

  state.predictions = data || [];
}

async function loadLeaderboard() {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("total_points", { ascending: false })
    .order("winners_hit", { ascending: false })
    .order("exact_scores_hit", { ascending: false });

  if (error) {
    console.error(error);
    state.leaderboard = [];
    return;
  }

  state.leaderboard = data || [];
}


async function loadPredictionsOverview() {
  const { data, error } = await supabase
    .from("predictions_overview")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("user_alias", { ascending: true });

  if (error) {
    console.error(error);
    state.predictionsOverview = [];
    return;
  }

  state.predictionsOverview = data || [];
}

async function loadTopScorers() {
  const { data, error } = await supabase
    .from("top_scorers")
    .select("*")
    .limit(10);

  if (error) {
    console.error(error);
    state.topScorers = [];
    return;
  }

  state.topScorers = data || [];
}

async function loadBestPlayers() {
  const { data, error } = await supabase
    .from("best_players")
    .select("*")
    .limit(10);

  if (error) {
    console.error(error);
    state.bestPlayers = [];
    return;
  }

  state.bestPlayers = data || [];
}

function renderMatches() {
  const filter = els.stageFilter.value;
  const matches = filter === "all"
    ? state.matches
    : state.matches.filter((match) => match.stage === filter);

  if (!matches.length) {
    els.matchesList.innerHTML = `
      <div class="empty">
        Todavía no hay partidos cargados para esta fase.
        Cuando se sepan los cruces, añádelos en Supabase.
      </div>
    `;
    return;
  }

  const grouped = groupBy(matches, "stage");

  els.matchesList.innerHTML = Object.entries(grouped)
    .map(([stage, stageMatches]) => `
      <div>
        <h3 class="stage-title">${stageLabels[stage] || stage}</h3>
        <div class="matches-grid">
          ${stageMatches.map(renderMatchCard).join("")}
        </div>
      </div>
    `)
    .join("");
}

function renderMatchCard(match) {
  const home = getTeamDisplay(match.home_team, match.home_placeholder);
  const away = getTeamDisplay(match.away_team, match.away_placeholder);
  const prediction = state.predictions.find((item) => Number(item.match_id) === Number(match.id));
  const isOpen = match.status === "open";
  const scoreText = formatRealScore(match);
  const teamOptions = buildWinnerOptions(match, prediction);
  const homeScoreValue = prediction?.home_score ?? "";
  const awayScoreValue = prediction?.away_score ?? "";
  const extraTimeChecked = prediction?.predicts_extra_time ? "checked" : "";
  const penaltiesChecked = prediction?.predicts_penalties ? "checked" : "";

  return `
    <article class="match-card">
      <div class="match-top">
        <div>
          <strong>${match.match_number ? `Partido ${match.match_number}` : "Partido"}</strong>
          <div class="match-date">${formatDate(match.kickoff_at)}</div>
        </div>
        <span class="status status-${match.status}">
          ${statusLabels[match.status] || match.status}
        </span>
      </div>

      <div class="teams-row">
        <div class="team home">
          ${renderFlag(home)}
          <div>
            <div class="team-name">${escapeHtml(home.name)}</div>
            <div class="team-code">${escapeHtml(home.code || "")}</div>
          </div>
        </div>

        <div class="score">${scoreText}</div>

        <div class="team away">
          <div>
            <div class="team-name">${escapeHtml(away.name)}</div>
            <div class="team-code">${escapeHtml(away.code || "")}</div>
          </div>
          ${renderFlag(away)}
        </div>
      </div>

      <form class="prediction-form" data-match-id="${match.id}">
        <div class="prediction-layout">

          <div class="prediction-block prediction-block-score">
            <div class="prediction-block-title">Resultado del partido</div>

            <div class="field">
              <label>Resultado</label>
              <div class="score-inputs">
                <input
                  type="number"
                  name="home_score"
                  min="0"
                  inputmode="numeric"
                  value="${homeScoreValue}"
                  ${isOpen ? "" : "disabled"}
                />
                <span>-</span>
                <input
                  type="number"
                  name="away_score"
                  min="0"
                  inputmode="numeric"
                  value="${awayScoreValue}"
                  ${isOpen ? "" : "disabled"}
                />
              </div>
            </div>

            <div class="check-row">
              <label>
                <input
                  type="checkbox"
                  name="predicts_extra_time"
                  ${extraTimeChecked}
                  ${isOpen ? "" : "disabled"}
                />
                Se decide en prórroga
              </label>

              <label>
                <input
                  type="checkbox"
                  name="predicts_penalties"
                  ${penaltiesChecked}
                  ${isOpen ? "" : "disabled"}
                />
                Se decide en penaltis
              </label>
            </div>
          </div>

          <div class="prediction-block prediction-block-extra">
            <div class="prediction-block-title">Pronóstico adicional</div>

            <div class="form-grid-secondary form-grid-no-mvp">
              <div class="field">
                <label>Ganador</label>
                <select name="predicted_winner_team_id" ${isOpen ? "" : "disabled"}>
                  ${teamOptions}
                </select>
              </div>

              <div class="field">
                <label>Mis puntos</label>
                <div class="prediction-points">${prediction?.points ?? 0} pts</div>
              </div>
            </div>
          </div>

        </div>

        <div class="form-actions">
          <small>
            Puntuación máxima por partido: 6 puntos.
          </small>
          <button type="submit" ${isOpen ? "" : "disabled"}>
            Guardar pronóstico
          </button>
        </div>
      </form>
    </article>
  `;
}

function getTeamDisplay(team, placeholder) {
  if (team) {
    return {
      id: team.id,
      name: team.name,
      code: team.code,
      flag_emoji: team.flag_emoji,
      flag_url: team.flag_url
    };
  }

  return {
    id: null,
    name: placeholder || "Por definir",
    code: "TBD",
    flag_emoji: "🌐",
    flag_url: ""
  };
}

function renderFlag(team) {
  if (team.flag_url) {
    return `<div class="flag"><img src="${escapeHtml(team.flag_url)}" alt="${escapeHtml(team.name)}"></div>`;
  }

  return `<div class="flag">${team.flag_emoji || "🌐"}</div>`;
}

function buildWinnerOptions(match, prediction) {
  const selected = prediction?.predicted_winner_team_id
    ? String(prediction.predicted_winner_team_id)
    : "";

  const options = [`<option value="">Elige ganador</option>`];

  if (match.home_team?.id) {
    options.push(`
      <option value="${match.home_team.id}" ${selected === String(match.home_team.id) ? "selected" : ""}>
        ${escapeHtml(match.home_team.name)}
      </option>
    `);
  }

  if (match.away_team?.id) {
    options.push(`
      <option value="${match.away_team.id}" ${selected === String(match.away_team.id) ? "selected" : ""}>
        ${escapeHtml(match.away_team.name)}
      </option>
    `);
  }

  return options.join("");
}

function buildMvpOptions(match, prediction) {
  const teamIds = [match.home_team?.id, match.away_team?.id].filter(Boolean);
  const players = state.players.filter((player) => teamIds.includes(player.team_id));
  const selected = prediction?.predicted_mvp_player_id
    ? String(prediction.predicted_mvp_player_id)
    : "";

  if (!players.length) return "";

  return [
    `<option value="">Elige MVP</option>`,
    ...players.map((player) => `
      <option value="${player.id}" ${selected === String(player.id) ? "selected" : ""}>
        ${escapeHtml(player.name)}
      </option>
    `)
  ].join("");
}

async function handlePredictionSubmit(event) {
  event.preventDefault();

  if (!event.target.classList.contains("prediction-form")) return;

  if (!state.alias) {
    showToast("Primero escribe tu alias.");
    return;
  }

  const form = event.target;
  const matchId = Number(form.dataset.matchId);
  const match = state.matches.find((item) => Number(item.id) === matchId);

  if (!match || match.status !== "open") {
    showToast("Este partido no está abierto para pronósticos.");
    return;
  }

  const formData = new FormData(form);

  const payload = {
    user_alias: state.alias,
    match_id: matchId,
    home_score: numberOrNull(formData.get("home_score")),
    away_score: numberOrNull(formData.get("away_score")),
    predicted_winner_team_id: numberOrNull(formData.get("predicted_winner_team_id")),
    predicts_extra_time: formData.get("predicts_extra_time") === "on",
    predicts_penalties: formData.get("predicts_penalties") === "on",
    predicted_mvp_player_id: null
  };

  if (payload.home_score === null || payload.away_score === null) {
    showToast("Pon el resultado completo antes de guardar.");
    return;
  }

  // Si no hay empate, el ganador se calcula automáticamente según el resultado.
  if (payload.home_score > payload.away_score) {
    payload.predicted_winner_team_id = match.home_team?.id || null;
  } else if (payload.away_score > payload.home_score) {
    payload.predicted_winner_team_id = match.away_team?.id || null;
  } else if (!payload.predicted_winner_team_id) {
    showToast("Si pones empate, elige quién pasa.");
    return;
  }

  if (payload.predicts_penalties) {
    payload.predicts_extra_time = true;
  }

  const { error } = await supabase.rpc("save_prediction", {
    p_user_alias: payload.user_alias,
    p_match_id: payload.match_id,
    p_home_score: payload.home_score,
    p_away_score: payload.away_score,
    p_predicted_winner_team_id: payload.predicted_winner_team_id,
    p_predicts_extra_time: payload.predicts_extra_time,
    p_predicts_penalties: payload.predicts_penalties,
    p_predicted_mvp_player_id: null
  });

  if (error) {
    console.error(error);
    showToast(error.message || "No se pudo guardar el pronóstico.");
    return;
  }

  await loadPredictions();
  await loadLeaderboard();
  await loadPredictionsOverview();
  renderMatches();
  renderLeaderboard();
  renderPredictionsOverview();
  renderQuarterBracket();
  showToast("Pronóstico guardado.");
}

function handlePredictionChange(event) {
  if (event.target.name === "predicts_penalties" && event.target.checked) {
    const form = event.target.closest("form");
    const extraTime = form.querySelector('input[name="predicts_extra_time"]');
    if (extraTime) extraTime.checked = true;
  }
}

function renderLeaderboard() {
  if (!state.leaderboard.length) {
    els.leaderboardBody.innerHTML = `
      <tr>
        <td colspan="7">Todavía no hay usuarios en la clasificación.</td>
      </tr>
    `;
    return;
  }

  els.leaderboardBody.innerHTML = state.leaderboard
    .map((row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(row.alias)}</strong></td>
        <td><strong>${row.total_points}</strong></td>
        <td>${row.winners_hit}</td>
        <td>${row.exact_scores_hit}</td>
        <td>${row.extra_time_hit}</td>
        <td>${row.penalties_hit}</td>
      </tr>
    `)
    .join("");
}


function renderPredictionsOverview() {
  if (!els.predictionsList) return;

  if (!state.predictionsOverview.length) {
    els.predictionsList.innerHTML = `
      <div class="empty">
        Todavía no hay pronósticos visibles. Recuerda: solo aparecen cuando el partido está cerrado o finalizado.
      </div>
    `;
    return;
  }

  const grouped = groupBy(state.predictionsOverview, "match_id");

  els.predictionsList.innerHTML = Object.values(grouped)
    .map(renderPredictionMatchCard)
    .join("");
}

function renderPredictionMatchCard(rows) {
  const first = rows[0];
  const homeFlag = first.home_flag || "🌐";
  const awayFlag = first.away_flag || "🌐";

  return `
    <article class="prediction-match-card">
      <div class="prediction-match-header">
        <div>
          <div class="prediction-match-number">
            ${first.match_number ? `Partido ${first.match_number}` : "Partido"}
            · ${stageLabels[first.stage] || first.stage}
          </div>
          <h3>
            <span>${escapeHtml(homeFlag)} ${escapeHtml(first.home_team)}</span>
            <span class="prediction-versus">vs</span>
            <span>${escapeHtml(awayFlag)} ${escapeHtml(first.away_team)}</span>
          </h3>
          <div class="match-date">${formatDate(first.kickoff_at)}</div>
        </div>

        <span class="status status-${first.match_status}">
          ${statusLabels[first.match_status] || first.match_status}
        </span>
      </div>

      <div class="prediction-users-grid">
        ${rows.map(renderPredictionUserCard).join("")}
      </div>
    </article>
  `;
}


function getPredictionWinnerText(row) {
  if (row.predicted_winner) {
    return `${row.predicted_winner_flag || ""} ${row.predicted_winner}`;
  }

  const homeScore = Number(row.home_score);
  const awayScore = Number(row.away_score);

  if (!Number.isNaN(homeScore) && !Number.isNaN(awayScore)) {
    if (homeScore > awayScore) {
      return `${row.home_flag || ""} ${row.home_team}`;
    }

    if (awayScore > homeScore) {
      return `${row.away_flag || ""} ${row.away_team}`;
    }

    return "Empate: falta elegir quién pasa";
  }

  return "Sin ganador";
}

function renderPredictionUserCard(row) {
  const winner = getPredictionWinnerText(row);

  const extra = row.predicts_penalties
    ? "Penaltis"
    : row.predicts_extra_time
      ? "Prórroga"
      : "90 minutos";

  return `
    <div class="prediction-user-card">
      <div class="prediction-user-top">
        <strong>${escapeHtml(row.user_alias)}</strong>
        <span>${row.points ?? 0} pts</span>
      </div>

      <div class="prediction-score">
        ${row.home_score ?? "-"} <span>-</span> ${row.away_score ?? "-"}
      </div>

      <div class="prediction-detail">
        <span>Ganador</span>
        <strong>${escapeHtml(winner)}</strong>
      </div>

      <div class="prediction-detail">
        <span>Cómo se decide</span>
        <strong>${escapeHtml(extra)}</strong>
      </div>

    </div>
  `;
}

function renderTopScorers() {
  els.topScorersList.innerHTML = renderPlayerList(
    state.topScorers,
    (player) => `${player.goals ?? 0} goles`
  );
}

function renderBestPlayers() {
  els.bestPlayersList.innerHTML = renderPlayerList(
    state.bestPlayers,
    (player) => player.rating ? `${player.rating}` : `${player.mvp_count ?? 0} MVP`
  );
}

function renderPlayerList(players, statFormatter) {
  if (!players.length) {
    return `<div class="empty">Todavía no hay jugadores cargados.</div>`;
  }

  return players.map((player) => `
    <div class="player-item">
      <div>
        <strong>${escapeHtml(player.flag_emoji || "")} ${escapeHtml(player.player_name)}</strong>
        <div class="player-meta">${escapeHtml(player.team_name || "Sin selección")}</div>
      </div>
      <div class="player-stat">${escapeHtml(statFormatter(player))}</div>
    </div>
  `).join("");
}

function formatRealScore(match) {
  if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) {
    return "vs";
  }

  return `${match.home_score} - ${match.away_score}`;
}

function formatDate(value) {
  if (!value) return "Fecha por definir";

  const date = new Date(value);
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function groupBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "other";
    acc[value] = acc[value] || [];
    acc[value].push(item);
    return acc;
  }, {});
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove("hidden");

  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    els.toast.classList.add("hidden");
  }, 3200);
}

/* =====================================================
   ARREGLO: rellenar desplegables de Predicciones del torneo
   Máximo goleador + MVP del torneo
   ===================================================== */

function tournamentPatchAlias() {
  return (
    localStorage.getItem("wc_alias") ||
    document.getElementById("aliasInput")?.value ||
    ""
  ).trim().toLowerCase();
}

function tournamentPatchNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function tournamentPatchEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tournamentPatchToast(message) {
  try {
    if (typeof showToast === "function") {
      showToast(message);
      return;
    }
  } catch (_) {}

  const toastEl = document.getElementById("toast");
  if (toastEl) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2500);
    return;
  }

  console.log(message);
}

async function tournamentPatchLoadPlayers() {
  let { data, error } = await supabase
    .from("players")
    .select("id, name, team_id, teams:team_id(id, name, flag_emoji)")
    .order("name", { ascending: true });

  // Plan B por si Supabase no acepta la relación teams:team_id
  if (error) {
    console.warn("No se pudo cargar players con teams, probando sin equipos:", error);

    const fallback = await supabase
      .from("players")
      .select("id, name, team_id")
      .order("name", { ascending: true });

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error(error);
    tournamentPatchToast("No se pudieron cargar los jugadores.");
    return [];
  }

  return data || [];
}

function tournamentPatchBuildOptions(players) {
  if (!players.length) {
    return `<option value="">No hay jugadores cargados</option>`;
  }

  return `<option value="">Elige jugador</option>` + players
    .sort((a, b) => {
      const teamA = a.teams?.name || "";
      const teamB = b.teams?.name || "";
      return `${teamA} ${a.name}`.localeCompare(`${teamB} ${b.name}`, "es");
    })
    .map((player) => {
      const flag = player.teams?.flag_emoji || "";
      const team = player.teams?.name || "";
      const label = team
        ? `${flag} ${player.name} · ${team}`
        : player.name;

      return `<option value="${player.id}">${tournamentPatchEscape(label)}</option>`;
    })
    .join("");
}

async function tournamentPatchLoadMine() {
  const alias = tournamentPatchAlias();
  if (!alias) return null;

  const { data, error } = await supabase
    .from("tournament_predictions")
    .select("*")
    .ilike("user_alias", alias)
    .maybeSingle();

  if (error) {
    console.warn(error);
    return null;
  }

  return data || null;
}

async function tournamentPatchRenderOverview() {
  const list = document.getElementById("tournamentPredictionsList");
  if (!list) return;

  const { data, error } = await supabase
    .from("tournament_predictions_overview")
    .select("*")
    .order("user_alias", { ascending: true });

  if (error) {
    console.warn(error);
    list.innerHTML = `<div class="empty">No se pudieron cargar las predicciones guardadas.</div>`;
    return;
  }

  const rows = data || [];

  if (!rows.length) {
    list.innerHTML = `<div class="empty">Todavía no hay predicciones del torneo guardadas.</div>`;
    return;
  }

  list.innerHTML = rows.map((row) => `
    <div class="tournament-prediction-card">
      <div class="tournament-user">${tournamentPatchEscape(row.user_alias)}</div>

      <div class="tournament-pick">
        <span>Máximo goleador</span>
        <strong>
          ${tournamentPatchEscape(row.predicted_top_scorer_flag || "")}
          ${tournamentPatchEscape(row.predicted_top_scorer || "Sin elegir")}
        </strong>
        <small>${tournamentPatchEscape(row.predicted_top_scorer_team || "")}</small>
      </div>

      <div class="tournament-pick">
        <span>MVP del torneo</span>
        <strong>
          ${tournamentPatchEscape(row.predicted_best_player_flag || "")}
          ${tournamentPatchEscape(row.predicted_best_player || "Sin elegir")}
        </strong>
        <small>${tournamentPatchEscape(row.predicted_best_player_team || "")}</small>
      </div>
    </div>
  `).join("");
}

async function tournamentPatchInit() {
  const form = document.getElementById("tournamentPredictionForm");
  const topSelect = document.getElementById("topScorerSelect");
  const bestSelect = document.getElementById("bestPlayerSelect");

  if (!form || !topSelect || !bestSelect) return;
  if (form.dataset.tournamentPatchReady === "1") return;

  form.dataset.tournamentPatchReady = "1";

  topSelect.innerHTML = `<option value="">Cargando jugadores...</option>`;
  bestSelect.innerHTML = `<option value="">Cargando jugadores...</option>`;

  const players = await tournamentPatchLoadPlayers();
  const options = tournamentPatchBuildOptions(players);

  topSelect.innerHTML = options.replace("Elige jugador", "Elige máximo goleador");
  bestSelect.innerHTML = options.replace("Elige jugador", "Elige MVP / mejor jugador");

  const mine = await tournamentPatchLoadMine();

  if (mine?.predicted_top_scorer_id) {
    topSelect.value = String(mine.predicted_top_scorer_id);
  }

  if (mine?.predicted_best_player_id) {
    bestSelect.value = String(mine.predicted_best_player_id);
  }

  await tournamentPatchRenderOverview();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const alias = tournamentPatchAlias();

    if (!alias) {
      tournamentPatchToast("Primero escribe tu alias arriba.");
      return;
    }

    const payload = {
      p_user_alias: alias,
      p_predicted_top_scorer_id: tournamentPatchNumberOrNull(topSelect.value),
      p_predicted_best_player_id: tournamentPatchNumberOrNull(bestSelect.value)
    };

    if (!payload.p_predicted_top_scorer_id && !payload.p_predicted_best_player_id) {
      tournamentPatchToast("Elige al menos un jugador.");
      return;
    }

    const { error } = await supabase.rpc("save_tournament_prediction", payload);

    if (error) {
      console.error(error);
      tournamentPatchToast(error.message || "No se pudo guardar la predicción.");
      return;
    }

    tournamentPatchToast("Predicción del torneo guardada.");
    await tournamentPatchRenderOverview();
  });

  document.getElementById("aliasForm")?.addEventListener("submit", () => {
    setTimeout(async () => {
      const updatedMine = await tournamentPatchLoadMine();

      if (updatedMine?.predicted_top_scorer_id) {
        topSelect.value = String(updatedMine.predicted_top_scorer_id);
      }

      if (updatedMine?.predicted_best_player_id) {
        bestSelect.value = String(updatedMine.predicted_best_player_id);
      }

      await tournamentPatchRenderOverview();
    }, 400);
  });
}

setTimeout(tournamentPatchInit, 0);
document.addEventListener("DOMContentLoaded", tournamentPatchInit);


/* =====================================================
   CUADRO VISUAL DE CUARTOS + PRONÓSTICOS DE USUARIOS
   ===================================================== */

const quarterFallbackMatches = [
  {
    match_number: 97,
    side: "left",
    number: "P97",
    date: "09/07/2026",
    time: "22:00",
    home_team: { flag_emoji: "🇫🇷", code: "FRA", name: "Francia" },
    away_team: { flag_emoji: "🇲🇦", code: "MAR", name: "Marruecos" },
    home_score: null,
    away_score: null,
    status: "open"
  },
  {
    match_number: 98,
    side: "left",
    number: "P98",
    date: "10/07/2026",
    time: "21:00",
    home_team: { flag_emoji: "🇪🇸", code: "ESP", name: "España" },
    away_team: { flag_emoji: "🇧🇪", code: "BEL", name: "Bélgica" },
    home_score: null,
    away_score: null,
    status: "open"
  },
  {
    match_number: 99,
    side: "right",
    number: "P99",
    date: "11/07/2026",
    time: "23:00",
    home_team: { flag_emoji: "🇳🇴", code: "NOR", name: "Noruega" },
    away_team: { flag_emoji: "🏴", code: "ENG", name: "Inglaterra" },
    home_score: null,
    away_score: null,
    status: "open"
  },
  {
    match_number: 100,
    side: "right",
    number: "P100",
    date: "12/07/2026",
    time: "03:00",
    home_team: { flag_emoji: "🇦🇷", code: "ARG", name: "Argentina" },
    away_team: { flag_emoji: "🇨🇭", code: "SUI", name: "Suiza" },
    home_score: null,
    away_score: null,
    status: "open"
  }
];

const quarterMatchNumbers = [97, 98, 99, 100];

function getQuarterMatches() {
  const dbMatches = state.matches
    .filter((match) => quarterMatchNumbers.includes(Number(match.match_number)))
    .sort((a, b) => Number(a.match_number) - Number(b.match_number));

  if (!dbMatches.length) {
    return quarterFallbackMatches;
  }

  return quarterFallbackMatches.map((fallback) => {
    const dbMatch = dbMatches.find((item) => Number(item.match_number) === Number(fallback.match_number));
    return dbMatch || fallback;
  });
}

function getQuarterSide(match) {
  return Number(match.match_number) === 97 || Number(match.match_number) === 98
    ? "left"
    : "right";
}

function getQuarterNumber(match) {
  return `P${match.match_number}`;
}

function getQuarterDate(match) {
  if (match.kickoff_at) {
    const date = new Date(match.kickoff_at);

    return {
      date: new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }).format(date),
      time: new Intl.DateTimeFormat("es-ES", {
        hour: "2-digit",
        minute: "2-digit"
      }).format(date)
    };
  }

  return {
    date: match.date || "Fecha por definir",
    time: match.time || ""
  };
}

function getQuarterFlagClass(code) {
  const normalizedCode = String(code || "tbd").toLowerCase();

  const map = {
    fra: "flag-fra",
    mar: "flag-mar",
    esp: "flag-esp",
    nor: "flag-nor",
    eng: "flag-eng",
    arg: "flag-arg",
    sui: "flag-sui",
    bel: "flag-bel"
  };

  return map[normalizedCode] || "flag-tbd";
}

function renderQuarterTeam(team, placeholder) {
  const display = getTeamDisplay(team, placeholder);
  const flagClass = getQuarterFlagClass(display.code);

  return `
    <div class="team-row">
      <div class="team-info">
        <span class="team-flag ${flagClass}" aria-hidden="true"></span>

        <div>
          <div class="team-name">${escapeHtml(display.name)}</div>
          <div class="team-code">${escapeHtml(display.code || "")}</div>
        </div>
      </div>
    </div>
  `;
}

function formatQuarterScore(match) {
  if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) {
    return "VS";
  }

  const score = `${match.home_score} - ${match.away_score}`;

  if (match.went_penalties) {
    return `${score} · Penaltis`;
  }

  if (match.went_extra_time) {
    return `${score} · Prórroga`;
  }

  return score;
}

function getQuarterPredictionRows(matchNumber) {
  return state.predictionsOverview
    .filter((row) => Number(row.match_number) === Number(matchNumber))
    .sort((a, b) => String(a.user_alias || "").localeCompare(String(b.user_alias || ""), "es"));
}

function renderQuarterPredictionRows(matchNumber) {
  const rows = getQuarterPredictionRows(matchNumber);

  if (!rows.length) {
    return `
      <div class="quarter-user-predictions">
        <div class="quarter-predictions-title">Pronósticos usuarios</div>
        <p class="no-quarter-predictions">
          Todavía no hay pronósticos visibles. Aparecerán cuando el partido esté cerrado o finalizado.
        </p>
      </div>
    `;
  }

  return `
    <div class="quarter-user-predictions">
      <div class="quarter-predictions-title">Pronósticos usuarios</div>
      <div class="quarter-predictions-list">
        ${rows.map((row) => `
          <div class="quarter-prediction-row">
            <span class="prediction-user">${escapeHtml(row.user_alias)}</span>
            <span class="prediction-score">
              ${row.home_score ?? "-"} - ${row.away_score ?? "-"}
            </span>
            <span class="prediction-points">
              ${row.points ?? 0} pts
            </span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function createQuarterMatchCard(match) {
  const when = getQuarterDate(match);
  const matchNumber = Number(match.match_number);

  return `
    <article class="bracket-match">
      <div class="match-top">
        <span class="match-number">${escapeHtml(getQuarterNumber(match))}</span>
        <span>${escapeHtml(when.date)}</span>
        <span>${escapeHtml(when.time)}</span>
      </div>

      ${renderQuarterTeam(match.home_team, match.home_placeholder)}

      <div class="vs-pill"><span>${escapeHtml(formatQuarterScore(match))}</span></div>

      ${renderQuarterTeam(match.away_team, match.away_placeholder)}

      ${renderQuarterPredictionRows(matchNumber)}
    </article>
  `;
}

function getSemifinalMatches() {
  const dbMatches = state.matches
    .filter((match) => match.stage === "semi_final" || [101, 102].includes(Number(match.match_number)))
    .sort((a, b) => Number(a.match_number || 999) - Number(b.match_number || 999));

  const fallback = [
    {
      match_number: 101,
      date: "14/07/2026",
      time: "21:00",
      home_team: { flag_emoji: "🇪🇸", code: "ESP", name: "España" },
      away_team: { flag_emoji: "🇫🇷", code: "FRA", name: "Francia" },
      home_score: null,
      away_score: null,
      status: "open"
    },
    {
      match_number: 102,
      date: "15/07/2026",
      time: "21:00",
      home_team: { flag_emoji: "🏴", code: "ENG", name: "Inglaterra" },
      away_team: { flag_emoji: "🇦🇷", code: "ARG", name: "Argentina" },
      home_score: null,
      away_score: null,
      status: "open"
    }
  ];

  return fallback.map((item) => {
    const dbMatch = dbMatches.find((match) => Number(match.match_number) === Number(item.match_number));

    if (!dbMatch) return item;

    return {
      ...item,
      ...dbMatch,
      home_team: dbMatch.home_team || item.home_team,
      away_team: dbMatch.away_team || item.away_team
    };
  });
}

function getSemiPosterInfo(match) {
  const number = Number(match.match_number);

  if (number === 101) {
    return {
      title: "Semifinal 1",
      homeStar: "Lamine Yamal",
      homeNumber: "19",
      awayStar: "Mbappé",
      awayNumber: "10",
      dateText: "Martes 14 de julio · 21:00 h",
      theme: "semi-one"
    };
  }

  return {
    title: "Semifinal 2",
    homeStar: "Harry Kane",
    homeNumber: "9",
    awayStar: "Messi",
    awayNumber: "10",
    dateText: "Miércoles 15 de julio · 21:00 h",
    theme: "semi-two"
  };
}

function renderSemiPredictionForm(match) {
  if (!match.id) {
    return `
      <div class="semi-warning">
        Crea este partido en Supabase con match_number ${match.match_number} para poder guardar resultados.
      </div>
    `;
  }

  const prediction = state.predictions.find((item) => Number(item.match_id) === Number(match.id));
  const isOpen = match.status === "open";

  const homeScoreValue = prediction?.home_score ?? "";
  const awayScoreValue = prediction?.away_score ?? "";
  const extraTimeChecked = prediction?.predicts_extra_time ? "checked" : "";
  const penaltiesChecked = prediction?.predicts_penalties ? "checked" : "";
  const teamOptions = buildWinnerOptions(match, prediction);

  return `
    <form class="prediction-form semi-result-form" data-match-id="${match.id}">
      <div class="semi-result-title">Tu resultado</div>

      <div class="semi-score-inputs">
        <input
          type="number"
          name="home_score"
          min="0"
          inputmode="numeric"
          placeholder="0"
          value="${homeScoreValue}"
          ${isOpen ? "" : "disabled"}
        />

        <span>-</span>

        <input
          type="number"
          name="away_score"
          min="0"
          inputmode="numeric"
          placeholder="0"
          value="${awayScoreValue}"
          ${isOpen ? "" : "disabled"}
        />
      </div>

      <div class="semi-extra-options">
        <label>
          <input
            type="checkbox"
            name="predicts_extra_time"
            ${extraTimeChecked}
            ${isOpen ? "" : "disabled"}
          />
          Prórroga
        </label>

        <label>
          <input
            type="checkbox"
            name="predicts_penalties"
            ${penaltiesChecked}
            ${isOpen ? "" : "disabled"}
          />
          Penaltis
        </label>
      </div>

      <div class="semi-winner-field">
        <label>Ganador si hay empate</label>
        <select name="predicted_winner_team_id" ${isOpen ? "" : "disabled"}>
          ${teamOptions}
        </select>
      </div>

      <button type="submit" ${isOpen ? "" : "disabled"}>
        Guardar pronóstico
      </button>

      <div class="semi-points">
        Mis puntos: <strong>${prediction?.points ?? 0}</strong>
      </div>
    </form>
  `;
}

function createSemiPosterCard(match) {
  const home = getTeamDisplay(match.home_team, match.home_placeholder);
  const away = getTeamDisplay(match.away_team, match.away_placeholder);
  const info = getSemiPosterInfo(match);

  return `
    <article class="semi-poster-card ${info.theme}">
      <div class="semi-badge">${escapeHtml(info.title)}</div>

      <div class="semi-teams-zone">
        <div class="semi-team-panel semi-team-home">
          <div class="semi-player-name">${escapeHtml(info.homeStar)}</div>
          <div class="semi-player-number">${escapeHtml(info.homeNumber)}</div>

          <div class="semi-flag-row">
            ${renderFlag(home)}
            <div>
              <div class="semi-country">${escapeHtml(home.name)}</div>
              <div class="semi-code">${escapeHtml(home.code || "")}</div>
            </div>
          </div>
        </div>

        <div class="semi-vs">VS</div>

        <div class="semi-team-panel semi-team-away">
          <div class="semi-player-name">${escapeHtml(info.awayStar)}</div>
          <div class="semi-player-number">${escapeHtml(info.awayNumber)}</div>

          <div class="semi-flag-row">
            ${renderFlag(away)}
            <div>
              <div class="semi-country">${escapeHtml(away.name)}</div>
              <div class="semi-code">${escapeHtml(away.code || "")}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="semi-date-pill">
        🗓️ ${escapeHtml(info.dateText)}
      </div>

      ${renderSemiPredictionForm(match)}
    </article>
  `;
}

function renderQuarterBracket() {
  const container = document.getElementById("quarterBracket");
  if (!container) return;

  const title = document.querySelector(".quarter-header h2");
  const subtitle = document.querySelector(".quarter-subtitle");

  if (title) title.textContent = "Semifinales";
  if (subtitle) subtitle.textContent = "Road to World Cup 2026";

  const semifinals = getSemifinalMatches();

  container.innerHTML = `
    <section class="semis-poster">
      <div class="semis-main-title">
        <span>Semifinales</span>
        <small>Road to World Cup 2026</small>
      </div>

      <div class="semis-poster-grid">
        ${semifinals.map(createSemiPosterCard).join("")}
      </div>
    </section>
  `;
}

function injectFifaBracketStyles() {
  if (document.getElementById("fifaBracketStyles")) return;

  const style = document.createElement("style");
  style.id = "fifaBracketStyles";

  style.textContent = `
    #quarterBracket {
      width: 100%;
    }

    #quarterBracket .semis-poster {
      display: grid;
      gap: 24px;
    }

    #quarterBracket .semis-main-title {
      text-align: center;
      margin-bottom: 8px;
    }

    #quarterBracket .semis-main-title span {
      display: block;
      font-size: clamp(2.4rem, 7vw, 5.6rem);
      line-height: 0.9;
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: -0.05em;
      color: #ffd34d;
      text-shadow: 0 8px 30px rgba(0,0,0,0.55);
    }

    #quarterBracket .semis-main-title small {
      display: block;
      margin-top: 8px;
      color: #ffffff;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.26em;
    }

    #quarterBracket .semis-poster-grid {
      display: grid;
      gap: 28px;
    }

    #quarterBracket .semi-poster-card {
      position: relative;
      overflow: hidden;
      border-radius: 30px;
      padding: clamp(18px, 4vw, 34px);
      border: 1px solid rgba(255, 211, 77, 0.38);
      background:
        radial-gradient(circle at 18% 38%, rgba(220, 38, 38, 0.42), transparent 34%),
        radial-gradient(circle at 82% 38%, rgba(37, 99, 235, 0.42), transparent 34%),
        linear-gradient(135deg, rgba(4, 8, 18, 0.96), rgba(10, 18, 38, 0.96));
      box-shadow:
        0 26px 70px rgba(0,0,0,0.45),
        inset 0 1px 0 rgba(255,255,255,0.09);
    }

    #quarterBracket .semi-poster-card::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgba(255,255,255,0.08), transparent 24%, transparent 76%, rgba(255,255,255,0.08)),
        radial-gradient(circle at center, rgba(255, 211, 77, 0.18), transparent 34%);
    }

    #quarterBracket .semi-badge {
      position: relative;
      z-index: 1;
      width: fit-content;
      margin: 0 auto 22px;
      padding: 10px 34px;
      border-radius: 0 0 18px 18px;
      background: linear-gradient(135deg, #ffd34d, #d99a20);
      color: #121212;
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      box-shadow: 0 12px 30px rgba(0,0,0,0.28);
    }

    #quarterBracket .semi-teams-zone {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: clamp(12px, 3vw, 28px);
      align-items: stretch;
    }

    #quarterBracket .semi-team-panel {
      min-height: 250px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 24px;
      border-radius: 24px;
      background: rgba(255,255,255,0.075);
      border: 1px solid rgba(255,255,255,0.14);
    }

    #quarterBracket .semi-team-home {
      background:
        linear-gradient(135deg, rgba(185, 28, 28, 0.58), rgba(255,255,255,0.07));
    }

    #quarterBracket .semi-team-away {
      background:
        linear-gradient(135deg, rgba(29, 78, 216, 0.58), rgba(255,255,255,0.07));
      text-align: right;
    }

    #quarterBracket .semi-player-name {
      color: rgba(255,255,255,0.72);
      font-size: clamp(1.1rem, 3vw, 1.8rem);
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: -0.04em;
    }

    #quarterBracket .semi-player-number {
      margin-top: 2px;
      color: rgba(255, 211, 77, 0.86);
      font-size: clamp(3.5rem, 9vw, 7rem);
      line-height: 0.9;
      font-weight: 1000;
    }

    #quarterBracket .semi-vs {
      align-self: center;
      color: #ffd34d;
      font-size: clamp(2.4rem, 7vw, 5rem);
      font-weight: 1000;
      text-shadow: 0 8px 30px rgba(0,0,0,0.55);
    }

    #quarterBracket .semi-flag-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 18px;
    }

    #quarterBracket .semi-team-away .semi-flag-row {
      justify-content: flex-end;
    }

    #quarterBracket .semi-country {
      color: #ffffff;
      font-size: clamp(1.5rem, 4vw, 3rem);
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: -0.04em;
    }

    #quarterBracket .semi-code {
      color: rgba(255,255,255,0.72);
      font-weight: 900;
      letter-spacing: 0.16em;
    }

    #quarterBracket .semi-date-pill {
      position: relative;
      z-index: 1;
      width: fit-content;
      margin: 20px auto 0;
      padding: 12px 26px;
      border-radius: 999px;
      background: rgba(0,0,0,0.52);
      border: 1px solid rgba(255, 211, 77, 0.45);
      color: #ffffff;
      font-weight: 900;
    }

    #quarterBracket .semi-result-form {
      position: relative;
      z-index: 1;
      margin: 20px auto 0;
      max-width: 760px;
      padding: 18px;
      border: 1px solid rgba(255, 211, 77, 0.28);
      border-radius: 24px;
      background: rgba(0,0,0,0.48);
      display: grid;
      gap: 14px;
    }

    #quarterBracket .semi-result-title {
      text-align: center;
      color: #ffd34d;
      font-weight: 1000;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    #quarterBracket .semi-score-inputs {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 12px;
      align-items: center;
    }

    #quarterBracket .semi-score-inputs input {
      height: 58px;
      text-align: center;
      font-size: 1.7rem;
      font-weight: 1000;
      border-radius: 16px;
    }

    #quarterBracket .semi-score-inputs span {
      color: #ffd34d;
      font-size: 2rem;
      font-weight: 1000;
    }

    #quarterBracket .semi-extra-options {
      display: flex;
      justify-content: center;
      gap: 18px;
      flex-wrap: wrap;
    }

    #quarterBracket .semi-extra-options label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #d9e3f7;
      font-weight: 800;
    }

    #quarterBracket .semi-extra-options input {
      min-height: auto;
      width: auto;
    }

    #quarterBracket .semi-winner-field {
      display: grid;
      gap: 6px;
    }

    #quarterBracket .semi-winner-field label {
      color: #aebbd3;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    #quarterBracket .semi-points {
      text-align: center;
      color: #d9e3f7;
      font-weight: 900;
    }

    #quarterBracket .semi-points strong {
      color: #ffd34d;
    }

    #quarterBracket .semi-warning {
      position: relative;
      z-index: 1;
      margin-top: 18px;
      padding: 14px;
      border-radius: 18px;
      background: rgba(251, 113, 133, 0.14);
      border: 1px solid rgba(251, 113, 133, 0.34);
      color: #ffd7df;
      text-align: center;
      font-weight: 800;
    }

    @media (max-width: 780px) {
      #quarterBracket .semi-teams-zone {
        grid-template-columns: 1fr;
      }

      #quarterBracket .semi-team-away {
        text-align: left;
      }

      #quarterBracket .semi-team-away .semi-flag-row {
        justify-content: flex-start;
      }

      #quarterBracket .semi-vs {
        text-align: center;
      }
    }
  `;

  document.head.appendChild(style);
}

injectFifaBracketStyles();

/* =====================================================
   CLASIFICACIÓN LIMPIA
   Filtro por fase + usuarios duplicados + desglose completo
   ===================================================== */

(function cleanLeaderboardPatch() {
  function normalizeAlias(alias) {
    return String(alias || "Sin usuario")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u00A0/g, " ")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function formatAlias(alias) {
    const clean = String(alias || "Sin usuario")
      .replace(/\u00A0/g, " ")
      .trim()
      .replace(/\s+/g, " ");

    if (!clean) return "Sin usuario";

    return clean
      .split(" ")
      .map((word) => {
        if (word.includes("_")) return word.toLowerCase();
        if (/\d/.test(word)) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }

  function ensureLeaderboardStageFilter() {
    const leaderboardSection = document.getElementById("leaderboardSection");
    if (!leaderboardSection) return;

    let filter = document.getElementById("leaderboardStageFilter");

    if (!filter) {
      const sectionHeader = leaderboardSection.querySelector(".section-header");

      const toolbar = document.createElement("div");
      toolbar.className = "toolbar";

      toolbar.innerHTML = `
        <select id="leaderboardStageFilter" aria-label="Filtrar clasificación por fase">
          <option value="all">General</option>
          <option value="group">Fase de grupos</option>
          <option value="round_32">Dieciseisavos</option>
          <option value="round_16">Octavos</option>
          <option value="quarter_final">Cuartos</option>
          <option value="semi_final">Semifinales</option>
          <option value="third_place">Tercer puesto</option>
          <option value="final">Final</option>
        </select>
      `;

      sectionHeader?.appendChild(toolbar);
      filter = document.getElementById("leaderboardStageFilter");
    }

    if (filter && filter.dataset.cleanLeaderboardReady !== "1") {
      filter.dataset.cleanLeaderboardReady = "1";
      filter.addEventListener("change", () => {
        renderLeaderboard();
      });
    }
  }

  function updateLeaderboardHeader() {
    const tbody = document.getElementById("leaderboardBody");
    const table = tbody?.closest("table");
    const thead = table?.querySelector("thead");

    if (!thead) return;

    thead.innerHTML = `
      <tr>
        <th>#</th>
        <th>Usuario</th>
        <th>Partidos</th>
        <th>Ganadores</th>
        <th>Resultados</th>
        <th>Prórroga</th>
        <th>Penaltis</th>
        <th>Puntos</th>
      </tr>
    `;
  }

  function calculateStats(prediction, match) {
    const predictionHome = Number(prediction.home_score);
    const predictionAway = Number(prediction.away_score);
    const realHome = Number(match.home_score);
    const realAway = Number(match.away_score);

    const hasRealScore =
      match.home_score !== null &&
      match.home_score !== undefined &&
      match.away_score !== null &&
      match.away_score !== undefined;

    const winnerHit =
      prediction.predicted_winner_team_id &&
      match.winner_team_id &&
      Number(prediction.predicted_winner_team_id) === Number(match.winner_team_id);

    const exactScoreHit =
      hasRealScore &&
      prediction.home_score !== null &&
      prediction.home_score !== undefined &&
      prediction.away_score !== null &&
      prediction.away_score !== undefined &&
      predictionHome === realHome &&
      predictionAway === realAway;

    const extraTimeHit =
      Boolean(prediction.predicts_extra_time) &&
      Boolean(match.went_extra_time);

    const penaltiesHit =
      Boolean(prediction.predicts_penalties) &&
      Boolean(match.went_penalties);

    return {
      points: Number(prediction.points || 0),
      winnerHit,
      exactScoreHit,
      extraTimeHit,
      penaltiesHit
    };
  }

  async function buildLeaderboard(filter) {
    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select(`
        id,
        user_alias,
        match_id,
        home_score,
        away_score,
        predicted_winner_team_id,
        predicts_extra_time,
        predicts_penalties,
        points
      `)
      .range(0, 9999);

    if (predictionsError) {
      console.error(predictionsError);
      return [];
    }

    let matchesQuery = supabase
      .from("matches")
      .select(`
        id,
        stage,
        status,
        home_score,
        away_score,
        winner_team_id,
        went_extra_time,
        went_penalties
      `)
      .in("status", ["locked", "finished"])
      .range(0, 9999);

    if (filter !== "all") {
      matchesQuery = matchesQuery.eq("stage", filter);
    }

    const { data: matches, error: matchesError } = await matchesQuery;

    if (matchesError) {
      console.error(matchesError);
      return [];
    }

    const matchesMap = new Map(
      (matches || []).map((match) => [String(match.id), match])
    );

    const usersMap = new Map();

    (predictions || []).forEach((prediction) => {
      const match = matchesMap.get(String(prediction.match_id));
      if (!match) return;

      const aliasKey = normalizeAlias(prediction.user_alias);
      const matchKey = String(prediction.match_id);
      const stats = calculateStats(prediction, match);

      if (!usersMap.has(aliasKey)) {
        usersMap.set(aliasKey, {
          alias: formatAlias(prediction.user_alias),
          matches: new Map()
        });
      }

      const user = usersMap.get(aliasKey);
      const previous = user.matches.get(matchKey);

      const currentValue =
        stats.points * 100 +
        Number(stats.winnerHit) +
        Number(stats.exactScoreHit) +
        Number(stats.extraTimeHit) +
        Number(stats.penaltiesHit);

      const previousValue = previous
        ? previous.points * 100 +
          Number(previous.winnerHit) +
          Number(previous.exactScoreHit) +
          Number(previous.extraTimeHit) +
          Number(previous.penaltiesHit)
        : -1;

      if (!previous || currentValue > previousValue) {
        user.matches.set(matchKey, stats);
      }
    });

    return Array.from(usersMap.values()).map((user) => {
      const matches = Array.from(user.matches.values());

      return {
        alias: user.alias,
        matches: matches.length,
        winnersHit: matches.filter((item) => item.winnerHit).length,
        exactScoresHit: matches.filter((item) => item.exactScoreHit).length,
        extraTimeHit: matches.filter((item) => item.extraTimeHit).length,
        penaltiesHit: matches.filter((item) => item.penaltiesHit).length,
        totalPoints: matches.reduce((sum, item) => sum + item.points, 0)
      };
    });
  }

  renderLeaderboard = async function () {
    ensureLeaderboardStageFilter();
    updateLeaderboardHeader();

    const tbody = document.getElementById("leaderboardBody");
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="8">Cargando clasificación...</td>
      </tr>
    `;

    const filter = document.getElementById("leaderboardStageFilter")?.value || "all";

    const leaderboard = await buildLeaderboard(filter);

    leaderboard.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.winnersHit !== a.winnersHit) return b.winnersHit - a.winnersHit;
      if (b.exactScoresHit !== a.exactScoresHit) return b.exactScoresHit - a.exactScoresHit;
      if (b.extraTimeHit !== a.extraTimeHit) return b.extraTimeHit - a.extraTimeHit;
      if (b.penaltiesHit !== a.penaltiesHit) return b.penaltiesHit - a.penaltiesHit;
      return b.matches - a.matches;
    });

    if (!leaderboard.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">Todavía no hay puntos en esta fase.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = leaderboard
      .map((user, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHtml(user.alias)}</strong></td>
          <td>${user.matches}</td>
          <td>${user.winnersHit}</td>
          <td>${user.exactScoresHit}</td>
          <td>${user.extraTimeHit}</td>
          <td>${user.penaltiesHit}</td>
          <td><strong>${user.totalPoints}</strong></td>
        </tr>
      `)
      .join("");
  };

  document.addEventListener("DOMContentLoaded", () => {
    ensureLeaderboardStageFilter();
    setTimeout(() => {
      renderLeaderboard();
    }, 1000);
  });

  setTimeout(() => {
    ensureLeaderboardStageFilter();
    renderLeaderboard();
  }, 1500);
})();