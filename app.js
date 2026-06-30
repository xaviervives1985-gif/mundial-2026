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
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tab));
  });

  els.matchesList.addEventListener("submit", handlePredictionSubmit);
  els.matchesList.addEventListener("change", handlePredictionChange);

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
  renderMatches();
  renderLeaderboard();
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
