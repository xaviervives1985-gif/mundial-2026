import { supabase } from "./supabase.js";

/* =====================================================
   OVERRIDE FINAL 103/104
   Este archivo se carga DESPUÉS de app.js desde index.html.
   Oculta semifinales y pinta final + tercer puesto.
   ===================================================== */

const FINAL_NUMBERS = [103, 104];

const style = document.createElement("style");
style.textContent = `
  .semis-poster,
  .semis-poster-grid,
  .semi-poster-card,
  .prediction-match-card,
  .prediction-users-grid {
    display: none !important;
  }

  #finalOverridePanel,
  #finalOverridePredictions {
    display: grid;
    gap: 22px;
  }

  .final-override-version {
    width: fit-content;
    margin: 18px auto;
    padding: 10px 18px;
    border-radius: 999px;
    background: rgba(255, 211, 77, 0.16);
    border: 1px solid rgba(255, 211, 77, 0.36);
    color: #ffd34d;
    font-weight: 1000;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    font-size: 0.76rem;
  }

  .final-override-header {
    border: 1px solid rgba(255, 211, 77, 0.30);
    border-radius: 28px;
    padding: clamp(20px, 4vw, 34px);
    background:
      radial-gradient(circle at 16% 20%, rgba(255, 211, 77, 0.14), transparent 30%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(3, 7, 18, 0.98));
    box-shadow: 0 18px 60px rgba(0,0,0,0.28);
  }

  .final-override-header p {
    margin: 0 0 8px;
    color: #ffd34d;
    font-weight: 1000;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .final-override-header h2 {
    margin: 0;
    color: #ffffff;
    font-size: clamp(2rem, 4vw, 3.4rem);
    line-height: 0.96;
    letter-spacing: -0.05em;
  }

  .final-override-header small {
    display: block;
    margin-top: 10px;
    color: #aebbd3;
    font-weight: 800;
  }

  .final-override-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .final-override-card {
    overflow: hidden;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.12);
    background:
      radial-gradient(circle at 18% 16%, rgba(255, 211, 77, 0.10), transparent 32%),
      linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(8, 13, 28, 0.98));
    box-shadow: 0 18px 50px rgba(0,0,0,0.28);
  }

  .final-override-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 18px;
    padding: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
  }

  .final-override-kicker {
    color: #ffd34d;
    font-size: 0.78rem;
    font-weight: 1000;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .final-override-card h3 {
    margin: 0;
    color: #ffffff;
    font-size: clamp(1.35rem, 3vw, 2rem);
    letter-spacing: -0.04em;
  }

  .final-override-card p {
    margin: 6px 0 0;
    color: #aebbd3;
    font-weight: 800;
  }

  .final-override-teams {
    padding: 22px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 14px;
    align-items: center;
  }

  .final-override-team {
    color: #fff;
    font-weight: 1000;
    text-transform: uppercase;
    font-size: clamp(1rem, 2.4vw, 1.35rem);
  }

  .final-override-team.away {
    text-align: right;
  }

  .final-override-score {
    min-width: 76px;
    text-align: center;
    color: #ffd34d;
    font-size: clamp(1.3rem, 4vw, 2.2rem);
    font-weight: 1000;
  }

  .final-override-form {
    display: grid;
    gap: 16px;
    padding: 0 22px 22px;
  }

  .final-override-form-title {
    color: #ffd34d;
    font-weight: 1000;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.14em;
  }

  .final-override-score-inputs {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 12px;
    align-items: center;
  }

  .final-override-score-inputs input {
    height: 62px;
    border-radius: 18px;
    text-align: center;
    font-size: 1.8rem;
    font-weight: 1000;
  }

  .final-override-score-inputs span {
    color: #ffd34d;
    font-size: 2rem;
    font-weight: 1000;
  }

  .final-override-checks {
    display: flex;
    justify-content: center;
    gap: 18px;
    flex-wrap: wrap;
  }

  .final-override-checks label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #d9e3f7;
    font-weight: 900;
  }

  .final-override-checks input {
    width: auto;
    min-height: auto;
  }

  .final-override-winner {
    display: grid;
    gap: 6px;
  }

  .final-override-winner label {
    color: #aebbd3;
    font-size: 0.78rem;
    font-weight: 1000;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .final-override-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    color: #d9e3f7;
    font-weight: 900;
  }

  .final-override-footer strong {
    color: #ffd34d;
  }

  .final-override-footer button {
    width: auto;
    min-width: 210px;
  }

  .final-override-table-wrap {
    overflow-x: auto;
  }

  .final-override-table {
    width: 100%;
    min-width: 760px;
    border-collapse: collapse;
  }

  .final-override-table th,
  .final-override-table td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.09);
    text-align: left;
    color: #e9eef8;
    font-weight: 800;
  }

  .final-override-table th {
    color: #ffd34d;
    font-size: .76rem;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .final-score-pill,
  .final-points-pill,
  .final-mini-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 7px 11px;
    font-weight: 1000;
  }

  .final-score-pill {
    min-width: 76px;
    background: rgba(255,255,255,.10);
    color: #fff;
  }

  .final-points-pill {
    color: #ffd34d;
  }

  .final-mini-badge.yes {
    color: #8cffb1;
    background: rgba(34,197,94,.16);
    border: 1px solid rgba(34,197,94,.28);
  }

  .final-mini-badge.no {
    color: #aebbd3;
    background: rgba(148,163,184,.12);
    border: 1px solid rgba(148,163,184,.18);
  }

  @media (max-width: 900px) {
    .final-override-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .final-override-teams {
      grid-template-columns: 1fr;
      text-align: center;
    }

    .final-override-team.away {
      text-align: center;
    }

    .final-override-footer {
      justify-content: center;
      text-align: center;
    }

    .final-override-footer button {
      width: 100%;
    }
  }
`;
document.head.appendChild(style);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "Fecha por definir";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function teamName(team, placeholder = "Por definir") {
  if (!team) return placeholder;
  return `${team.flag_emoji || ""} ${team.name || ""}`.trim();
}

function teamCode(team) {
  return team?.code || "";
}

function realScore(match) {
  if (match.home_score === null || match.home_score === undefined || match.away_score === null || match.away_score === undefined) {
    return "vs";
  }

  return `${match.home_score} - ${match.away_score}`;
}

function winnerText(match, winnerId) {
  if (!winnerId) return "Sin elegir";

  if (Number(match.home_team?.id) === Number(winnerId)) return teamName(match.home_team);
  if (Number(match.away_team?.id) === Number(winnerId)) return teamName(match.away_team);

  return "Ganador elegido";
}

function currentAlias() {
  return localStorage.getItem("wc_alias") || "";
}

async function loadFinalMatches() {
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
      winner_team_id,
      went_extra_time,
      went_penalties,
      home_team:home_team_id(id, name, code, flag_emoji, flag_url),
      away_team:away_team_id(id, name, code, flag_emoji, flag_url)
    `)
    .in("match_number", FINAL_NUMBERS)
    .order("match_number", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function loadMyPredictions(matchIds) {
  const alias = currentAlias();

  if (!alias || !matchIds.length) return [];

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .ilike("user_alias", alias)
    .in("match_id", matchIds);

  if (error) throw error;
  return data || [];
}

async function loadAllPredictions(matchIds) {
  if (!matchIds.length) return [];

  const { data, error } = await supabase
    .from("predictions")
    .select("*")
    .in("match_id", matchIds)
    .order("match_id", { ascending: true })
    .order("user_alias", { ascending: true });

  if (error) throw error;
  return data || [];
}

function winnerOptions(match, prediction) {
  const selected = Number(prediction?.predicted_winner_team_id || 0);

  const opts = [`<option value="">Elige ganador</option>`];

  if (match.home_team?.id) {
    opts.push(`
      <option value="${match.home_team.id}" ${selected === Number(match.home_team.id) ? "selected" : ""}>
        ${escapeHtml(teamName(match.home_team))}
      </option>
    `);
  }

  if (match.away_team?.id) {
    opts.push(`
      <option value="${match.away_team.id}" ${selected === Number(match.away_team.id) ? "selected" : ""}>
        ${escapeHtml(teamName(match.away_team))}
      </option>
    `);
  }

  return opts.join("");
}

function renderPredictionForm(match, prediction) {
  const isOpen = ["open", "locked"].includes(String(match.status || "").toLowerCase());
  const homeScore = prediction?.home_score ?? "";
  const awayScore = prediction?.away_score ?? "";

  return `
    <form class="final-override-form" data-match-id="${match.id}">
      <div class="final-override-form-title">Tu resultado</div>

      <div class="final-override-score-inputs">
        <input type="number" name="home_score" min="0" inputmode="numeric" placeholder="0" value="${homeScore}" ${isOpen ? "" : "disabled"} />
        <span>-</span>
        <input type="number" name="away_score" min="0" inputmode="numeric" placeholder="0" value="${awayScore}" ${isOpen ? "" : "disabled"} />
      </div>

      <div class="final-override-checks">
        <label>
          <input type="checkbox" name="predicts_extra_time" ${prediction?.predicts_extra_time ? "checked" : ""} ${isOpen ? "" : "disabled"} />
          Prórroga
        </label>

        <label>
          <input type="checkbox" name="predicts_penalties" ${prediction?.predicts_penalties ? "checked" : ""} ${isOpen ? "" : "disabled"} />
          Penaltis
        </label>
      </div>

      <div class="final-override-winner">
        <label>Ganador si hay empate</label>
        <select name="predicted_winner_team_id" ${isOpen ? "" : "disabled"}>
          ${winnerOptions(match, prediction)}
        </select>
      </div>

      <div class="final-override-footer">
        <div>Mis puntos: <strong>${prediction?.points ?? 0}</strong></div>
        <button type="submit" ${isOpen ? "" : "disabled"}>Guardar pronóstico</button>
      </div>
    </form>
  `;
}

function renderFinalCard(match, myPredictions) {
  const prediction = myPredictions.find((item) => Number(item.match_id) === Number(match.id));
  const isFinal = Number(match.match_number) === 104;
  const title = isFinal ? "Gran Final" : "Tercer y cuarto puesto";
  const icon = isFinal ? "🏆" : "🥉";

  return `
    <article class="final-override-card">
      <div class="final-override-top">
        <div>
          <div class="final-override-kicker">${icon} Partido ${escapeHtml(match.match_number)}</div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(formatDate(match.kickoff_at))}</p>
        </div>
      </div>

      <div class="final-override-teams">
        <div class="final-override-team">${escapeHtml(teamName(match.home_team, match.home_placeholder))}<br><small>${escapeHtml(teamCode(match.home_team))}</small></div>
        <div class="final-override-score">${escapeHtml(realScore(match))}</div>
        <div class="final-override-team away">${escapeHtml(teamName(match.away_team, match.away_placeholder))}<br><small>${escapeHtml(teamCode(match.away_team))}</small></div>
      </div>

      ${renderPredictionForm(match, prediction)}
    </article>
  `;
}

function renderPredictionsTable(match, predictions) {
  if (!predictions.length) {
    return `<div style="padding:18px 20px;color:#aebbd3;font-weight:900;">Todavía no hay pronósticos guardados.</div>`;
  }

  return `
    <div class="final-override-table-wrap">
      <table class="final-override-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Resultado guardado</th>
            <th>Ganador</th>
            <th>Prórroga</th>
            <th>Penaltis</th>
            <th>Puntos</th>
          </tr>
        </thead>
        <tbody>
          ${predictions.map((prediction) => `
            <tr>
              <td><strong>${escapeHtml(prediction.user_alias || "Sin usuario")}</strong></td>
              <td><span class="final-score-pill">${escapeHtml(prediction.home_score ?? "-")} - ${escapeHtml(prediction.away_score ?? "-")}</span></td>
              <td>${escapeHtml(winnerText(match, prediction.predicted_winner_team_id))}</td>
              <td>${prediction.predicts_extra_time ? `<span class="final-mini-badge yes">Sí</span>` : `<span class="final-mini-badge no">No</span>`}</td>
              <td>${prediction.predicts_penalties ? `<span class="final-mini-badge yes">Sí</span>` : `<span class="final-mini-badge no">No</span>`}</td>
              <td><span class="final-points-pill">${escapeHtml(prediction.points ?? 0)} pts</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

async function renderFinalOverride() {
  const matches = await loadFinalMatches();
  const matchIds = matches.map((m) => m.id);
  const myPredictions = await loadMyPredictions(matchIds);
  const allPredictions = await loadAllPredictions(matchIds);

  const quarter = document.getElementById("quarterBracket");
  if (quarter) {
    quarter.innerHTML = `
      <section id="finalOverridePanel">
        <div class="final-override-version">OVERRIDE FINAL 103/104 ACTIVO</div>

        <div class="final-override-header">
          <p>Últimos partidos</p>
          <h2>Final y tercer puesto</h2>
          <small>Ya no se muestran semifinales. Aquí se guardan los pronósticos de los partidos 103 y 104.</small>
        </div>

        <div class="final-override-grid">
          ${matches.map((match) => renderFinalCard(match, myPredictions)).join("")}
        </div>
      </section>
    `;
  }

  const predictionsList = document.getElementById("predictionsList");
  if (predictionsList) {
    predictionsList.innerHTML = `
      <section id="finalOverridePredictions">
        <div class="final-override-version">OVERRIDE FINAL 103/104 ACTIVO</div>

        <div class="final-override-header">
          <p>Pronósticos guardados</p>
          <h2>Final y tercer puesto</h2>
          <small>Tabla clara con resultado, ganador, prórroga, penaltis y puntos por usuario.</small>
        </div>

        ${matches.map((match) => {
          const rows = allPredictions.filter((prediction) => Number(prediction.match_id) === Number(match.id));
          const isFinal = Number(match.match_number) === 104;
          const title = isFinal ? "Gran Final" : "Tercer y cuarto puesto";

          return `
            <article class="final-override-card">
              <div class="final-override-top">
                <div>
                  <div class="final-override-kicker">Partido ${escapeHtml(match.match_number)}</div>
                  <h3>${escapeHtml(title)}</h3>
                  <p>${escapeHtml(teamName(match.home_team, match.home_placeholder))} vs ${escapeHtml(teamName(match.away_team, match.away_placeholder))}</p>
                </div>
              </div>
              ${renderPredictionsTable(match, rows)}
            </article>
          `;
        }).join("")}
      </section>
    `;
  }

  document.querySelectorAll(".prediction-match-card").forEach((node) => {
    const txt = node.textContent || "";
    if (/semifinal/i.test(txt) || /partido\s*101/i.test(txt) || /partido\s*102/i.test(txt)) {
      node.remove();
    }
  });
}

document.addEventListener("submit", async (event) => {
  const form = event.target.closest(".final-override-form");
  if (!form) return;

  event.preventDefault();

  const alias = currentAlias();
  if (!alias) {
    alert("Primero escribe tu alias.");
    return;
  }

  const matchId = Number(form.dataset.matchId);
  const matches = await loadFinalMatches();
  const match = matches.find((item) => Number(item.id) === matchId);

  if (!match) {
    alert("No encuentro este partido en Supabase.");
    return;
  }

  const formData = new FormData(form);
  const homeScore = Number(formData.get("home_score"));
  const awayScore = Number(formData.get("away_score"));
  let winnerId = Number(formData.get("predicted_winner_team_id")) || null;
  let extra = formData.get("predicts_extra_time") === "on";
  const penalties = formData.get("predicts_penalties") === "on";

  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) {
    alert("Pon el resultado completo.");
    return;
  }

  if (homeScore > awayScore) winnerId = match.home_team?.id || null;
  if (awayScore > homeScore) winnerId = match.away_team?.id || null;

  if (homeScore === awayScore && !winnerId) {
    alert("Si pones empate, elige ganador.");
    return;
  }

  if (penalties) extra = true;

  const { error } = await supabase.rpc("save_prediction", {
    p_user_alias: alias,
    p_match_id: matchId,
    p_home_score: homeScore,
    p_away_score: awayScore,
    p_predicted_winner_team_id: winnerId,
    p_predicts_extra_time: extra,
    p_predicts_penalties: penalties,
    p_predicted_mvp_player_id: null
  });

  if (error) {
    console.error(error);
    alert(error.message || "No se pudo guardar el pronóstico.");
    return;
  }

  await renderFinalOverride();
  alert("Pronóstico guardado.");
}, true);

document.addEventListener("change", (event) => {
  if (event.target.name === "predicts_penalties" && event.target.checked) {
    const form = event.target.closest("form");
    const extra = form?.querySelector('input[name="predicts_extra_time"]');
    if (extra) extra.checked = true;
  }
}, true);

function start() {
  renderFinalOverride().catch((error) => {
    console.error(error);
    const predictionsList = document.getElementById("predictionsList");
    if (predictionsList) {
      predictionsList.innerHTML = `
        <div class="final-override-header">
          <p>Error</p>
          <h2>No se pudo cargar el override</h2>
          <small>${escapeHtml(error.message || error)}</small>
        </div>
      `;
    }
  });

  setTimeout(() => renderFinalOverride().catch(console.error), 1200);
  setTimeout(() => renderFinalOverride().catch(console.error), 2600);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}

window.__OVERRIDE_FINAL_103_104__ = true;
