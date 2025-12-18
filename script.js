// ========== Kasendemi Tactique Ultimate Premium – JS COMPLET (UI dockée)
// Version: 2025-09-12-ter2 (correctifs majeurs joueurs + annotations + export)
// - Dock placé AU-DESSUS du terrain (#kasendemi-svg).
// - Curseur global "Taille joueurs" (par défaut 0.8 = plus petits).
// - Style joueur : "silhouette" (sprites) ou "rond" (couleur), par défaut et par joueur.
// - Identification joueurs : numéro / nom / les deux / aucun (au-dessus de la tête, export inclus).
// - Classe renommée: .player-silhouette (plus de “image” non pro).
// - Ballon reste au point d’arrivée (calcul + séquence.ballPosFinal).
// - Outils d’analyse précis (surbrillance, connexions, cercle, rectangle, flèche pointillée, texte, sélection).
// - Exports PNG / Storyboard / Vidéo incluent labels + nouvelles annotations.
// ======================================================================

document.addEventListener("DOMContentLoaded", async function () {

  /* ==================== UI DOCKEE (pas d'overlay) ==================== */
  const KSPro = (function () {
    function init() {
      buildDock();
      window.addEventListener("keydown", onKey, { passive: false });
      setInterval(saveAll, 30000); // autosave discret
    }

    function buildDock() {
      const svgEl = document.getElementById("kasendemi-svg");
      const anchorParent = (svgEl && svgEl.parentElement) ? svgEl.parentElement : document.body;

      const dock = document.createElement("div");
      dock.id = "kas-ui-dock";
      dock.innerHTML = `
        <!-- Commentaire -->
        <div id="ks-comment-wrap" class="kas-card">
          <label id="ks-comment-label" for="ks-seq-comment" class="kas-label">Commentaire de la séquence</label>
          <textarea id="ks-seq-comment" placeholder="Notes, consignes, points clés…"></textarea>
        </div>

        <!-- Affichage & Joueurs -->
        <details id="ks-display-panel" class="kas-card" ${ (localStorage.getItem('ks_display_open')==='1') ? 'open' : '' }>
          <summary id="ks-display-summary">
            <span class="title">🎛️ Affichage & joueurs</span>
            <span class="hint">Taille, étiquettes, style</span>
          </summary>
          <div class="kas-grid">
            <div class="kas-section">
              <div class="kas-section-title">Taille des joueurs</div>
              <div class="kas-row">
                <label class="kas-inline" style="min-width:260px">
                  <span style="width:130px;display:inline-block">Taille (x)</span>
                  <input id="ks-player-scale" type="range" min="0.5" max="1.4" step="0.05" value="0.8" style="flex:1">
                  <span id="ks-player-scale-val" style="width:48px;text-align:right">0.80</span>
                </label>
                <button id="ks-player-scale-reset" class="kas-btn">Réinitialiser</button>
              </div>
            </div>

            <div class="kas-section">
              <div class="kas-section-title">Étiquettes (identification)</div>
              <div class="kas-row">
                <label class="kas-inline">
                  Mode
                  <select id="ks-label-mode">
                    <option value="none">Aucun</option>
                    <option value="numero">Numéro</option>
                    <option value="nom">Nom</option>
                    <option value="both">Numéro + Nom</option>
                  </select>
                </label>
                <label class="kas-inline">
                  <input id="ks-label-shadow" type="checkbox" checked>
                  Contraste (contour)
                </label>
              </div>
            </div>

            <div class="kas-section">
              <div class="kas-section-title">Style par défaut</div>
              <div class="kas-row">
                <label class="kas-inline">
                  Par défaut, afficher en
                  <select id="ks-default-style">
                    <option value="silhouette">Silhouette</option>
                    <option value="rond">Rond</option>
                  </select>
                </label>
                <label class="kas-inline">Couleur des ronds
                  <input id="ks-default-circle-color" type="color" value="#00bfff">
                </label>
              </div>
              <div class="kas-help">Chaque joueur peut avoir son propre style (voir “Configuration joueurs”).</div>
            </div>
          </div>
        </details>

        <!-- Outils d’exportation -->
        <details id="ks-export-panel" class="kas-card" ${ (localStorage.getItem('ks_export_open')==='1') ? 'open' : '' }>
          <summary id="ks-export-summary">
            <span class="title">🧰 Outils d’exportation</span>
            <span class="hint">Afficher / masquer</span>
          </summary>

          <div class="kas-grid">
            <!-- TACTIQUE -->
            <div class="kas-section sec-tactic">
              <div class="kas-section-title">Schéma tactique</div>
              <div class="kas-row">
                <button id="ksexp-png-on"  class="kas-btn">PNG (flèches)</button>
                <button id="ksexp-png-off" class="kas-btn">PNG (sans)</button>
                <button id="ksexp-sb-on"   class="kas-btn">Storyboard (flèches)</button>
                <button id="ksexp-sb-off"  class="kas-btn">Storyboard (sans)</button>
              </div>
              <div class="kas-row">
                <button id="ksexp-vseq-on"  class="kas-btn">Vidéo séquence (flèches)</button>
                <button id="ksexp-vseq-off" class="kas-btn">Vidéo séquence (sans)</button>
                <button id="ksexp-vall-on"  class="kas-btn">Vidéo tout (flèches)</button>
                <button id="ksexp-vall-off" class="kas-btn">Vidéo tout (sans)</button>
              </div>
            </div>

            <!-- COMPOSITION -->
            <div class="kas-section sec-compo">
              <div class="kas-section-title">Composition d’équipe</div>
              <div class="kas-row">
                <button id="ksexp-compo-png"  class="kas-btn">PNG (composition)</button>
                <button id="ksexp-compo-sb"   class="kas-btn">Storyboard (composition)</button>
              </div>
            </div>
          </div>

          <div id="kspro-status" class="kas-status" aria-live="polite"></div>
        </details>

        <!-- Outils d’analyse -->
        <details id="ks-analysis-panel" class="kas-card" ${ (localStorage.getItem('ks_analysis_open')==='1') ? 'open' : '' }>
          <summary id="ks-analysis-summary">
            <span class="title">🧪 Outils d’analyse</span>
            <span class="hint">Annotations</span>
          </summary>
          <div class="kas-grid">
            <div class="kas-section">
              <div class="kas-section-title">Annotations</div>
              <div class="kas-row">
                <label class="kas-inline">
                  <input id="ks-annot-toggle" type="checkbox"> Activer le dessin
                </label>

                <label class="kas-inline">Outil
                  <select id="ks-annot-tool">
                    <option value="libre">Libre</option>
                    <option value="surbrillance">Surbrillance joueur</option>
                    <option value="connect">Connexion joueurs</option>
                    <option value="cercle">Cercle</option>
                    <option value="rectangle">Rectangle</option>
                    <option value="fleche">Flèche (pointillée)</option>
                    <option value="texte">Texte</option>
                    <option value="select">Sélection</option>
                  </select>
                </label>

                <label class="kas-inline">Couleur
                  <input id="ks-annot-color" type="color" value="#ff3b30">
                </label>
                <label class="kas-inline">Épaisseur
                  <input id="ks-annot-width" type="number" min="1" max="12" value="3">
                </label>

                <button id="ks-annot-del-sel" class="kas-btn">Supprimer la sélection</button>
                <button id="ks-annot-clear"   class="kas-btn">Effacer tout</button>
              </div>
              <div class="kas-help">Surbrillance/Connexion : cliquez les joueurs · Sélection : cliquez un objet, déplacez-le (glisser), double-cliquez un texte pour éditer.</div>
            </div>
          </div>
        </details>
      `;

      // Insérer AVANT le wrapper scroll (pas dedans) pour éviter le scroll horizontal
      const scrollWrapper = document.getElementById("kas-field-scroll");
      if (scrollWrapper && scrollWrapper.parentNode) {
        scrollWrapper.parentNode.insertBefore(dock, scrollWrapper);
      } else if (svgEl && svgEl.parentNode) {
        svgEl.parentNode.insertBefore(dock, svgEl);
      } else {
        anchorParent.insertBefore(dock, anchorParent.firstChild);
      }
// --- [NOUVEAU] Crée le bloc "Commentaire de la simulation" s'il n'existe pas
function createSimCommentIfMissing(){
  const dock = document.getElementById("kas-ui-dock");
  if (!dock) return;
  if (document.getElementById("ks-sim-comment-wrap")) return; // déjà créé

  const sim = document.createElement("div");
  sim.id = "ks-sim-comment-wrap";
  sim.className = "kas-card";
  sim.innerHTML = `
    <label class="kas-label" for="ks-sim-comment">Commentaire de la simulation</label>
    <textarea id="ks-sim-comment" placeholder="Objectif de la simulation, consignes globales…"></textarea>
  `;

  // par défaut on l’ajoute juste au-dessus du commentaire de séquence
  const seq = document.getElementById("ks-comment-wrap");
  if (seq && seq.parentNode === dock){
    dock.insertBefore(sim, seq);
  } else {
    dock.insertBefore(sim, dock.firstChild);
  }
}

// --- [NOUVEAU] Force l'ordre final des blocs dans #kas-ui-dock
function reorderDockPanels(){
  const dock = document.getElementById("kas-ui-dock");
  if (!dock) return;

  const exp  = document.getElementById("ks-export-panel");     // 🧰 Export
  const disp = document.getElementById("ks-display-panel");    // 🎛️ Affichage & joueurs
  const anal = document.getElementById("ks-analysis-panel");   // 🧪 Analyse
  const simc = document.getElementById("ks-sim-comment-wrap"); // 🆕 Commentaire simulation
  const seqc = document.getElementById("ks-comment-wrap");     // Commentaire séquence
  const bar  = document.getElementById("ks-controls-bar");     // Barre commandes

  // Ordre demandé :
  // 1) export → 2) affichage → 3) analyse → 4) com. simulation → 5) com. séquence → 6) barre commandes
  [exp, disp, anal, simc, seqc, bar].forEach(n => { if (n) dock.appendChild(n); });
}

// ===== Barre de commandes compacte, collée au terrain =====
// ===== Barre compacte collée au terrain (inclut "Déplacement" + "Ajouter un joueur") =====
// ===== Barre compacte collée au terrain (4 lignes) =====
function moveControlsNearField(){
  const svgEl = document.getElementById("kasendemi-svg");
  if (!svgEl || !svgEl.parentNode) return;

  // conteneur du dock
  const dock = document.getElementById("kas-ui-dock");
  if (!dock) return;

  // retire une ancienne barre si elle existe
  const old = document.getElementById("ks-controls-bar");
  if (old && old.parentNode) old.parentNode.removeChild(old);

  // === BARRE DANS LE MÊME BLOC, AU-DESSUS DU TERRAIN ===
  const bar = document.createElement("div");
  bar.id = "ks-controls-bar";
  bar.className = "kas-card";
  bar.style.display = "grid";
  bar.style.gridTemplateColumns = "1fr";
  bar.style.gap = "8px";
  bar.style.margin = "6px 0 10px 0";

  // utilitaires
  const pipe = () => {
    const s = document.createElement("span");
    s.textContent = " | ";
    s.style.opacity = ".6";
    s.style.margin = "0 6px";
    return s;
  };
  const makeRow = () => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.flexWrap = "wrap";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    return row;
  };

  // récup des éléments existants
  const arrowType = document.getElementById("arrow-type-select");
  const toolMove = document.getElementById("tool-move-players");
  const toolArrow = document.getElementById("tool-draw-arrows");

  const newSim = document.getElementById("newSimBtn");
  const simSel = document.getElementById("simSelect");
  const renSim = document.getElementById("renameSimBtn");
  const delSim = document.getElementById("deleteSimBtn");

  const newSeq = document.getElementById("newSeqBtn");
  const seqSel = document.getElementById("seqSelect");
  const renSeq = document.getElementById("renameSeqBtn");
  const delSeq = document.getElementById("deleteSeqBtn");

  const addPlayer = document.getElementById("addPlayerBtn");
  const togArrows = document.getElementById("toggleArrowsBtn");
  const clearArr  = document.getElementById("clearArrowsBtn");

  const showStart = document.getElementById("showSeqStartBtn");
  const showEnd   = document.getElementById("showSeqEndBtn");
  const playSeq   = document.getElementById("playSeqBtn");
  const playAll   = document.getElementById("playAllBtn");
  const prevSeq   = document.getElementById("prevSeqBtn");
  const nextSeq   = document.getElementById("nextSeqBtn");

  // === Applique les styles “raffinés” demandés ===
  if (addPlayer) addPlayer.classList.add("kas-btn", "kas-btn--primary");
  if (newSim)    newSim.classList.add("kas-btn", "kas-btn--accent");
  if (newSeq)    newSeq.classList.add("kas-btn", "kas-btn--accent");
  if (clearArr)  clearArr.classList.add("kas-btn", "kas-btn--ghost");
  if (toolMove)  toolMove.classList.add("kas-btn", "kas-btn--ghost", "ks-tool-btn");
  if (toolArrow) toolArrow.classList.add("kas-btn", "kas-btn--primary", "ks-tool-btn");

  if (togArrows) {
    togArrows.classList.add("kas-btn", "kas-btn--ghost", "kas-toggle");
    if (!togArrows.hasAttribute("data-on")) togArrows.setAttribute("data-on", "0");
    if (!togArrows._bound) {
      togArrows._bound = true; // évite de doubler l'écouteur si la fonction est rappelée
      togArrows.addEventListener("click", () => {
        const on = togArrows.getAttribute("data-on") === "1";
        togArrows.setAttribute("data-on", on ? "0" : "1");
        // appelle ta logique réelle si tu en as une :
        // toggleArrowsVisibility(!on);
      });
    }
  }

  // ===== LIGNE 1 : Type de flèches =====
  const row1 = makeRow();
  if (toolMove) row1.appendChild(toolMove);
  if (toolArrow) row1.appendChild(toolArrow);
  if (arrowType) row1.appendChild(arrowType);
  bar.appendChild(row1);

  // ===== LIGNE 2 : Simulations | Séquences =====
  const row2 = makeRow();
  if (newSim || simSel || renSim || delSim){
    if (newSim) row2.appendChild(newSim);
    row2.appendChild(pipe());
    [simSel, renSim, delSim].forEach(n => { if (n) row2.appendChild(n); });
  }
  if (newSeq || seqSel || renSeq || delSeq){
    row2.appendChild(pipe());
    if (newSeq) row2.appendChild(newSeq);
    row2.appendChild(pipe());
    [seqSel, renSeq, delSeq].forEach(n => { if (n) row2.appendChild(n); });
  }
  bar.appendChild(row2);

  // ===== LIGNE 3 : Ajouter un joueur / Afficher-Masquer / Supprimer flèches =====
  const row3 = makeRow();
  if (addPlayer) row3.appendChild(addPlayer);
  if (togArrows || clearArr) row3.appendChild(pipe());
  if (togArrows) row3.appendChild(togArrows);
  if (clearArr)  row3.appendChild(clearArr);
  bar.appendChild(row3);

  // ===== LIGNE 4 (collée au terrain) : Début | Fin | ▶ Séquence | ▶ Tout | < | > =====
  const row4 = makeRow();
  [showStart, showEnd].forEach(n => { if (n) row4.appendChild(n); });
  row4.appendChild(pipe());
  [playSeq, playAll].forEach(n => { if (n) row4.appendChild(n); });
  row4.appendChild(pipe());
  [prevSeq, nextSeq].forEach(n => { if (n) row4.appendChild(n); });
  bar.appendChild(row4);

  // insère comme DERNIER enfant du dock → bloc le plus proche du terrain
  dock.appendChild(bar);
}

      const css = document.createElement("style");
      css.textContent = `
        :root{
          --kas-radius:12px; --kas-bd:#e6e6e9; --kas-bg:#fff; --kas-fg:#111; --kas-muted:#6b7280;
          --kas-btn-bg:#f3f4f6; --kas-btn-bd:#d1d5db; --kas-btn-fg:#111; --kas-btn-hover:#e5e7eb; --kas-focus:#2563eb;
        }
        @media (prefers-color-scheme: dark){
          :root{
            --kas-bd:#2a2d33; --kas-bg:#1b1e23; --kas-fg:#eaeef4; --kas-muted:#9aa5b1;
            --kas-btn-bg:#262a31; --kas-btn-bd:#32363d; --kas-btn-fg:#eaeef4; --kas-btn-hover:#2c3138;
          }
        }
        #kas-ui-dock{margin:14px 0; width:100%; max-width:calc(100vw - 36px); box-sizing:border-box; overflow-x:hidden}
        .kas-card{background:var(--kas-bg); color:var(--kas-fg); border:1px solid var(--kas-bd); border-radius:var(--kas-radius);
          padding:12px; box-shadow:0 1px 2px rgba(0,0,0,.04); margin-bottom:12px;}
        #ks-export-summary, #ks-analysis-summary, #ks-display-summary{cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;list-style:none}
        #ks-export-summary::-webkit-details-marker, #ks-analysis-summary::-webkit-details-marker, #ks-display-summary::-webkit-details-marker{display:none}
        #ks-export-summary .title, #ks-analysis-summary .title, #ks-display-summary .title{font-weight:600}
        #ks-export-summary .hint, #ks-analysis-summary .hint, #ks-display-summary .hint{font-size:12px;color:var(--kas-muted)}
        .kas-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:10px}
        .kas-section{border:1px dashed var(--kas-bd);border-radius:10px;padding:10px}
        .kas-section-title{font-weight:600;margin-bottom:6px;color:var(--kas-muted)}
        .kas-row{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
        .kas-inline{display:inline-flex;align-items:center;gap:6px;font-size:14px;color:var(--kas-fg)}
        .kas-btn{appearance:none;border:1px solid var(--kas-btn-bd);background:var(--kas-btn-bg);color:var(--kas-btn-fg);
          padding:8px 10px;border-radius:10px;cursor:pointer;font:inherit;line-height:1}
        .kas-btn:hover{background:var(--kas-btn-hover)}
        .kas-btn:focus{outline:2px solid var(--kas-focus);outline-offset:2px}
        .kas-btn-secondary{background:transparent}

        .kas-status{font-size:12px;color:var(--kas-muted);margin-top:6px}
        #ks-comment-wrap .kas-label{display:block;font-size:13px;color:var(--kas-muted);margin-bottom:6px}
        #ks-seq-comment{width:100%; min-height:52px; resize:vertical; background:transparent; color:inherit;
          border:1px solid var(--kas-bd); border-radius:10px; padding:8px 10px}

        /* Par défaut caché, on force en JS via style.display="block" */
        .sec-tactic{display:none}
        .sec-compo{display:none}

        /* Popup flèche */
        .kas-popup-arrow{
          background:var(--kas-bg); color:var(--kas-fg); border:1px solid var(--kas-bd); border-radius:10px; padding:10px;
          box-shadow:0 8px 20px rgba(0,0,0,.18); min-width:280px; max-width:340px;
        }
        .kas-popup-arrow label{display:block; font-size:13px; margin:8px 0 4px}
        .kas-popup-arrow input[type="number"], .kas-popup-arrow select{
          width:100%; box-sizing:border-box; padding:6px 8px; border:1px solid var(--kas-bd); border-radius:8px; background:transparent; color:inherit
        }
        .kas-popup-arrow .btn-row{display:flex; gap:8px; justify-content:flex-end; margin-top:10px}
        .kas-help{font-size:12px; color:var(--kas-muted); margin-top:2px}

        /* Badge de phase */
        .phase-badge text{font-size:10px; font-weight:700; fill:#fff}

        /* Annotations & sélection */
        .ks-layer{pointer-events:all}
        .selected-ann{filter:drop-shadow(0 0 0.8px #ffd400)}
        .ann-text{font: 14px/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial;}

        /* Étiquettes joueurs (contraste optionnel) */
        .kas-label-text{paint-order:stroke fill; stroke:#111; stroke-width:.8px}
        .kas-label-no-stroke{stroke:none}

        /* Ronds joueurs */
        .player-circle{stroke:#fff; stroke-width:3}
/* === Boutons raffinés === */
.kas-btn--primary{
  background: linear-gradient(to bottom, #3b82f6, #2563eb);
  border-color: #1d4ed8;
  color:#fff;
  box-shadow: 0 1px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.15);
}
.kas-btn--primary:hover{ filter: brightness(1.05); }
.kas-btn--primary:active{ transform: translateY(1px); }

.kas-btn--accent{
  background: linear-gradient(to bottom, #22c55e, #16a34a);
  border-color:#15803d;
  color:#fff;
  box-shadow: 0 1px 0 rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.15);
}
.kas-btn--accent:hover{ filter: brightness(1.05); }
.kas-btn--accent:active{ transform: translateY(1px); }

.kas-btn--ghost{
  background: transparent;
  border-color: var(--kas-bd);
}
.kas-btn--ghost:hover{ background: var(--kas-btn-hover); }
#kas-field-scroll.ks-scroll-lock{ touch-action:none !important; }
#kas-field-scroll.ks-scroll-lock #kasendemi-svg{ touch-action:none !important; }
.ks-tool-btn[data-active="1"]{ box-shadow: 0 0 0 2px var(--kas-focus) inset; filter: brightness(1.05); }
/* Bouton Toggle (Afficher/Masquer les flèches) — version compacte */
.kas-toggle{
  position: relative;
  padding-left: 44px;           /* espace pour le switch */
  min-height: 22px;
  line-height: 22px;
}
.kas-toggle::before,
.kas-toggle::after{
  content:"";
  position:absolute;
  top:50%;
  transform:translateY(-50%);
  transition:.2s ease;
  pointer-events:none;
}
.kas-toggle::before{
  left:8px;                     /* piste */
  width:30px;
  height:16px;
  border-radius:999px;
  background:#d1d5db;
  box-shadow: inset 0 1px 2px rgba(0,0,0,.12);
}
.kas-toggle::after{
  left:10px;                    /* bouton */
  width:12px;
  height:12px;
  border-radius:999px;
  background:#fff;
  box-shadow: 0 1px 2px rgba(0,0,0,.25);
}
.kas-toggle[data-on="1"]::before{ background:#22c55e; }
.kas-toggle[data-on="1"]::after{ left:26px; }  /* position ON */


/* Petites améliorations typographiques */
.kas-btn .icon{
  display:inline-block; margin-right:8px; font-size:14px; opacity:.95;
}
.kas-btn{ font-weight:600; }
      `;
      document.head.appendChild(css);

      // mémorisation ouvert/fermé
      dock.querySelector('#ks-export-panel').addEventListener('toggle', e=>localStorage.setItem('ks_export_open', e.currentTarget.open ? '1':'0'));
      dock.querySelector('#ks-analysis-panel').addEventListener('toggle', e=>localStorage.setItem('ks_analysis_open', e.currentTarget.open ? '1':'0'));
      dock.querySelector('#ks-display-panel').addEventListener('toggle', e=>localStorage.setItem('ks_display_open', e.currentTarget.open ? '1':'0'));

      // === Bind affichage global ===
      const scaleInput = dock.querySelector("#ks-player-scale");
      const scaleVal   = dock.querySelector("#ks-player-scale-val");
      const scaleReset = dock.querySelector("#ks-player-scale-reset");
      const labelMode  = dock.querySelector("#ks-label-mode");
      const labelShadow= dock.querySelector("#ks-label-shadow");
      const defStyle   = dock.querySelector("#ks-default-style");
      const defCircle  = dock.querySelector("#ks-default-circle-color");

      function syncDisplayControls(){
        const d = getDisplay();
        scaleInput.value = String(d.playerScale || 0.8);
        scaleVal.textContent = (d.playerScale||0.8).toFixed(2);
        labelMode.value = d.labelMode || "numero";
        labelShadow.checked = !!d.labelShadow;
        defStyle.value = d.defaultStyle || "silhouette";
        defCircle.value = d.defaultCircleColor || "#00bfff";
      }
      scaleInput.addEventListener("input", ()=>{
        getDisplay().playerScale = parseFloat(scaleInput.value||"0.8");
        scaleVal.textContent = getDisplay().playerScale.toFixed(2);
        saveSimulations(); if (mode==="tactic") { drawField(); createPlayers(); drawAnnotations(); }
      });
      scaleReset.addEventListener("click", ()=>{
        getDisplay().playerScale = 0.8; scaleInput.value="0.8"; scaleVal.textContent="0.80";
        saveSimulations(); if (mode==="tactic") { drawField(); createPlayers(); drawAnnotations(); }
      });
      labelMode.addEventListener("change", ()=>{
        getDisplay().labelMode = labelMode.value;
        saveSimulations(); if (mode==="tactic") { drawField(); createPlayers(); drawAnnotations(); }
      });
      labelShadow.addEventListener("change", ()=>{
        getDisplay().labelShadow = !!labelShadow.checked;
        saveSimulations(); if (mode==="tactic") { drawField(); createPlayers(); drawAnnotations(); }
      });
     defStyle.addEventListener("change", ()=>{
  getDisplay().defaultStyle = defStyle.value;

  (playerConfigs||[]).forEach(pc=>{
    if (!pc.overrideStyle) {
      if (!pc.sprite) pc.sprite = playerSprites[0].src;
      if (!pc.circleColor) pc.circleColor = getDisplay().defaultCircleColor || "#00bfff";
    }
  });

  saveSimulations();
  if (mode==="tactic") { drawField(); createPlayers(); drawAnnotations(); }
});

defCircle.addEventListener("change", ()=>{
  const d = getDisplay();
  d.defaultCircleColor = defCircle.value;

  // Met à jour la couleur des ronds pour ceux qui N'ONT PAS de style perso
  (playerConfigs || []).forEach(pc => {
    if (!pc.overrideStyle) {
      pc.circleColor = d.defaultCircleColor || "#00bfff";
    }
  });

  saveSimulations();
  if (mode === "tactic") {
    drawField(); createPlayers(); drawAnnotations();
  }
}); // 👈 fermeture du listener


      // EXPORT buttons (inchangés)
      dock.querySelector("#ksexp-png-on") .addEventListener("click", ()=> { if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} exportCurrentSequencePNG(true); });
      dock.querySelector("#ksexp-png-off").addEventListener("click", ()=> { if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} exportCurrentSequencePNG(false); });
      dock.querySelector("#ksexp-sb-on")  .addEventListener("click", ()=> { if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} openStoryboardWindow(true); });
      dock.querySelector("#ksexp-sb-off") .addEventListener("click", ()=> { if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} openStoryboardWindow(false); });

      dock.querySelector("#ksexp-vseq-on") .addEventListener("click", ()=>{ if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} exportVideoCurrentSequenceCanvas(true); });
      dock.querySelector("#ksexp-vseq-off").addEventListener("click", ()=>{ if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} exportVideoCurrentSequenceCanvas(false); });
      dock.querySelector("#ksexp-vall-on") .addEventListener("click", ()=>{ if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} exportVideoAllSequencesCanvas(true); });
      dock.querySelector("#ksexp-vall-off").addEventListener("click", ()=>{ if (mode!=="tactic"){ alert("Disponible en mode Tactique."); return;} exportVideoAllSequencesCanvas(false); });

      // Analyse – bindings
      document.getElementById("ks-annot-toggle").addEventListener("change", e => {
        annotationMode = !!e.target.checked;
        _connectBuffer = [];
        _selectedAnn   = null;
      });
      document.getElementById("ks-annot-tool").addEventListener("change", e => { analysisTool = e.target.value; });
      document.getElementById("ks-annot-color").addEventListener("change", e => { annotationColor = e.target.value; });
      document.getElementById("ks-annot-width").addEventListener("change", e => {
        annotationWidth = Math.max(1, Math.min(12, parseInt(e.target.value||3,10)));
      });
      document.getElementById("ks-annot-del-sel").addEventListener("click", () => deleteSelection());
      document.getElementById("ks-annot-clear").addEventListener("click", () => clearAnnotations());

     setTimeout(syncDisplayControls, 0);
moveControlsNearField();       // place le bloc commandes au plus près du terrain
createSimCommentIfMissing();   // crée le bloc "Commentaire de la simulation"
reorderDockPanels();           // impose l'ordre final des blocs
}



    function setStatus(msg) {
      const el = document.getElementById("kspro-status");
      if (el) el.textContent = msg || "";
    }

    function onKey(e) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "e" && !e.shiftKey) { e.preventDefault(); (mode==="compo") ? exportCompoPNG() : exportCurrentSequencePNG(true); }
      if (k === "e" &&  e.shiftKey) { e.preventDefault(); (mode==="compo") ? openCompoBoardWindow() : openStoryboardWindow(true); }
    }

    async function saveAll() {
      const sims = (typeof simulations !== "undefined" && Object.keys(simulations||{}).length) ? simulations : await fetchSimulationsFromServer();
      const comp = (typeof compos       !== "undefined" && Object.keys(compos||{}).length)       ? compos       : await fetchComposFromServer();
      saveSimulationsToLocal(sims);
      saveComposToLocal(comp);
      await saveSimulationsToServer(sims);
      await saveComposToServer(comp);
      setStatus("Enregistré"); setTimeout(()=>setStatus(""), 1200);
    }

    function updateDockVisibilityByMode(currentMode){
  // sections export spécifiques
  document.querySelectorAll(".sec-tactic").forEach(el => el.style.display = (currentMode === "tactic" ? "block" : "none"));
  document.querySelectorAll(".sec-compo") .forEach(el => el.style.display = (currentMode === "compo"  ? "block" : "none"));

  // panneaux à cacher en mode compo
  const disp = document.getElementById("ks-display-panel");   // 🎛️ Affichage & joueurs
  const anal = document.getElementById("ks-analysis-panel");  // 🧪 Outils d’analyse
  if (disp) disp.style.display = (currentMode === "tactic" ? "block" : "none");
  if (anal) anal.style.display = (currentMode === "tactic" ? "block" : "none");

  // label/placeholder commentaire
  const label = document.getElementById("ks-comment-label");
  const area  = document.getElementById("ks-seq-comment");
  if (label && area){
    if (currentMode === "tactic"){
      label.textContent = "Commentaire de la séquence";
      area.placeholder  = "Notes, consignes, points clés…";
    } else {
      label.textContent = "Commentaire composition d’équipe";
      area.placeholder  = "Notes d’alignement, consignes de postes…";
    }
  }
}

    return { init, setStatus, updateDockVisibilityByMode };
  })();

  // Lance l’UI si le SVG est présent
  const svgRootInit = document.getElementById("kasendemi-svg");
  if (svgRootInit) KSPro.init();
  if (!svgRootInit) return;

  /* ================= Contexte serveur ================= */
  const canSync = typeof kasendemiVars !== "undefined" && Number(kasendemiVars.currentUser || 0) > 0;

  /* ================= Variables globales ================= */
  let simulations = {};
  let currentSim = "";
  let currentSeq = 0;
  let players = []; // [{group, img|circle, label, style, w,h,r}]
  let playerConfigs = [];
  let arrowsVisible = true;
  let customBallPos = null;
  let compos = {};
  let currentCompo = "";
  let mode = "tactic";
  const TOOL_MOVE = "move_players";
  const TOOL_ARROW = "draw_arrows";
  const MODE_NAVIGATION = "navigation";
  const MODE_EDITION = "edition";
  let interactionMode = MODE_NAVIGATION;
  let interactionTool = TOOL_ARROW;

  function clearPlayerEditorUI(){
    if (configContainer) configContainer.innerHTML = "";
    if (svg) svg.querySelectorAll(".player, .player-silhouette, .player-label, .player-circle").forEach(el => el.remove());
    players = [];
  }

  function renderCurrentSimulation(){
    drawField();
    createPlayers();
    drawPlayerConfigUI();
    syncCommentBar();
    drawAnnotations();
  }

  // Affichage global persisté dans simulations._display
  function getDisplay(){
    if (!simulations._display) simulations._display = {
      playerScale: 0.8,
      labelMode: "numero",
      labelShadow: true,
      defaultStyle: "silhouette",
      defaultCircleColor: "#00bfff",
    };
    return simulations._display;
  }

  // Annotations
  let annotationMode = false;
  let annotationColor = "#ff3b30";
  let annotationWidth = 3;
  let analysisTool = "libre";
  let _annotTempPath = null;
  let _selectedAnn = null;
  let _connectBuffer = [];
  let _annIdCounter = 1;

  /* ================= Constantes UI ================= */
  const pluginUrl = (() => {
    if (window.kasendemiVars && window.kasendemiVars.pluginUrl) {
      return window.kasendemiVars.pluginUrl;
    }
    const current = document.currentScript || Array.from(document.scripts).find(s => (s.src || "").includes("script.js"));
    if (current && current.src) {
      const url = current.src.split("?")[0];
      const idx = url.lastIndexOf("/");
      return idx !== -1 ? url.slice(0, idx + 1) : "";
    }
    return "";
  })();
  const svg = document.getElementById("kasendemi-svg");
  const configContainer = document.getElementById("config-container");
  const tacticModeBtn = document.getElementById("tacticModeBtn");
  const compoModeBtn  = document.getElementById("compoModeBtn");
  const toolMoveBtn   = document.getElementById("tool-move-players");
  const toolArrowBtn  = document.getElementById("tool-draw-arrows");
  const fieldScroll   = document.getElementById("kas-field-scroll");
  const svgBaseTouchAction = svg ? (svg.style.touchAction || window.getComputedStyle(svg).touchAction || "auto") : "auto";
  const fieldScrollBaseTouchAction = fieldScroll ? (fieldScroll.style.touchAction || window.getComputedStyle(fieldScroll).touchAction || "auto") : "auto";
  const navModeBtn   = document.getElementById("mode-navigation");
  const editModeBtn  = document.getElementById("mode-edition");
  const arrowTypeSelect = document.getElementById("arrow-type-select");
  const returnTopBtn = document.getElementById("ks-return-top");
  const editionOnlyEls = document.querySelectorAll(".ks-edition-only");
  const commandsAnchor = document.getElementById("ks-commands-anchor");

  function lockFieldScroll(){
    if (fieldScroll) fieldScroll.classList.add("ks-scroll-lock");
    if (svg) svg.style.touchAction = "none";
    if (fieldScroll) fieldScroll.style.touchAction = "none";
  }
  function unlockFieldScroll(){
    if (interactionMode === MODE_EDITION) return; // reste bloqué en mode édition
    if (fieldScroll) fieldScroll.classList.remove("ks-scroll-lock");
    if (fieldScroll) fieldScroll.style.touchAction = fieldScrollBaseTouchAction || "";
    if (svg) svg.style.touchAction = svgBaseTouchAction || "";
  }

  function setInteractionTool(tool){
    interactionTool = tool;
    if (toolMoveBtn) toolMoveBtn.dataset.active = tool === TOOL_MOVE ? "1" : "0";
    if (toolArrowBtn) toolArrowBtn.dataset.active = tool === TOOL_ARROW ? "1" : "0";
    if (svg){
      if (tool === TOOL_MOVE) svg.style.cursor = "grab";
      else if (tool === TOOL_ARROW) svg.style.cursor = "crosshair";
      else svg.style.cursor = "default";
    }
  }

  function setInteractionMode(modeName){
    interactionMode = modeName;
    const isEdition = interactionMode === MODE_EDITION;
    if (navModeBtn) navModeBtn.dataset.active = isEdition ? "0" : "1";
    if (editModeBtn) editModeBtn.dataset.active = isEdition ? "1" : "0";
    if (fieldScroll){
      fieldScroll.classList.toggle("ks-edit-locked", isEdition);
      // En mode édition : touch-action none pour bloquer scroll 1 doigt (la navigation 2 doigts est gérée par JS)
      fieldScroll.style.touchAction = isEdition ? "none" : (fieldScrollBaseTouchAction || "");
      if (!isEdition) fieldScroll.classList.remove("ks-scroll-lock");
    }
    if (svg) svg.style.touchAction = isEdition ? "none" : (svgBaseTouchAction || "");

    const disableTools = !isEdition;
    [toolMoveBtn, toolArrowBtn, arrowTypeSelect].forEach(btn => { if (btn) btn.disabled = disableTools; });
    editionOnlyEls.forEach(el => { if (el) el.style.display = isEdition ? "block" : "none"; });
  }

  function scrollBackToCommands(){
    const anchor = commandsAnchor || document.getElementById("toolbar-advanced") || document.body;
    if (anchor && anchor.scrollIntoView){
      anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (fieldScroll) fieldScroll.scrollTo({ top: 0, behavior: "smooth" });
  }

  const spriteFamilies = [
    {
      id: "gk_white_A",
      mainLabel: "Gardien blanc A Face",
      variants: [
        { label: "Face", src: "Gardien blanc A Face.png" },
        { label: "Dos", src: "Gardien blanc A Dos.png" },
        { label: "Profil gauche", src: "Gardien blanc A Profil gauche.png" },
        { label: "Profil droit", src: "Gardien blanc A Profil droit.png" },
      ],
    },
    {
      id: "gk_black_A",
      mainLabel: "Gardien noire A Face",
      variants: [
        { label: "Face", src: "Gardien noir A Face.png" },
        { label: "Dos", src: "Gardien noir A Dos.png" },
        { label: "Profil droit", src: "Gardien noir A Profil droit.png" },
        { label: "Profil gauche", src: "Gardien noir A Profil gauche.png" },
      ],
    },
    {
      id: "player_black_A",
      mainLabel: "Joueur noire A Face",
      variants: [
        { label: "Face", src: "Joueur noire A Face.png" },
        { label: "Dos", src: "Joueur noire A Dos.png" },
        { label: "Profil droit", src: "Joueur noire A Profil droit.png" },
        { label: "Profil gauche", src: "Joueur noire A Profil gauche.png" },
      ],
    },
    {
      id: "player_white_A",
      mainLabel: "Joueur blanc A Face",
      variants: [
        { label: "Face", src: "Joueur blanc A Face.png" },
        { label: "Dos", src: "Joueur blanc A Dos.png" },
        { label: "Profil droit", src: "Joueur blanc A Profil droit.png" },
        { label: "Profil gauche", src: "Joueur blanc A Profil gauche.png" },
      ],
    },
    {
      id: "gk_black_B",
      mainLabel: "Gardien noire B Face",
      variants: [
        { label: "Face", src: "Gardien noire B Face.png" },
        { label: "Dos", src: "Gardien noire B Dos.png" },
        { label: "Profil gauche", src: "Gardien noire B Profil gauche.png" },
        { label: "Profil droit", src: "Gardien noire B Profil droit.png" },
      ],
    },
    {
      id: "gk_white_B",
      mainLabel: "Gardien blanc B Face",
      variants: [
        { label: "Face", src: "Gardien blanc B Face.png" },
        { label: "Dos", src: "Gardien blanc B Dos.png" },
        { label: "Profil gauche", src: "Gardien blanc B Profil gauche.png" },
        { label: "Profil droit", src: "Gardien blanc B Profil droit.png" },
      ],
    },
    {
      id: "player_black_B",
      mainLabel: "Joueur noir B Face",
      variants: [
        { label: "Face", src: "Joueur noir B Face.png" },
        { label: "Dos", src: "Joueur noir B Dos.png" },
        { label: "Profil droit", src: "Joueur noir B Profil droit.png" },
        { label: "Profil gauche", src: "Joueur noir B Profil gauche.png" },
      ],
    },
    {
      id: "player_white_B",
      mainLabel: "Joueur blanc B Face",
      variants: [
        { label: "Face", src: "Joueur blanc B Face.png" },
        { label: "Dos", src: "Joueur blanc B Dos.png" },
        { label: "Profil droit", src: "Joueur blanc B Profil droit.png" },
        { label: "Profil gauche", src: "Joueur blanc B Profil gauche.png" },
      ],
    },
  ];
  const playerSprites = spriteFamilies.flatMap(f => {
    const baseLabel = f.mainLabel.replace(/\s+Face$/i, "");
    return f.variants.map(v => ({ label: `${baseLabel} – ${v.label}`, src: v.src }));
  });
  const validSpriteSet = new Set(playerSprites.map(p => p.src));
  const spriteToFamily = new Map();
  spriteFamilies.forEach(f => f.variants.forEach(v => spriteToFamily.set(v.src, f.id)));
  const fallbackFamilyId = spriteFamilies[0]?.id || "";
  const fallbackSprite = spriteFamilies[0]?.variants?.[0]?.src || "";
  const ballSprite = "ballon.png";
  const skins = [
    { name: "Blanc",  color: "#ffe0c0" },
    { name: "Métis",  color: "#e5b475" },
    { name: "Noir",   color: "#8d5a27" },
  ];

  /* ================= AJAX ================= */
  async function fetchSimulationsFromServer() {
    if (!canSync) return {};
    try {
      const url = `${kasendemiVars.ajaxUrl}?action=ksim_get_simulations&nonce=${encodeURIComponent(kasendemiVars.nonce)}`;
      const response = await fetch(url, { credentials: "same-origin" });
      const res = await response.json();
      if (res.success && res.data && res.data.simulations) return res.data.simulations;
      return {};
    } catch (e) { console.warn("Erreur de chargement des simulations", e); return {}; }
  }
  async function saveSimulationsToServer(simulationsObj) {
    if (!canSync) return true;
    try {
      const url = `${kasendemiVars.ajaxUrl}?action=ksim_save_simulations&nonce=${encodeURIComponent(kasendemiVars.nonce)}`;
      const response = await fetch(url, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulations: simulationsObj }),
      });
      const res = await response.json();
      if (!res.success) { console.warn("Sauvegarde simulations KO :", res.data); return false; }
      return true;
    } catch (e) { console.warn("Erreur réseau lors de la sauvegarde simulations", e); return false; }
  }
  function loadSimulationsFromLocal(){
    try {
      const rawMain = localStorage.getItem("simulations");
      const rawAlt1 = localStorage.getItem("ksim_simulations");
      const rawAlt2 = localStorage.getItem("kasendemi_simulations");
      const raw = rawMain || rawAlt1 || rawAlt2;
      return raw ? JSON.parse(raw) : null;
    } catch (e){ console.warn("Lecture simulations locale impossible", e); return null; }
  }
  function saveSimulationsToLocal(simulationsObj){
    try {
      localStorage.setItem("simulations", JSON.stringify(simulationsObj||{}));
    } catch (e){ console.warn("Sauvegarde simulations locale impossible", e); }
  }
  async function fetchComposFromServer() {
    if (!canSync) return {};
    try {
      const url = `${kasendemiVars.ajaxUrl}?action=ksim_get_compos&nonce=${encodeURIComponent(kasendemiVars.nonce)}`;
      const response = await fetch(url, { credentials: "same-origin" });
      const res = await response.json();
      if (res.success && res.data && res.data.compos) return res.data.compos;
      return {};
    } catch (e) { console.warn("Erreur de chargement des compos", e); return {}; }
  }
  async function saveComposToServer(composObj) {
    if (!canSync) return true;
    try {
      const url = `${kasendemiVars.ajaxUrl}?action=ksim_save_compos&nonce=${encodeURIComponent(kasendemiVars.nonce)}`;
      const response = await fetch(url, {
        method: "POST", credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compos: composObj }),
      });
      const res = await response.json();
      if (!res.success) { console.warn("Sauvegarde compo KO :", res.data); return false; }
      return true;
    } catch (e) { console.warn("Erreur réseau lors de la sauvegarde compo", e); return false; }
  }
  function loadComposFromLocal(){
    try {
      const raw = localStorage.getItem("compos");
      return raw ? JSON.parse(raw) : null;
    } catch (e){ console.warn("Lecture compos locale impossible", e); return null; }
  }
  function saveComposToLocal(composObj){
    try {
      localStorage.setItem("compos", JSON.stringify(composObj||{}));
    } catch (e){ console.warn("Sauvegarde compos locale impossible", e); }
  }

  function mergeSimSources(serverObj, localObj){
    const merged = {};
    if (localObj && typeof localObj === "object"){ Object.assign(merged, localObj); }
    if (serverObj && typeof serverObj === "object"){ Object.assign(merged, serverObj); }
    return merged;
  }

  /* ================= Chargement init ================= */
  const srvSims = await fetchSimulationsFromServer();
  const localSims = loadSimulationsFromLocal();
  simulations = mergeSimSources(srvSims, localSims);
  if (!simulations || typeof simulations !== "object" || Object.keys(simulations).length === 0) {
    simulations = {
      "Simulation 1": {
        initialPositions: [],
        sequences: [{ name: "Séquence 1", arrows: [], ballPos: { x: 450, y: 300 }, ballPosFinal:null, comment: "", annotations: [], sprites: [], arrowPresets: [] }],
        playerConfigs: [],
      },
      _display: { playerScale:0.8, labelMode:"numero", labelShadow:true, defaultStyle:"silhouette", defaultCircleColor:"#00bfff" }
    };
    currentSim = "Simulation 1";
    await saveSimulationsToServer(simulations);
  }
  if (!simulations._display) simulations._display = { playerScale:0.8, labelMode:"numero", labelShadow:true, defaultStyle:"silhouette", defaultCircleColor:"#00bfff" };
  currentSim = Object.keys(simulations).find(k=>k!=="_display") || Object.keys(simulations)[0];
  Object.values(simulations).forEach(sim=>{
    if (!sim || !sim.sequences) return;
    sim.sequences.forEach(seq=>{
      if (!seq.annotations) seq.annotations = [];
      if (typeof seq.comment !== "string") seq.comment = "";
      if (typeof seq.ballPosFinal === "undefined") seq.ballPosFinal = null;
      if (!Array.isArray(seq.sprites)) seq.sprites = [];
      if (!Array.isArray(seq.arrowPresets)) seq.arrowPresets = [];
      (seq.arrows||[]).forEach(a=>{ if (typeof a.phase!=="number") a.phase=0; if (typeof a.delayMs!=="number") a.delayMs=0; });
    });
  });
  saveSimulationsToLocal(simulations);
  currentSeq = 0;

  compos = await fetchComposFromServer();
  if (!compos || typeof compos !== "object" || Object.keys(compos).length === 0) {
    const localCompos = loadComposFromLocal();
    if (localCompos && typeof localCompos === "object" && Object.keys(localCompos).length){
      compos = localCompos;
    }
  }
  if (!compos || typeof compos !== "object" || Object.keys(compos).length === 0) {
    compos = { "Composition 1": { players: [], comment: "" } };
    currentCompo = "Composition 1";
    await saveComposToServer(compos);
  }
  currentCompo = Object.keys(compos)[0];
  Object.values(compos).forEach(c=>{ if (typeof c.comment !== "string") c.comment = ""; });
  saveComposToLocal(compos);

  /* ================= Modes ================= */
  function switchMode(newMode) {
    mode = newMode;
    setInteractionMode(MODE_NAVIGATION);
    // Exclure les éléments .ks-edition-only pour qu'ils restent masqués en mode navigation
    document.querySelectorAll(".tactic-only:not(.ks-edition-only)").forEach(e => e.style.display = (mode === "tactic" ? "inline-block" : "none"));
    // Masquer explicitement les éléments edition-only en mode tactic (ils seront affichés quand on passe en mode édition)
    document.querySelectorAll(".tactic-only.ks-edition-only").forEach(e => e.style.display = "none");
    document.querySelectorAll(".compo-only") .forEach(e => e.style.display = (mode === "compo"  ? "inline-block" : "none"));
    if (configContainer) configContainer.innerHTML = "";
    drawField();
    KSPro.updateDockVisibilityByMode(mode);

    if (mode === "tactic") {
      updateSimSelect(); updateSeqSelect(); 
 syncCommentBar();
      createPlayers(); ensureArrowHeadMarker(); ensureAnalysisMarkers(); drawAnnotations(); attachAdminToolbarEvents();
    } else {
      updateCompoSelect(); drawCompoConfigUI(); drawCompoPlayers(); syncCommentBar();
    }
  }
  if (tacticModeBtn) tacticModeBtn.onclick = () => switchMode("tactic");
  if (compoModeBtn)  compoModeBtn.onclick  = () => switchMode("compo");
  if (toolMoveBtn) toolMoveBtn.addEventListener("click", ()=> setInteractionTool(TOOL_MOVE));
  if (toolArrowBtn) toolArrowBtn.addEventListener("click", ()=> setInteractionTool(TOOL_ARROW));
  if (navModeBtn) navModeBtn.addEventListener("click", ()=> setInteractionMode(MODE_NAVIGATION));
  if (editModeBtn) editModeBtn.addEventListener("click", ()=> setInteractionMode(MODE_EDITION));
  if (returnTopBtn) returnTopBtn.addEventListener("click", scrollBackToCommands);

  // =============== NAVIGATION 2 DOIGTS EN MODE ÉDITION ===============
  // Permet de scroller le terrain avec 2 doigts tout en éditant avec 1 doigt
  // Limité au terrain uniquement (pas toute la page)
  // Inclut un délai de 150ms pour éviter les déplacements accidentels de joueurs

  // Variables globales pour la gestion tactile
  let isTwoFingerTouch = false;
  let touchStartTime = 0;
  let pendingDragAllowed = false;
  const TOUCH_DELAY = 150; // ms avant d'autoriser le déplacement

  // Fonction pour vérifier si le drag est autorisé (après délai et sans 2e doigt)
  function isDragAllowedAfterDelay() {
    if (isTwoFingerTouch) return false;
    return pendingDragAllowed || (Date.now() - touchStartTime >= TOUCH_DELAY);
  }

  (function initTwoFingerScroll() {
    let lastTouchY = 0;
    let lastTouchX = 0;
    const terrainWrapper = document.getElementById("kas-terrain-wrapper");

    function getTouchCenter(touches) {
      const t1 = touches[0];
      const t2 = touches[1];
      return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
      };
    }

    // Vérifier si le touch est sur le terrain
    function isTouchOnTerrain(e) {
      if (!terrainWrapper && !svg && !fieldScroll) return false;
      const target = e.target;
      // Vérifier si le target est dans le terrain wrapper, le SVG ou le fieldScroll
      return (terrainWrapper && terrainWrapper.contains(target)) ||
             (svg && (svg.contains(target) || svg === target)) ||
             (fieldScroll && fieldScroll.contains(target));
    }

    // Détecter le début du geste tactile
    document.addEventListener("touchstart", (e) => {
      if (interactionMode !== MODE_EDITION) return;

      // Premier doigt : démarrer le timer
      if (e.touches.length === 1) {
        touchStartTime = Date.now();
        pendingDragAllowed = false;
        isTwoFingerTouch = false;
        // Après le délai, autoriser le drag si toujours 1 doigt
        setTimeout(() => {
          if (!isTwoFingerTouch && interactionMode === MODE_EDITION) {
            pendingDragAllowed = true;
          }
        }, TOUCH_DELAY);
      }

      // Deuxième doigt détecté : c'est un scroll, pas un drag
      if (e.touches.length === 2 && isTouchOnTerrain(e)) {
        isTwoFingerTouch = true;
        pendingDragAllowed = false;
        const center = getTouchCenter(e.touches);
        lastTouchX = center.x;
        lastTouchY = center.y;
      }
    }, { passive: true });

    // Gérer le mouvement à 2 doigts
    document.addEventListener("touchmove", (e) => {
      if (interactionMode !== MODE_EDITION) return;
      if (e.touches.length === 2 && isTwoFingerTouch) {
        e.preventDefault(); // Empêcher le zoom natif
        const center = getTouchCenter(e.touches);
        const deltaX = lastTouchX - center.x;
        const deltaY = lastTouchY - center.y;

        // Scroller le conteneur du terrain (horizontal)
        if (fieldScroll) {
          fieldScroll.scrollBy({ left: deltaX, top: 0 });
        }
        // Scroller la page (vertical)
        window.scrollBy({ left: 0, top: deltaY });

        lastTouchX = center.x;
        lastTouchY = center.y;
      }
    }, { passive: false });

    // Fin du geste à 2 doigts
    document.addEventListener("touchend", (e) => {
      if (e.touches.length < 2) {
        isTwoFingerTouch = false;
      }
      if (e.touches.length === 0) {
        pendingDragAllowed = false;
      }
    }, { passive: true });

    document.addEventListener("touchcancel", () => {
      isTwoFingerTouch = false;
      pendingDragAllowed = false;
    }, { passive: true });
  })();

  setInteractionMode(MODE_NAVIGATION);
  setInteractionTool(TOOL_ARROW);

  /* ================= UI communes ================= */
  function drawField() {
    svg.innerHTML = "";
    const terrainImg = document.createElementNS(svg.namespaceURI, "image");
    terrainImg.setAttributeNS("http://www.w3.org/1999/xlink", "href",
      pluginUrl + "assets/" + (mode === "tactic" ? "terrain 1 avec foule.png" : "terrain 2 compo.png"));
    terrainImg.setAttribute("x", 0); terrainImg.setAttribute("y", 0);
    terrainImg.setAttribute("width", 900); terrainImg.setAttribute("height", 600);
    terrainImg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.appendChild(terrainImg);
  }

  /* ================= Tactic mode ================= */
  function ensurePlayerConfigs() {
    if (!simulations[currentSim]) return;
    if (!simulations[currentSim].playerConfigs) simulations[currentSim].playerConfigs = [];
    playerConfigs = simulations[currentSim].playerConfigs;
    normalizeSequenceSpritesForCurrentSim();
    normalizeSequenceArrowPresetsForCurrentSim();
  }
  function saveSimulations() {
    normalizeSequenceSpritesForCurrentSim();
    normalizeSequenceArrowPresetsForCurrentSim();
    simulations[currentSim].playerConfigs = playerConfigs;
    saveSimulationsToLocal(simulations);
    saveSimulationsToServer(simulations);
  }
  function updateSimSelect() {
    const simSelect = document.getElementById("simSelect");
    if (!simSelect) return;
    simSelect.innerHTML = "";
    Object.keys(simulations).filter(k=>k!=="_display").forEach(name => {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name; simSelect.appendChild(opt);
    });
    simSelect.value = currentSim;
  }
  function updateSeqSelect() {
    const seqSelect = document.getElementById("seqSelect");
    if (!seqSelect) return;
    const seqs = simulations[currentSim].sequences || [];
    seqSelect.innerHTML = "";
    seqs.forEach((seq, i) => {
      const opt = document.createElement("option");
      opt.value = i; opt.textContent = seq.name; seqSelect.appendChild(opt);
    });
    seqSelect.value = currentSeq;
  }

 function playerLabelText(i){
  const d = getDisplay();
  const conf = playerConfigs[i] || {};
  const num = (typeof conf.num!=="undefined") ? conf.num : (i+1);
  const name = conf.name || "";
  switch (d.labelMode){
    case "numero": return String(num);
    case "nom":    return String(name||"");
    case "both":   return (name? `${num} ${name}` : String(num));
    default:       return "";
  }
}
/* === INSÉRER ICI les helpers effStyle / effCircleColor / effSprite === */
function effStyle(conf){
  const d = getDisplay();
  return (conf && conf.overrideStyle)
    ? (conf.style || "silhouette")
    : (d.defaultStyle || "silhouette");
}
function effCircleColor(conf){
  const d = getDisplay();
  return (conf && conf.overrideStyle)
    ? (conf.circleColor || d.defaultCircleColor || "#00bfff")
    : (d.defaultCircleColor || "#00bfff");
}
function effSprite(conf){
  const sprite = conf?.sprite;
  if (sprite && validSpriteSet.has(sprite)) return sprite;
  return playerSprites[0].src;
}
function ensureSeqSprites(seqIndex){
  const sim = simulations[currentSim];
  if (!sim || !sim.sequences) return null;
  const seq = sim.sequences[seqIndex];
  if (!seq) return null;
  const targetLen = sim.initialPositions?.length || 0;
  if (!Array.isArray(seq.sprites)) seq.sprites = [];
  while (seq.sprites.length < targetLen) seq.sprites.push(null);
  if (seq.sprites.length > targetLen) seq.sprites = seq.sprites.slice(0, targetLen);
  return seq.sprites;
}
function effSeqSprite(conf, seqIndex, playerIndex){
  const seq = simulations[currentSim]?.sequences?.[seqIndex];
  const override = seq?.sprites?.[playerIndex];
  if (override && validSpriteSet.has(override)) return override;
  return effSprite(conf);
}
function normalizeSequenceSpritesForCurrentSim(){
  const sim = simulations[currentSim];
  if (!sim || !sim.sequences) return;
  sim.sequences.forEach((_, idx)=> ensureSeqSprites(idx));
}
/* === FIN INSERTION === */

  function clampNumber(val, min, max, fallback){
    const n = (typeof val === "number") ? val : parseFloat(val);
    if (Number.isFinite(n)) return Math.min(max, Math.max(min, n));
    return fallback;
  }

  function ensureArrowPresetsForSequence(seq, targetLen){
    if (!seq) return [];
    const len = (typeof targetLen === "number") ? targetLen : (simulations[currentSim]?.initialPositions?.length || 0);
    if (!Array.isArray(seq.arrowPresets)) seq.arrowPresets = [];
    while (seq.arrowPresets.length < len) seq.arrowPresets.push({ vitesse: 900, phase: 0, delayMs: 0, type: "move_player" });
    if (seq.arrowPresets.length > len) seq.arrowPresets = seq.arrowPresets.slice(0, len);
    seq.arrowPresets = seq.arrowPresets.map(preset => ({
      vitesse: clampNumber(preset?.vitesse, 200, 6000, 900),
      phase: clampNumber(preset?.phase, 0, 99, 0),
      delayMs: clampNumber(preset?.delayMs, 0, 5000, 0),
      type: (typeof preset?.type === "string" && preset.type) ? preset.type : "move_player",
    }));
    return seq.arrowPresets;
  }

  function normalizeSequenceArrowPresetsForCurrentSim(){
    const sim = simulations[currentSim];
    if (!sim || !sim.sequences) return;
    const targetLen = sim.initialPositions?.length || 0;
    sim.sequences.forEach(seq => ensureArrowPresetsForSequence(seq, targetLen));
  }

  function drawPlayerConfigUI() {
    if (!configContainer) return;
    configContainer.innerHTML = "";
    ensurePlayerConfigs();
    normalizeSequenceArrowPresetsForCurrentSim();

    const seq = simulations[currentSim]?.sequences?.[currentSeq];

    const header = document.createElement("div");
    header.className = "ks-player-grid ks-player-header";
    ["#", "Style", "Sprite & posture", "Identification", "Timing & vitesse mouvement", "Actions"].forEach(txt => {
      const cell = document.createElement("div");
      cell.textContent = txt;
      header.appendChild(cell);
    });
    configContainer.appendChild(header);

    for (let i = 0; i < playerConfigs.length; i++) {
      const conf = playerConfigs[i];
      if (typeof conf.style === "undefined") conf.style = getDisplay().defaultStyle || "silhouette";
      if (typeof conf.circleColor === "undefined") conf.circleColor = getDisplay().defaultCircleColor || "#00bfff";
      if (typeof conf.num === "undefined") conf.num = i + 1;
      if (typeof conf.name === "undefined") conf.name = "";
      if (typeof conf.overrideStyle === "undefined") conf.overrideStyle = false;

      const row = document.createElement("div");
      row.className = "ks-player-grid ks-player-row";

      const indexCell = document.createElement("div");
      indexCell.className = "ks-cell-index";
      indexCell.textContent = `${i + 1}`;
      row.appendChild(indexCell);

      const styleCell = document.createElement("div");
      styleCell.className = "ks-flex-row";

      const chkOverride = document.createElement("input");
      chkOverride.type = "checkbox";
      chkOverride.checked = !!conf.overrideStyle;
      chkOverride.title = "Personnaliser le style pour ce joueur (sinon, hérite du style par défaut)";

      const overrideLbl = document.createElement("span");
      overrideLbl.textContent = "Perso";
      overrideLbl.className = "ks-muted-label";

      const selStyle = document.createElement("select");
      selStyle.className = "kas-mini-select";
      ["silhouette", "rond"].forEach(s => {
        const opt = document.createElement("option");
        opt.value = s; opt.textContent = s[0].toUpperCase() + s.slice(1);
        selStyle.appendChild(opt);
      });
      const globalStyle = getDisplay().defaultStyle || "silhouette";
      selStyle.value = (conf.overrideStyle ? (conf.style || globalStyle) : globalStyle);
      selStyle.disabled = !conf.overrideStyle;
      selStyle.onchange = () => { playerConfigs[i].style = selStyle.value; saveSimulations(); createPlayers(); drawPlayerConfigUI(); };

      const colorCircle = document.createElement("input");
      colorCircle.type = "color";
      colorCircle.className = "kas-mini-color";
      colorCircle.value = conf.circleColor || getDisplay().defaultCircleColor || "#00bfff";
      colorCircle.onchange = () => { playerConfigs[i].circleColor = colorCircle.value; saveSimulations(); createPlayers(); };
      colorCircle.disabled = !(conf.overrideStyle ? (selStyle.value === "rond") : (globalStyle === "rond"));

      const syncColorDisabled = () => {
        colorCircle.disabled = !(playerConfigs[i].overrideStyle ? (selStyle.value === "rond") : (globalStyle === "rond"));
      };

      const syncSpriteDisabled = () => {
        const isSilhouette = conf.overrideStyle ? (selStyle.value === "silhouette") : (globalStyle === "silhouette");
        selFamily.disabled = !isSilhouette;
        selPose.disabled = !isSilhouette;
      };

      chkOverride.onchange = () => {
        playerConfigs[i].overrideStyle = !!chkOverride.checked;
        const isPerso = !!chkOverride.checked;
        selStyle.disabled = !isPerso;
        const styleEff = isPerso ? (selStyle.value) : (globalStyle);
        colorCircle.disabled = !(styleEff === "rond");
        syncSpriteDisabled();
        saveSimulations();
        createPlayers();
        drawPlayerConfigUI();
      };

      styleCell.appendChild(chkOverride);
      styleCell.appendChild(overrideLbl);
      styleCell.appendChild(selStyle);

      // Sprite (si silhouette)
      const selFamily = document.createElement("select");
      selFamily.className = "kas-mini-select";
      spriteFamilies.forEach(f => {
        const opt = document.createElement("option");
        opt.value = f.id;
        opt.textContent = f.mainLabel;
        selFamily.appendChild(opt);
      });

      const selPose = document.createElement("select");
      selPose.className = "kas-mini-select";
      const seqPose = document.createElement("select");
      seqPose.className = "kas-mini-select";

      const ensureFamily = (fid) => spriteFamilies.find(f => f.id === fid) || spriteFamilies.find(f => f.id === fallbackFamilyId) || spriteFamilies[0];
      const updatePoseOptions = (fid, preferredSprite) => {
        const fam = ensureFamily(fid);
        if (!fam) return;
        selPose.innerHTML = "";
        const baseName = fam.mainLabel.replace(/\s+Face$/i, "");
        fam.variants.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v.src;
          opt.textContent = `${baseName} ${v.label}`;
          selPose.appendChild(opt);
        });
        const chosenSprite = fam.variants.find(v => v.src === preferredSprite)?.src || fam.variants[0]?.src || fallbackSprite;
        selPose.value = chosenSprite;
        if (!validSpriteSet.has(conf.sprite) || conf.sprite !== chosenSprite) {
          playerConfigs[i].sprite = chosenSprite;
        }
      };

      const updateSeqPoseOptions = (fid) => {
        const fam = ensureFamily(fid);
        if (!fam) return;
        seqPose.innerHTML = "";
        const inherit = document.createElement("option");
        inherit.value = "";
        inherit.textContent = "Posture séquence (défaut)";
        seqPose.appendChild(inherit);
        const baseName = fam.mainLabel.replace(/\s+Face$/i, "");
        fam.variants.forEach(v => {
          const opt = document.createElement("option");
          opt.value = v.src;
          opt.textContent = `${baseName} ${v.label}`;
          seqPose.appendChild(opt);
        });
        const seqSprites = ensureSeqSprites(currentSeq) || [];
        const stored = seqSprites[i];
        const chosen = (stored && validSpriteSet.has(stored) && spriteToFamily.get(stored) === fam.id) ? stored : "";
        seqPose.value = chosen;
      };

      const spriteValue = validSpriteSet.has(conf.sprite) ? conf.sprite : fallbackSprite;
      const initialFamily = spriteToFamily.get(spriteValue) || fallbackFamilyId;
      selFamily.value = initialFamily;
      updatePoseOptions(initialFamily, spriteValue);
      updateSeqPoseOptions(initialFamily);

      selFamily.onchange = () => {
        const fam = ensureFamily(selFamily.value);
        updatePoseOptions(fam.id, fam.variants[0]?.src);
        updateSeqPoseOptions(fam.id);
        const seqSprites = ensureSeqSprites(currentSeq) || [];
        if (seqPose.value && spriteToFamily.get(seqPose.value) !== fam.id) {
          seqPose.value = "";
          seqSprites[i] = null;
        }
        saveSimulations();
        createPlayers(undefined, currentSeq);
        drawPlayerConfigUI();
      };

      selPose.onchange = () => {
        playerConfigs[i].sprite = selPose.value;
        saveSimulations();
        createPlayers(undefined, currentSeq);
        drawPlayerConfigUI();
      };

      seqPose.onchange = () => {
        const seqSprites = ensureSeqSprites(currentSeq) || [];
        seqSprites[i] = seqPose.value || null;
        saveSimulations();
        createPlayers(undefined, currentSeq);
      };

      syncSpriteDisabled();
      selStyle.addEventListener("change", syncSpriteDisabled);
      selStyle.addEventListener("change", syncColorDisabled);

      styleCell.appendChild(colorCircle);

      const spriteCell = document.createElement("div");
      spriteCell.className = "ks-flex-row";
      spriteCell.appendChild(selFamily);
      spriteCell.appendChild(selPose);
      spriteCell.appendChild(seqPose);

      const idCell = document.createElement("div");
      idCell.className = "ks-flex-row";
      const numInput = document.createElement("input");
      numInput.type = "number";
      numInput.value = conf.num ?? (i + 1);
      numInput.min = 1; numInput.max = 99;
      numInput.className = "kas-mini-input";
      numInput.onchange = () => { playerConfigs[i].num = parseInt(numInput.value || i + 1, 10); saveSimulations(); createPlayers(); };

      const nameInput = document.createElement("input");
      nameInput.value = conf.name || "";
      nameInput.placeholder = "Nom";
      nameInput.className = "kas-mini-input kas-mini-name";
      nameInput.onchange = () => { playerConfigs[i].name = nameInput.value; saveSimulations(); createPlayers(); };

      idCell.appendChild(numInput);
      idCell.appendChild(nameInput);

      const timingCell = document.createElement("div");
      timingCell.className = "kas-timing-line";
      const seqPresets = seq ? ensureArrowPresetsForSequence(seq) : [];
      const preset = seqPresets[i] || { vitesse: 900, phase: 0, delayMs: 0 };
      const arrow = (seq?.arrows || []).find(a => a.playerIndex === i);
      if (arrow) {
        preset.vitesse = clampNumber(arrow.vitesse, 200, 6000, preset.vitesse);
        preset.phase = clampNumber(arrow.phase, 0, 99, preset.phase);
        preset.delayMs = clampNumber(arrow.delayMs, 0, 5000, preset.delayMs);
        seqPresets[i] = { ...preset };
      }

      const speedInput = document.createElement("input");
      speedInput.type = "number"; speedInput.min = 200; speedInput.max = 6000; speedInput.step = 50;
      speedInput.className = "kas-mini-input";
      speedInput.value = preset.vitesse ?? 900;

      const phaseInput = document.createElement("input");
      phaseInput.type = "number"; phaseInput.min = 0; phaseInput.max = 99; phaseInput.step = 1;
      phaseInput.className = "kas-mini-input";
      phaseInput.value = preset.phase ?? 0;

      const delayInput = document.createElement("input");
      delayInput.type = "number"; delayInput.min = 0; delayInput.max = 5000; delayInput.step = 50;
      delayInput.className = "kas-mini-input";
      delayInput.value = preset.delayMs ?? 0;

      const typeSelect = document.createElement("select");
      typeSelect.className = "kas-mini-select kas-mini-type";
      [
        { value: "move_player", label: "Déplacement" },
        { value: "dribble", label: "Conduite" },
        { value: "pass_ground", label: "Passe sol" },
        { value: "pass_air", label: "Passe air" },
        { value: "shoot_ground", label: "Tir sol" },
        { value: "shoot_air", label: "Tir air" },
      ].forEach(optData => {
        const opt = document.createElement("option");
        opt.value = optData.value; opt.textContent = optData.label;
        typeSelect.appendChild(opt);
      });
      typeSelect.value = arrow?.type || preset.type || "move_player";

      const status = document.createElement("span");
      status.className = "kas-timing-status";
      status.textContent = arrow ? "Flèche active" : "Aucune flèche";

      const applyTimingChange = () => {
        const seqObj = simulations[currentSim]?.sequences?.[currentSeq];
        if (!seqObj) return;
        const presets = ensureArrowPresetsForSequence(seqObj);
        const basePreset = presets[i] || preset;
        const speedVal = clampNumber(parseInt(speedInput.value, 10), 200, 6000, basePreset.vitesse || 900);
        const phaseVal = clampNumber(parseInt(phaseInput.value, 10), 0, 99, basePreset.phase || 0);
        const delayVal = clampNumber(parseInt(delayInput.value, 10), 0, 5000, basePreset.delayMs || 0);
        const typeVal = typeSelect.value || basePreset.type || "move_player";
        presets[i] = { vitesse: speedVal, phase: phaseVal, delayMs: delayVal, type: typeVal };
        const arr = (seqObj.arrows || []).find(a => a.playerIndex === i);
        if (arr) {
          arr.vitesse = speedVal; arr.phase = phaseVal; arr.delayMs = delayVal; arr.type = typeVal;
        }
        saveSimulations();
        drawArrows();
        typeSelect.value = typeVal;
        status.textContent = arr ? "Flèche active" : "Aucune flèche";
      };

      [speedInput, phaseInput, delayInput, typeSelect].forEach(inp => inp.addEventListener("change", applyTimingChange));

      const delArrowBtn = document.createElement("button");
      delArrowBtn.className = "kas-btn kas-btn-ghost";
      delArrowBtn.textContent = "🗑 Suppr flèche";
      delArrowBtn.title = "Supprimer la flèche de ce joueur dans la séquence";
      delArrowBtn.disabled = !arrow;
      delArrowBtn.onclick = () => {
        const seqObj = simulations[currentSim]?.sequences?.[currentSeq];
        if (!seqObj) return;
        const presets = ensureArrowPresetsForSequence(seqObj);
        const basePreset = presets[i] || preset;
        const speedVal = clampNumber(parseInt(speedInput.value, 10), 200, 6000, basePreset.vitesse || 900);
        const phaseVal = clampNumber(parseInt(phaseInput.value, 10), 0, 99, basePreset.phase || 0);
        const delayVal = clampNumber(parseInt(delayInput.value, 10), 0, 5000, basePreset.delayMs || 0);
        const typeVal = typeSelect.value || basePreset.type || "move_player";
        presets[i] = { vitesse: speedVal, phase: phaseVal, delayMs: delayVal, type: typeVal };
        seqObj.arrows = (seqObj.arrows || []).filter(a => a.playerIndex !== i);
        saveSimulations();
        drawArrows();
        drawBall();
        status.textContent = "Aucune flèche";
        delArrowBtn.disabled = true;
        drawPlayerConfigUI();
      };

      const timingInner = document.createElement("div");
      timingInner.className = "kas-timing-inner";
      timingInner.append(typeSelect, " Vitesse:", speedInput, " ms | Vague:", phaseInput, " | Décalage:", delayInput, " ms | ", delArrowBtn, status);
      timingCell.appendChild(timingInner);

      const actionCell = document.createElement("div");
      actionCell.className = "ks-actions-cell";
      const delBtn = document.createElement("button");
      delBtn.setAttribute("aria-label", "Supprimer ce joueur");
      delBtn.className = "kas-btn";
      delBtn.textContent = "✖";
      delBtn.onclick = () => {
        const sim = simulations[currentSim];
        if (!sim) return;
        sim.initialPositions.splice(i, 1);
        sim.playerConfigs.splice(i, 1);
        (sim.sequences || []).forEach(seqItem => {
          if (Array.isArray(seqItem.sprites)) seqItem.sprites.splice(i, 1);
          if (Array.isArray(seqItem.arrowPresets)) seqItem.arrowPresets.splice(i, 1);
          if (Array.isArray(seqItem.arrows)) {
            seqItem.arrows = seqItem.arrows
              .filter(a => a.playerIndex !== i)
              .map(a => (a.playerIndex != null && a.playerIndex > i) ? { ...a, playerIndex: a.playerIndex - 1 } : a);
          }
        });
        saveSimulations();
        drawField();
        createPlayers();
        drawArrows();
        drawBall();
        drawPlayerConfigUI();
      };
      actionCell.appendChild(delBtn);

      row.appendChild(styleCell);
      row.appendChild(spriteCell);
      row.appendChild(idCell);
      row.appendChild(timingCell);
      row.appendChild(actionCell);

      configContainer.appendChild(row);
    }
  }

  // Commentaires (séquence VS composition)
  function syncCommentBar(){
    const area = document.getElementById("ks-seq-comment");
    const label = document.getElementById("ks-comment-label");
    if (!area || !label) return;

    if (mode === "tactic"){
      const seq = simulations[currentSim]?.sequences?.[currentSeq];
      label.textContent = "Commentaire de la séquence";
      area.placeholder  = "Notes, consignes, points clés…";
      area.disabled = false;
      area.value = seq?.comment || "";
      area.onchange = ()=>{ const s = simulations[currentSim].sequences[currentSeq]; s.comment = area.value||""; saveSimulations(); };
    } else {
      label.textContent = "Commentaire composition d’équipe";
      area.placeholder  = "Notes d’alignement, consignes de postes…";
      area.disabled = false;
      area.value = (compos[currentCompo]?.comment) || "";
      area.onchange = ()=>{ compos[currentCompo].comment = area.value||""; saveComposToLocal(compos); saveComposToServer(compos); };
    }
  }

  function createPlayers(customPositions, seqIndex = currentSeq) {
    svg.querySelectorAll(".player, .player-silhouette, .player-label, .player-circle").forEach(e => e.remove());
    players = [];
    const positions = customPositions || getPositionsAtSequenceStart(seqIndex);
    ensurePlayerConfigs();
    while (playerConfigs.length < positions.length) {
      playerConfigs.push({ style: getDisplay().defaultStyle||"silhouette", circleColor:getDisplay().defaultCircleColor||"#00bfff", sprite: playerSprites[0].src, posture: "statique", skin: skins[0].color, num: playerConfigs.length+1, name:"" });
    }
    const scale = getDisplay().playerScale || 0.8;

    positions.forEach((pos, i) => {
      const conf = playerConfigs[i];
      const style = effStyle(conf);
      const group = document.createElementNS(svg.namespaceURI, "g");
      group.classList.add("player");
      group.dataset.index = i;

      let img=null, circle=null, w=0,h=0,r=0, label=null;

      if (style === "rond"){
        r = Math.round(22 * scale);
        circle = document.createElementNS(svg.namespaceURI, "circle");
        circle.classList.add("player-circle");
        circle.setAttribute("cx", pos.x);
        circle.setAttribute("cy", pos.y);
        circle.setAttribute("r", r);
        circle.setAttribute("fill", effCircleColor(conf));
        group.appendChild(circle);
      } else {
        const src = pluginUrl + "assets/" + effSeqSprite(conf, seqIndex, i);
        img = document.createElementNS(svg.namespaceURI, "image");
        img.classList.add("player-silhouette");
        w = Math.round(64 * scale);
        h = Math.round(64 * scale);
        img.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);
        img.setAttribute("x", pos.x - w/2);
        img.setAttribute("y", pos.y - (h*0.72));
        img.setAttribute("width", w);
        img.setAttribute("height", h);
        img.setAttribute("preserveAspectRatio", "xMidYMid meet");
        group.appendChild(img);
      }

      // Label (au-dessus de la tête)
      const text = playerLabelText(i);
      if (text){
        label = document.createElementNS(svg.namespaceURI, "text");
        label.classList.add("player-label");
        const useStroke = !!getDisplay().labelShadow;
        if (useStroke) label.classList.add("kas-label-text"); else label.classList.add("kas-label-no-stroke");
        label.setAttribute("text-anchor","middle");
        label.setAttribute("font-size", "12");
        label.setAttribute("font-weight", "700");
        label.setAttribute("fill", "#fff");
        const ly = style==="rond" ? (pos.y - (r+8)) : (pos.y - (h*0.86));
        label.setAttribute("x", pos.x); label.setAttribute("y", ly);
        label.textContent = text;
        group.appendChild(label);
      }

      // Hitbox agrandie pour le tactile
      const hit = document.createElementNS(svg.namespaceURI, "circle");
      hit.classList.add("player-hitbox");
      const hitR = style === "rond" ? Math.max(r + 10, 28 * scale) : Math.max(Math.max(w, h) * 0.45, 26 * scale);
      hit.setAttribute("cx", pos.x);
      hit.setAttribute("cy", pos.y);
      hit.setAttribute("r", hitR);
      hit.setAttribute("fill", "transparent");
      hit.setAttribute("stroke", "transparent");
      hit.setAttribute("pointer-events", "fill");
      group.insertBefore(hit, group.firstChild);

      // Drag & drop (uniquement séq 0 comme avant)
      let dragging = false, startX=0, startY=0, origX=pos.x, origY=pos.y, moved=false, lastPos={x:pos.x,y:pos.y};
      const dragThreshold = 4;
      const visualOffset = {x:0, y:-8};

      const endDrag = (ev) => {
        if (!dragging) return;
        dragging = false;
        if (group.releasePointerCapture && ev && ev.pointerId != null) {
          try { group.releasePointerCapture(ev.pointerId); } catch(e){}
        }
        unlockFieldScroll();
        if (moved && currentSeq === 0) {
          updatePlayerRenderPosition(i, lastPos.x, lastPos.y, {w,h,r,style,img,circle,label,hit});
          simulations[currentSim].initialPositions[i] = { x: lastPos.x, y: lastPos.y };
          saveSimulations();
        } else {
          updatePlayerRenderPosition(i, origX, origY, {w,h,r,style,img,circle,label,hit});
        }
      };

      group.addEventListener("pointerdown", e => {
        if (interactionMode !== MODE_EDITION) return;
        if (annotationMode) {
          if (analysisTool==="surbrillance"){ addHighlightForPlayer(i); }
          else if (analysisTool==="connect"){ addConnectForPlayer(i); }
          return;
        }
        if (interactionTool !== TOOL_MOVE) return;
        if (currentSeq !== 0) return; // cohérent avec version précédente
        if (e.button !== undefined && e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        dragging = true; moved = false;
        const current = getPlayerRenderXY(i, {w,h,r,style,img,circle});
        origX = current.x; origY = current.y;
        startX = e.clientX; startY = e.clientY; lastPos = {x:origX, y:origY};
        lockFieldScroll();
        if (group.setPointerCapture && e.pointerId != null) {
          try { group.setPointerCapture(e.pointerId); } catch(err){}
        }
      });

      group.addEventListener("pointermove", e => {
        if (!dragging) return;
        // Protection contre déplacement accidentel : attendre le délai et vérifier qu'il n'y a pas de 2e doigt
        if (!isDragAllowedAfterDelay()) {
          // Si un 2e doigt est détecté, annuler le drag en cours
          if (isTwoFingerTouch) {
            dragging = false;
            unlockFieldScroll();
          }
          return;
        }
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < dragThreshold) return;
        moved = true;
        const nx = origX + dx, ny = origY + dy;
        lastPos = {x: nx, y: ny};
        updatePlayerRenderPosition(i, nx, ny, {w,h,r,style,img,circle,label,hit}, { visualOffset });
      });

      group.addEventListener("pointerup", endDrag);
      group.addEventListener("pointercancel", endDrag);

      svg.appendChild(group);
      players.push({ group, img, circle, label, style, w, h, r, hit });
    });

    drawArrows();
    drawBall();
  }

  function getPlayerRenderXY(index, meta){
    if (meta && meta.style==="rond" && meta.circle){
      return { x: parseFloat(meta.circle.getAttribute("cx")), y: parseFloat(meta.circle.getAttribute("cy")) };
    }
    if (meta && meta.img){
      const x = parseFloat(meta.img.getAttribute("x"));
      const y = parseFloat(meta.img.getAttribute("y"));
      return { x: x + (meta.w/2), y: y + (meta.h*0.72) };
    }
    // fallback depuis players[]
    const p = players[index]; if (!p) return {x:0,y:0};
    if (p.style==="rond" && p.circle) return { x: parseFloat(p.circle.getAttribute("cx")), y: parseFloat(p.circle.getAttribute("cy")) };
    if (p.img) { const x = parseFloat(p.img.getAttribute("x")); const y = parseFloat(p.img.getAttribute("y")); return { x: x+(p.w/2), y:y+(p.h*0.72) }; }
    return {x:0,y:0};
  }

  function updatePlayerRenderPosition(index, nx, ny, meta=null, opts={}){
    const p = meta || players[index]; if (!p) return;
    const offX = opts.visualOffset?.x || 0;
    const offY = opts.visualOffset?.y || 0;
    const rx = nx + offX;
    const ry = ny + offY;
    if (p.style==="rond" && p.circle){
      p.circle.setAttribute("cx", rx); p.circle.setAttribute("cy", ry);
      if (p.label){
        const ly = ry - (p.r+8);
        p.label.setAttribute("x", rx); p.label.setAttribute("y", ly);
      }
    } else if (p.img){
      p.img.setAttribute("x", rx - p.w/2);
      p.img.setAttribute("y", ry - (p.h*0.72));
      if (p.label){
        const ly = ry - (p.h*0.86);
        p.label.setAttribute("x", rx); p.label.setAttribute("y", ly);
      }
    }
    if (p.hit){
      p.hit.setAttribute("cx", rx); p.hit.setAttribute("cy", ry);
    }
  }

  // Positions au début de la séquence (pour jouer/éditer)
  function getPositionsAtSequenceStart(seqIndex) {
    let positions = JSON.parse(JSON.stringify(simulations[currentSim].initialPositions || []));
    for (let i = 0; i < seqIndex; i++) {
      const arrows = simulations[currentSim].sequences[i].arrows || [];
      for (let arrow of arrows) {
        if ((arrow.type === "move_player" || arrow.type === "dribble") &&
            arrow.playerIndex != null && positions[arrow.playerIndex]) {
          positions[arrow.playerIndex] = { x: arrow.x2, y: arrow.y2 };
        }
      }
    }
    return positions;
  }

  // Position du ballon à la FIN de la séquence seqIndex
  function getBallPositionForSequence(seqIndex) {
    const seqs = simulations[currentSim].sequences || [];
    if (!seqs.length) return {x:450, y:300};
    const seq = seqs[seqIndex];

    // si déjà calculé / joué
    if (seq && seq.ballPosFinal && seq.ballPosFinal.x!=null) return { x: seq.ballPosFinal.x, y: seq.ballPosFinal.y };

    // base = fin de la séquence précédente (ou pos init)
    let base = (seqIndex===0) ? (seq.ballPos && seq.ballPos.x!=null ? {x:seq.ballPos.x,y:seq.ballPos.y} : {x:450,y:300})
                              : getBallPositionForSequence(seqIndex-1);

    // appliquer la dernière flèche "ballon" de cette séquence
    const arr = (seq.arrows||[]);
    const lastBall = [...arr].filter(a=>["pass_ground","pass_air","shoot_ground","shoot_air","dribble"].includes(a.type)).slice(-1)[0];
    if (lastBall) base = { x: lastBall.x2, y: lastBall.y2 };

    return base;
  }

  function getColorByType(type) {
    switch (type) {
      case "pass_ground": return "#f4d03f";
      case "pass_air":    return "#2874a6";
      case "shoot_ground":return "#27ae60";
      case "shoot_air":   return "#c0392b";
      case "move_player": return "#7d3c98";
      case "dribble":     return "#229954";
      default:            return "#333";
    }
  }

  // Flèches (clic droit pour créer) + Annotations (clic gauche si activées)
  svg.addEventListener("contextmenu", e => e.preventDefault());

  function getCurrentBallPosition(){
    if (customBallPos && currentSeq !== 0) return customBallPos;
    if (currentSeq === 0 && simulations[currentSim].sequences[0].ballPos) return simulations[currentSim].sequences[0].ballPos;
    return getBallPositionForSequence(currentSeq);
  }

  function startArrowDrawing(e) {
    if (interactionMode !== MODE_EDITION) return;
    if (interactionTool !== TOOL_ARROW) return;
    if (e.button !== undefined && e.pointerType === "mouse" && e.button !== 0 && e.button !== 2) return;
    const rect = svg.getBoundingClientRect();
    const pointerStartX = e.clientX - rect.left;
    const pointerStartY = e.clientY - rect.top;
    const positions = getPositionsAtSequenceStart(currentSeq);
    const ballPos = getCurrentBallPosition();

    let nearest = null, minDist = Infinity;
    positions.forEach((pos, idx) => {
      const dist = Math.hypot(pos.x - pointerStartX, pos.y - pointerStartY);
      if (dist < minDist) { minDist = dist; nearest = idx; }
    });
    const playerHit = (minDist <= 30) ? { index: nearest, dist: minDist } : null;
    const ballDist = ballPos ? Math.hypot(ballPos.x - pointerStartX, ballPos.y - pointerStartY) : Infinity;
    const ballHit = ballDist <= 26 ? { pos: ballPos, dist: ballDist } : null;

    let startKind = null; // "player" | "ball"
    let playerIndex = null;
    if (playerHit && (!ballHit || playerHit.dist <= ballHit.dist)) {
      startKind = "player"; playerIndex = playerHit.index;
    } else if (ballHit) {
      startKind = "ball";
    }

    if (!startKind) return; // pas de source valide => aucun début de flèche

    e.preventDefault();
    ensureArrowHeadMarker();
    lockFieldScroll();

    const pointerId = e.pointerId;
    if (svg.setPointerCapture && pointerId != null) {
      try { svg.setPointerCapture(pointerId); } catch(err){}
    }

    const startPos = startKind === "player" ? positions[playerIndex] : ballPos;
    const startX = startPos.x;
    const startY = startPos.y;

    const selectType = document.getElementById("arrow-type-select");
    const seqForPreset = simulations[currentSim]?.sequences?.[currentSeq];
    const presets = seqForPreset ? ensureArrowPresetsForSequence(seqForPreset) : [];
    const presetType = (playerIndex != null && presets[playerIndex]) ? presets[playerIndex].type : null;
    const arrowType = presetType || (selectType ? selectType.value : "move_player");
    const color = getColorByType(arrowType);

    let currentLine = document.createElementNS(svg.namespaceURI, "line");
    currentLine.setAttribute("x1", playerIndex != null ? positions[playerIndex].x : startX);
    currentLine.setAttribute("y1", playerIndex != null ? positions[playerIndex].y : startY);
    currentLine.setAttribute("x2", startX);
    currentLine.setAttribute("y2", startY);
    currentLine.setAttribute("stroke", color);
    currentLine.setAttribute("stroke-width", "3");
    currentLine.setAttribute("marker-end", "url(#arrowhead)");
    currentLine.classList.add("arrow");
    svg.appendChild(currentLine);

    let hasMoved = false;
    const moveThreshold = 4;

    function cleanup(ev){
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      if (svg.releasePointerCapture && pointerId != null) {
        try { svg.releasePointerCapture(pointerId); } catch(err){}
      }
      unlockFieldScroll();
    }

    function onMove(ev) {
      if (pointerId != null && ev.pointerId !== pointerId) return;
      // Protection contre création accidentelle : attendre le délai et vérifier qu'il n'y a pas de 2e doigt
      if (!isDragAllowedAfterDelay()) {
        if (isTwoFingerTouch) {
          // Annuler la création de flèche si 2 doigts détectés
          currentLine.remove();
          cleanup(ev);
        }
        return;
      }
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      currentLine.setAttribute("x2", x);
      currentLine.setAttribute("y2", y);
      if (!hasMoved && Math.hypot(x - pointerStartX, y - pointerStartY) >= moveThreshold) hasMoved = true;
    }
    function onEnd(ev) {
      if (pointerId != null && ev.pointerId !== pointerId) return;
      cleanup(ev);
      const endX = ev.clientX - rect.left;
      const endY = ev.clientY - rect.top;
      if (!hasMoved && Math.hypot(endX - pointerStartX, endY - pointerStartY) < moveThreshold) {
        currentLine.remove();
        return;
      }
      const seq = simulations[currentSim].sequences[currentSeq];
      if (!seq.arrows) seq.arrows = [];

      const presets = ensureArrowPresetsForSequence(seq);
      const basePreset = (playerIndex != null && presets[playerIndex]) ? presets[playerIndex] : { vitesse: 900, phase: 0, delayMs: 0 };

      if (playerIndex != null) {
        const idx = seq.arrows.findIndex(a => a.playerIndex === playerIndex);
        if (idx !== -1) seq.arrows.splice(idx, 1);
        presets[playerIndex] = presets[playerIndex] || { vitesse: 900, phase: 0, delayMs: 0 };
      }

      seq.arrows.push({
        x1: playerIndex != null ? positions[playerIndex].x : startX,
        y1: playerIndex != null ? positions[playerIndex].y : startY,
        x2: endX, y2: endY,
        type: arrowType,
        playerIndex,
        vitesse: clampNumber(basePreset.vitesse, 200, 6000, 900),
        phase: clampNumber(basePreset.phase, 0, 99, 0),
        delayMs: clampNumber(basePreset.delayMs, 0, 5000, 0)
      });
      saveSimulations();
      drawArrows(); drawBall(); drawPlayerConfigUI();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
  }

  function handleAnnotationPointer(e) {
    if (interactionMode !== MODE_EDITION) return false;
    if (annotationMode && (e.button === 0 || e.pointerType === "touch" || e.pointerType === "pen")) {
      e.preventDefault();
      handleAnnotationMouseDown(e);
      return true;
    }
    return false;
  }

  svg.addEventListener("pointerdown", function (e) {
    console.log("[DEBUG SVG] pointerdown - target:", e.target.tagName, "classes:", e.target.className);
    console.log("[DEBUG SVG] Mode:", mode, "InteractionMode:", interactionMode, "Tool:", interactionTool);
    console.log("[DEBUG SVG] svg.style.touchAction:", svg.style.touchAction);
    if (mode !== "tactic") { console.log("[DEBUG] Bloqué: mode !== tactic"); return; }
    if (interactionMode !== MODE_EDITION) { console.log("[DEBUG] Bloqué: pas en mode édition - OK pour popup"); return; }
    if (handleAnnotationPointer(e)) { console.log("[DEBUG] Bloqué: annotation"); return; }
    if (interactionTool !== TOOL_ARROW) { console.log("[DEBUG] Bloqué: outil != flèche"); return; }
    // Ne pas démarrer une nouvelle flèche si on tape sur une flèche existante
    const target = e.target;
    if (target.classList.contains("arrow") ||
        target.classList.contains("arrow-hit") ||
        target.classList.contains("arrow-hit-end")) {
      console.log("[DEBUG] Tap sur flèche existante - ne pas créer nouvelle flèche");
      return; // Laisser le click/touchend gérer le popup
    }
    console.log("[DEBUG] Démarrage création nouvelle flèche");
    startArrowDrawing(e);
  });

  /* ======= ANNOTATIONS AVANCÉES ======= */
  function ensureAnalysisMarkers(){
    let defs = svg.querySelector("defs"); if (!defs){ defs=document.createElementNS(svg.namespaceURI,"defs"); svg.insertBefore(defs, svg.firstChild); }
    if (!svg.querySelector("#ann-arrowhead")){
      const marker = document.createElementNS(svg.namespaceURI,"marker");
      marker.setAttribute("id","ann-arrowhead");
      marker.setAttribute("markerWidth","10"); marker.setAttribute("markerHeight","6");
      marker.setAttribute("refX","8"); marker.setAttribute("refY","3"); marker.setAttribute("orient","auto");
      marker.setAttribute("markerUnits","strokeWidth");
      const path = document.createElementNS(svg.namespaceURI,"path");
      path.setAttribute("d","M0,0 L10,3 L0,6 L2,3 Z");
      path.setAttribute("fill","#222");
      marker.appendChild(path); defs.appendChild(marker);
    }
  }

  function nextAnnId(){ return _annIdCounter++; }

  function handleAnnotationMouseDown(e){
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const seq = simulations[currentSim].sequences[currentSeq];
    if (!seq.annotations) seq.annotations = [];

    switch(analysisTool){
      case "libre": return startAnnotationStroke(e);
      case "cercle": return startDrawShape(e, "circle");
      case "rectangle": return startDrawShape(e, "rect");
      case "fleche": return startDrawDashedArrow(e);
      case "texte": return placeTextAt(x,y);
      case "select": /* la sélection se fait au clic sur objets */ return;
      case "surbrillance": /* gérée au clic joueur */ return;
      case "connect": /* gérée au clic joueur */ return;
    }
  }

  function startAnnotationStroke(e){
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const seq = simulations[currentSim].sequences[currentSeq];
    if (!seq.annotations) seq.annotations = [];
    const stroke = { id: nextAnnId(), kind:"free", color: annotationColor, width: annotationWidth, points: [{x,y}] };
    seq.annotations.push(stroke); saveSimulations();

    _annotTempPath = document.createElementNS(svg.namespaceURI, "path");
    _annotTempPath.setAttribute("fill", "none");
    _annotTempPath.setAttribute("stroke", stroke.color);
    _annotTempPath.setAttribute("stroke-width", stroke.width);
    _annotTempPath.setAttribute("stroke-linecap", "round");
    _annotTempPath.setAttribute("stroke-linejoin", "round");
    _annotTempPath.classList.add("ks-annot-path","ks-layer");
    _annotTempPath.dataset.annId = stroke.id;
    _annotTempPath.setAttribute("d", `M ${x} ${y}`);
    svg.appendChild(_annotTempPath);

    const moveEvt = e.pointerType ? "pointermove" : "mousemove";
    const upEvt = e.pointerType ? "pointerup" : "mouseup";

    function onMove(ev){
      const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
      stroke.points.push({x: mx, y: my});
      _annotTempPath.setAttribute("d", _annotTempPath.getAttribute("d") + ` L ${mx} ${my}`);
    }
    function onUp(){
      window.removeEventListener(moveEvt, onMove);
      window.removeEventListener(upEvt, onUp);
      _annotTempPath = null; saveSimulations();
    }
    window.addEventListener(moveEvt, onMove);
    window.addEventListener(upEvt, onUp);
  }

  function startDrawShape(e, kind){
    const rect = svg.getBoundingClientRect();
    const x0 = e.clientX - rect.left, y0 = e.clientY - rect.top;
    const seq = simulations[currentSim].sequences[currentSeq];
    const ann = { id: nextAnnId(), kind, color: annotationColor, width: annotationWidth, x:x0, y:y0, w:0, h:0 };
    seq.annotations.push(ann); saveSimulations();

    let node;
    if (kind==="rect"){
      node = document.createElementNS(svg.namespaceURI,"rect");
      node.setAttribute("x", x0); node.setAttribute("y", y0);
      node.setAttribute("width", 0); node.setAttribute("height", 0);
      node.setAttribute("fill","rgba(0,0,0,0)");
      node.setAttribute("stroke", ann.color);
      node.setAttribute("stroke-width", ann.width);
    } else { // circle
      node = document.createElementNS(svg.namespaceURI,"ellipse");
      node.setAttribute("cx", x0); node.setAttribute("cy", y0);
      node.setAttribute("rx", 0); node.setAttribute("ry", 0);
      node.setAttribute("fill","rgba(0,0,0,0)");
      node.setAttribute("stroke", ann.color);
      node.setAttribute("stroke-width", ann.width);
    }
    node.classList.add("ks-layer");
    node.dataset.annId = ann.id;
    svg.appendChild(node);

    const moveEvt = e.pointerType ? "pointermove" : "mousemove";
    const upEvt = e.pointerType ? "pointerup" : "mouseup";

    function onMove(ev){
      const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      ann.w = x - x0; ann.h = y - y0;
      if (kind==="rect"){
        node.setAttribute("x", Math.min(x0,x));
        node.setAttribute("y", Math.min(y0,y));
        node.setAttribute("width", Math.abs(ann.w));
        node.setAttribute("height", Math.abs(ann.h));
      } else {
        node.setAttribute("cx", (x0 + x)/2);
        node.setAttribute("cy", (y0 + y)/2);
        node.setAttribute("rx", Math.abs(ann.w)/2);
        node.setAttribute("ry", Math.abs(ann.h)/2);
      }
    }
    function onUp(){
      window.removeEventListener(moveEvt, onMove);
      window.removeEventListener(upEvt, onUp);
      attachAnnInteractions(node, ann);
      saveSimulations();
    }
    window.addEventListener(moveEvt, onMove);
    window.addEventListener(upEvt, onUp);
  }

  function startDrawDashedArrow(e){
    const rect = svg.getBoundingClientRect();
    const x0 = e.clientX - rect.left, y0 = e.clientY - rect.top;
    const seq = simulations[currentSim].sequences[currentSeq];
    const ann = { id: nextAnnId(), kind:"dashed_arrow", color: "#222", width: Math.max(2, annotationWidth), x1:x0, y1:y0, x2:x0, y2:y0 };
    seq.annotations.push(ann); saveSimulations();

    const node = document.createElementNS(svg.namespaceURI,"line");
    node.dataset.annId = ann.id;
    node.classList.add("ks-layer");
    node.setAttribute("x1", ann.x1); node.setAttribute("y1", ann.y1);
    node.setAttribute("x2", ann.x2); node.setAttribute("y2", ann.y2);
    node.setAttribute("stroke", ann.color);
    node.setAttribute("stroke-width", ann.width);
    node.setAttribute("stroke-dasharray","6,6");
    node.setAttribute("marker-end","url(#ann-arrowhead)");
    svg.appendChild(node);

    const moveEvt = e.pointerType ? "pointermove" : "mousemove";
    const upEvt = e.pointerType ? "pointerup" : "mouseup";

    function onMove(ev){
      const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
      ann.x2 = x; ann.y2 = y;
      node.setAttribute("x2", x); node.setAttribute("y2", y);
    }
    function onUp(){
      window.removeEventListener(moveEvt, onMove);
      window.removeEventListener(upEvt, onUp);
      attachAnnInteractions(node, ann);
      saveSimulations();
    }
    window.addEventListener(moveEvt, onMove);
    window.addEventListener(upEvt, onUp);
  }

  function placeTextAt(x,y){
    const seq = simulations[currentSim].sequences[currentSeq];
    const txt = prompt("Texte à afficher :", "");
    if (txt===null) return;
    const ann = { id: nextAnnId(), kind:"text", color: annotationColor, x, y, text: txt };
    seq.annotations.push(ann); saveSimulations();
    drawAnnotations();
  }

  function addHighlightForPlayer(i){
    const seq = simulations[currentSim].sequences[currentSeq];
    const ann = { id: nextAnnId(), kind:"highlight", color: "#ffd400", playerIndex:i, width: 4 };
    seq.annotations.push(ann); saveSimulations(); drawAnnotations();
  }
  function addConnectForPlayer(i){
    _connectBuffer.push(i);
    if (_connectBuffer.length>=2){
      const a = _connectBuffer[_connectBuffer.length-2];
      const b = _connectBuffer[_connectBuffer.length-1];
      const seq = simulations[currentSim].sequences[currentSeq];
      const ann = { id: nextAnnId(), kind:"connect", color:"#00aaee", width:2, pair:[a,b] };
      seq.annotations.push(ann); saveSimulations(); drawAnnotations();
    }
  }

  function attachAnnInteractions(node, ann){
    node.addEventListener("mousedown", ev=>{
      if (!annotationMode) return;
      if (analysisTool!=="select") return;
      ev.stopPropagation();
      _selectedAnn = ann.id;
      svg.querySelectorAll(".selected-ann").forEach(n=>n.classList.remove("selected-ann"));
      node.classList.add("selected-ann");

      // drag
      let dragging=false, startX=ev.clientX, startY=ev.clientY;
      function onMove(e2){
        if (!dragging){ dragging=true; }
        const dx = e2.clientX - startX, dy = e2.clientY - startY;
        startX = e2.clientX; startY = e2.clientY;

        switch(ann.kind){
          case "free":
            ann.points.forEach(p=>{ p.x += dx; p.y += dy; });
            node.setAttribute("d", `M ${ann.points[0].x} ${ann.points[0].y}` + ann.points.slice(1).map(p=>` L ${p.x} ${p.y}`).join(""));
            break;
          case "rect":
            ann.x += dx; ann.y += dy;
            node.setAttribute("x", ann.x); node.setAttribute("y", ann.y);
            break;
          case "circle":
            ann.x += dx; ann.y += dy;
            node.setAttribute("cx", ann.x + ann.w/2); node.setAttribute("cy", ann.y + ann.h/2);
            break;
          case "dashed_arrow":
            ann.x1 += dx; ann.y1 += dy; ann.x2 += dx; ann.y2 += dy;
            node.setAttribute("x1", ann.x1); node.setAttribute("y1", ann.y1);
            node.setAttribute("x2", ann.x2); node.setAttribute("y2", ann.y2);
            break;
          case "text":
            ann.x += dx; ann.y += dy;
            node.setAttribute("x", ann.x); node.setAttribute("y", ann.y);
            break;
        }
      }
      function onUp(){
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        saveSimulations();
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    if (ann.kind==="text"){
      node.addEventListener("dblclick", ev=>{
        ev.stopPropagation();
        const nv = prompt("Modifier le texte :", ann.text||"") ;
        if (nv===null) return;
        ann.text = nv; node.textContent = nv; saveSimulations();
      });
    }
  }

  function deleteSelection(){
    if (!_selectedAnn) return;
    const seq = simulations[currentSim].sequences[currentSeq];
    const idx = seq.annotations.findIndex(a=>a.id===_selectedAnn);
    if (idx!==-1){ seq.annotations.splice(idx,1); saveSimulations(); drawAnnotations(); }
    _selectedAnn = null;
  }
  function clearAnnotations(){
    const seq = simulations[currentSim].sequences[currentSeq];
    if (!seq || !seq.annotations || !seq.annotations.length) return;
    if (!confirm("Effacer toutes les annotations de cette séquence ?")) return;
    seq.annotations = []; saveSimulations(); drawAnnotations();
  }

  function drawAnnotations(){
    svg.querySelectorAll(".ks-annot-path, .ann-shape, .ann-connect, .ann-highlight, .ann-text-node, .ann-arrow-dashed").forEach(n=>n.remove());
    const seq = simulations[currentSim]?.sequences?.[currentSeq];
    if (!seq || !seq.annotations) return;
    const scale = getDisplay().playerScale||0.8;

    seq.annotations.forEach(st=>{
      let node=null;
      switch(st.kind){
        case "free":{
          node = document.createElementNS(svg.namespaceURI, "path");
          node.setAttribute("fill","none");
          node.setAttribute("stroke", st.color||"#ff3b30");
          node.setAttribute("stroke-width", st.width||3);
          node.setAttribute("stroke-linecap","round");
          node.setAttribute("stroke-linejoin","round");
          if (st.points && st.points.length){
            let d = `M ${st.points[0].x} ${st.points[0].y}`;
            for (let i=1;i<st.points.length;i++) d += ` L ${st.points[i].x} ${st.points[i].y}`;
            node.setAttribute("d", d);
          }
          node.classList.add("ks-annot-path","ann-shape","ks-layer");
          break;
        }
        case "rect":{
          node = document.createElementNS(svg.namespaceURI,"rect");
          node.setAttribute("x", Math.min(st.x, st.x+st.w));
          node.setAttribute("y", Math.min(st.y, st.y+st.h));
          node.setAttribute("width", Math.abs(st.w));
          node.setAttribute("height", Math.abs(st.h));
          node.setAttribute("fill","rgba(0,0,0,0)");
          node.setAttribute("stroke", st.color||annotationColor);
          node.setAttribute("stroke-width", st.width||2);
          node.classList.add("ann-shape","ks-layer");
          break;
        }
        case "circle":{
          node = document.createElementNS(svg.namespaceURI,"ellipse");
          node.setAttribute("cx", st.x + st.w/2); node.setAttribute("cy", st.y + st.h/2);
          node.setAttribute("rx", Math.abs(st.w)/2); node.setAttribute("ry", Math.abs(st.h)/2);
          node.setAttribute("fill","rgba(0,0,0,0)");
          node.setAttribute("stroke", st.color||annotationColor);
          node.setAttribute("stroke-width", st.width||2);
          node.classList.add("ann-shape","ks-layer");
          break;
        }
        case "dashed_arrow":{
          node = document.createElementNS(svg.namespaceURI,"line");
          node.setAttribute("x1", st.x1); node.setAttribute("y1", st.y1);
          node.setAttribute("x2", st.x2); node.setAttribute("y2", st.y2);
          node.setAttribute("stroke", st.color||"#222");
          node.setAttribute("stroke-width", st.width||3);
          node.setAttribute("stroke-dasharray","6,6");
          node.setAttribute("marker-end","url(#ann-arrowhead)");
          node.classList.add("ann-arrow-dashed","ks-layer");
          break;
        }
        case "text":{
          node = document.createElementNS(svg.namespaceURI,"text");
          node.setAttribute("x", st.x); node.setAttribute("y", st.y);
          node.setAttribute("fill", st.color||annotationColor);
          node.setAttribute("font-size","14");
          node.setAttribute("font-weight","700");
          node.classList.add("ann-text-node","ann-text","ks-layer");
          node.textContent = st.text || "";
          break;
        }
        case "highlight":{
          const pos = getPositionsAtSequenceStart(currentSeq)[st.playerIndex] || {x:0,y:0};
          const r = Math.round(28 * scale);
          node = document.createElementNS(svg.namespaceURI,"circle");
          node.setAttribute("cx", pos.x); node.setAttribute("cy", pos.y);
          node.setAttribute("r", r);
          node.setAttribute("fill","rgba(0,0,0,0)");
          node.setAttribute("stroke", st.color||"#ffd400");
          node.setAttribute("stroke-width", st.width||4);
          node.classList.add("ann-highlight");
          break;
        }
        case "connect":{
          const p = getPositionsAtSequenceStart(currentSeq);
          const a = p[st.pair[0]]; const b = p[st.pair[1]];
          if (!a||!b) return;
          node = document.createElementNS(svg.namespaceURI,"line");
          node.setAttribute("x1", a.x); node.setAttribute("y1", a.y);
          node.setAttribute("x2", b.x); node.setAttribute("y2", b.y);
          node.setAttribute("stroke", st.color||"#00aaee");
          node.setAttribute("stroke-width", st.width||2);
          node.classList.add("ann-connect");
          break;
        }
      }
      if (!node) return;
      node.dataset.annId = st.id;
      svg.appendChild(node);

      // interactions (sélection/déplacement) pour les types pertinents
      if (["free","rect","circle","dashed_arrow","text"].includes(st.kind)){
        attachAnnInteractions(node, st);
      }
    });
  }

  // ====== Flèches visibles (+ zones de clic + badge de phase) ======
  const ARROW_TAP_MAX_MOVEMENT = 10;
  const ARROW_TAP_MAX_DURATION = 400;
  const arrowTapState = { pointerId: null, startX: 0, startY: 0, startTime: 0, target: null };

  function isArrowTarget(el) {
    return !!el && (el.classList?.contains("arrow") || el.classList?.contains("arrow-hit") || el.classList?.contains("arrow-hit-end"));
  }

  function resetArrowTap() {
    arrowTapState.pointerId = null;
    arrowTapState.target = null;
  }

  svg.addEventListener("pointerdown", (e) => {
    if (!isArrowTarget(e.target)) { resetArrowTap(); return; }
    if (!e.isPrimary || (e.button !== undefined && e.button !== 0)) { resetArrowTap(); return; }
    if (isTwoFingerTouch) { resetArrowTap(); return; }
    arrowTapState.pointerId = e.pointerId;
    arrowTapState.startX = e.clientX;
    arrowTapState.startY = e.clientY;
    arrowTapState.startTime = performance.now ? performance.now() : Date.now();
    arrowTapState.target = e.target;
  });

  svg.addEventListener("pointermove", (e) => {
    if (arrowTapState.pointerId === null || e.pointerId !== arrowTapState.pointerId) return;
    if (isTwoFingerTouch) { resetArrowTap(); return; }
    if (Math.hypot(e.clientX - arrowTapState.startX, e.clientY - arrowTapState.startY) > ARROW_TAP_MAX_MOVEMENT) {
      resetArrowTap();
    }
  });

  svg.addEventListener("pointerup", (e) => {
    if (arrowTapState.pointerId === null || e.pointerId !== arrowTapState.pointerId) { resetArrowTap(); return; }
    const elapsed = (performance.now ? performance.now() : Date.now()) - arrowTapState.startTime;
    const idx = arrowTapState.target ? arrowTapState.target.dataset.arrowIndex : null;
    resetArrowTap();
    if (elapsed > ARROW_TAP_MAX_DURATION || isTwoFingerTouch) return;
    if (idx == null) return;
    const arrows = (simulations[currentSim]?.sequences?.[currentSeq]?.arrows) || [];
    const arrow = arrows[Number(idx)];
    if (!arrow) return;
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    showArrowPopup(arrow, Number(idx), e.clientX, e.clientY);
  });

  svg.addEventListener("pointercancel", resetArrowTap);

  function drawArrows() {
    svg.querySelectorAll("line.arrow, line.arrow-hit, circle.arrow-hit-end, g.phase-badge").forEach(l => l.remove());
    if (!arrowsVisible) return;

    ensureArrowHeadMarker();

    const arrs = simulations[currentSim].sequences[currentSeq].arrows || [];
    const positions = getPositionsAtSequenceStart(currentSeq);
    arrs.forEach((item, index) => {
      const x1 = item.playerIndex != null ? positions[item.playerIndex].x : item.x1;
      const y1 = item.playerIndex != null ? positions[item.playerIndex].y : item.y1;
      const x2 = item.x2, y2 = item.y2;

      // Debug: détecter tout contact sur les flèches
      const debugTouch = (e) => {
        console.log("[DEBUG ARROW] Event:", e.type, "sur", e.target.className, "pointerType:", e.pointerType || "N/A");
      };

      // Ligne visible
      const line = document.createElementNS(svg.namespaceURI, "line");
      line.classList.add("arrow");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", getColorByType(item.type));
      line.setAttribute("stroke-width", 3);
      line.setAttribute("marker-end", "url(#arrowhead)");
      line.dataset.arrowIndex = index;
      line.addEventListener("pointerdown", debugTouch);
      line.addEventListener("pointerup", debugTouch);
      svg.appendChild(line);

      // Zone de clic large (plus facile à taper sur mobile)
      const hit = document.createElementNS(svg.namespaceURI, "line");
      hit.classList.add("arrow-hit");
      hit.setAttribute("x1", x1); hit.setAttribute("y1", y1);
      hit.setAttribute("x2", x2); hit.setAttribute("y2", y2);
      hit.setAttribute("stroke", "rgba(0,0,0,0)");
      hit.setAttribute("stroke-width", 24); // Augmenté pour mobile
      hit.setAttribute("pointer-events", "stroke");
      hit.dataset.arrowIndex = index;
      hit.addEventListener("pointerdown", debugTouch);
      hit.addEventListener("pointerup", debugTouch);
      svg.appendChild(hit);

      // Zone de clic sur la pointe (agrandie pour mobile)
      const head = document.createElementNS(svg.namespaceURI, "circle");
      head.classList.add("arrow-hit-end");
      head.setAttribute("cx", x2); head.setAttribute("cy", y2);
      head.setAttribute("r", 18); // Augmenté de 12 à 18 pour mobile
      head.setAttribute("fill", "rgba(0,0,0,0)");
      head.setAttribute("pointer-events", "all");
      head.dataset.arrowIndex = index;
      head.addEventListener("pointerdown", debugTouch);
      head.addEventListener("pointerup", debugTouch);
      svg.appendChild(head);

      // Badge de phase (numéro)
      const ph = (typeof item.phase === "number" ? item.phase : 0);
      const dx = x2 - x1, dy = y2 - y1;
      const mx = x1 + dx * 0.5, my = y1 + dy * 0.5;
      const len = Math.hypot(dx, dy) || 1;
      const ox = (-dy / len) * 12, oy = (dx / len) * 12;
      const bx = mx + ox, by = my + oy;

      const badge = document.createElementNS(svg.namespaceURI, "g");
      badge.classList.add("phase-badge");
      badge.setAttribute("transform", `translate(${bx},${by})`);
      badge.setAttribute("pointer-events", "none");

      const circle = document.createElementNS(svg.namespaceURI, "circle");
      circle.setAttribute("r", 9);
      circle.setAttribute("fill", "#111");
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", "2");
      badge.appendChild(circle);

      const text = document.createElementNS(svg.namespaceURI, "text");
      text.setAttribute("x", 0); text.setAttribute("y", 4);
      text.setAttribute("text-anchor", "middle");
      text.textContent = String(ph);
      badge.appendChild(text);

      svg.appendChild(badge);
    });
  }

  function ensureArrowHeadMarker() {
    let defs = svg.querySelector("defs");
    if (!defs) { defs = document.createElementNS(svg.namespaceURI, "defs"); svg.insertBefore(defs, svg.firstChild); }
    if (!svg.querySelector("#arrowhead")) {
      const marker = document.createElementNS(svg.namespaceURI, "marker");
      marker.setAttribute("id", "arrowhead");
      marker.setAttribute("markerWidth", "13");
      marker.setAttribute("markerHeight", "8");
      marker.setAttribute("refX", "11");
      marker.setAttribute("refY", "4");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "strokeWidth");
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", "M0,0 L13,4 L0,8 L2,4 Z");
      path.setAttribute("fill", "#f4d03f");
      marker.appendChild(path);
      defs.appendChild(marker);
    }
  }

  // Balle
  function drawBall(ballPos = null) {
    svg.querySelectorAll(".kas-ball-group").forEach(e => e.remove());
    let pos;
    if (customBallPos && currentSeq !== 0) pos = customBallPos;
    else if (currentSeq === 0 && simulations[currentSim].sequences[0].ballPos) pos = simulations[currentSim].sequences[0].ballPos;
    else pos = getBallPositionForSequence(currentSeq);
    if (ballPos) pos = ballPos;

    const group = document.createElementNS(svg.namespaceURI, "g");
    group.classList.add("kas-ball-group");

    const hit = document.createElementNS(svg.namespaceURI, "circle");
    hit.setAttribute("r", 22);
    hit.setAttribute("fill", "transparent");
    hit.setAttribute("pointer-events", "fill");
    group.appendChild(hit);

    const img = document.createElementNS(svg.namespaceURI, "image");
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", pluginUrl + "assets/" + ballSprite);
    img.setAttribute("width", 28);
    img.setAttribute("height", 28);
    img.classList.add("ballon");
    img.style.cursor = "pointer";
    group.appendChild(img);
    svg.appendChild(group);

    function applyBallRender(x, y, { visualOffset } = {}){
      const off = visualOffset || {x:0, y:0};
      hit.setAttribute("cx", x);
      hit.setAttribute("cy", y);
      img.setAttribute("x", x - 14 + off.x);
      img.setAttribute("y", y - 14 + off.y);
    }

    applyBallRender(pos.x, pos.y);

    let draggingBall = false, moved = false, startX = 0, startY = 0, orig = { ...pos }, lastPos = { ...pos };
    const dragThreshold = 4;
    const visualOffset = {x:0, y:-6};

    const endDrag = (ev) => {
      if (!draggingBall) return;
      draggingBall = false;
      if (group.releasePointerCapture && ev && ev.pointerId != null) {
        try { group.releasePointerCapture(ev.pointerId); } catch(err){}
      }
      unlockFieldScroll();
      if (moved && currentSeq === 0) {
        simulations[currentSim].sequences[0].ballPos = { x: lastPos.x, y: lastPos.y };
        saveSimulations();
      } else if (moved) {
        customBallPos = { x: lastPos.x, y: lastPos.y };
      } else {
        applyBallRender(orig.x, orig.y);
      }
      if (!moved && currentSeq !== 0) customBallPos = null;
    };

    group.addEventListener("pointerdown", function (e) {
      if (interactionMode !== MODE_EDITION) return;
      if (annotationMode) return;
      if (interactionTool !== TOOL_MOVE) return;
      if (currentSeq !== 0) return; // cohérent avec le déplacement joueurs actuel
      if (e.button !== undefined && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      draggingBall = true; moved = false;
      orig = { ...pos };
      startX = e.clientX; startY = e.clientY; lastPos = { ...orig };
      lockFieldScroll();
      if (group.setPointerCapture && e.pointerId != null) {
        try { group.setPointerCapture(e.pointerId); } catch(err){}
      }
    });

    group.addEventListener("pointermove", function (e) {
      if (!draggingBall) return;
      // Protection contre déplacement accidentel : attendre le délai et vérifier qu'il n'y a pas de 2e doigt
      if (!isDragAllowedAfterDelay()) {
        if (isTwoFingerTouch) {
          draggingBall = false;
          unlockFieldScroll();
        }
        return;
      }
      const dx = e.clientX - startX; const dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < dragThreshold) return;
      moved = true;
      const nx = orig.x + dx, ny = orig.y + dy;
      lastPos = { x: nx, y: ny };
      applyBallRender(nx, ny, { visualOffset });
    });

    group.addEventListener("pointerup", endDrag);
    group.addEventListener("pointercancel", endDrag);
  }

  // ===== Popup flèche =====
  // ===== Popup flèche =====
  let popupDiv;
  function removeArrowPopup() { if (popupDiv) popupDiv.style.display = "none"; }
  function showArrowPopup(arrow, index, clientX, clientY) {
    console.log("[DEBUG POPUP] showArrowPopup APPELÉ! index:", index, "clientX:", clientX, "clientY:", clientY);
    removeArrowPopup();
    if (!popupDiv) {
      console.log("[DEBUG POPUP] Création du popupDiv");
      popupDiv = document.createElement("div");
      popupDiv.className = "kas-popup-arrow";
      document.body.appendChild(popupDiv);
    }
    const v = (n, d)=> (typeof n==="number" ? n : d);
    popupDiv.innerHTML = `
      <button class="kas-arrow-delete kas-btn-secondary" title="Supprimer la flèche">🗑️ Supprimer</button>

      <label>Type de mouvement</label>
      <select id="kasArrowType">
        <option value="move_player">Déplacement</option>
        <option value="dribble">Conduite</option>
        <option value="pass_ground">Passe au sol</option>
        <option value="pass_air">Passe en l'air</option>
        <option value="shoot_ground">Tir au sol</option>
        <option value="shoot_air">Tir en l'air</option>
      </select>

      <label>Vitesse (ms)</label>
      <input type="number" id="kasArrowVitesse" min="200" max="6000" step="50" value="${v(arrow.vitesse,900)}">
      <div class="kas-help">200 = très rapide · 2000 = lent</div>

      <label>Vague de départ (phase)</label>
      <input type="number" id="kasArrowPhase" min="0" max="99" step="1" value="${v(arrow.phase,0)}">
      <div class="kas-help">Les flèches d’une même vague partent ensemble (0 à 99).</div>

      <label>Décalage dans la vague (ms)</label>
      <input type="number" id="kasArrowDelay" min="0" max="5000" step="50" value="${v(arrow.delayMs,0)}">
      <div class="kas-help">Petit retard par rapport aux autres de la même vague (ex. 200–300 ms).</div>

      <div class="btn-row">
        <button id="kasArrowCancel" class="kas-btn kas-btn-secondary">Annuler</button>
        <button id="kasArrowSave" class="kas-btn">Valider</button>
      </div>
    `;
    popupDiv.querySelector("#kasArrowType").value = arrow.type;
    popupDiv.style.position = "fixed";
    popupDiv.style.zIndex = "999999";
    popupDiv.style.display = "block";

    // Positionnement adaptatif pour mobile : s'assurer que le popup reste visible
    const popupWidth = 300; // largeur approximative
    const popupHeight = 350; // hauteur approximative
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 10;

    let posX = clientX - 10;
    let posY = clientY - 10;

    // Ajuster si le popup dépasse à droite
    if (posX + popupWidth > viewportW - margin) {
      posX = Math.max(margin, viewportW - popupWidth - margin);
    }
    // Ajuster si le popup dépasse en bas
    if (posY + popupHeight > viewportH - margin) {
      posY = Math.max(margin, viewportH - popupHeight - margin);
    }

    popupDiv.style.left = posX + "px";
    popupDiv.style.top = posY + "px";
    console.log("[DEBUG POPUP] Popup affiché à:", posX, posY, "display:", popupDiv.style.display);

    popupDiv.querySelector(".kas-arrow-delete").onclick = () => {
      const seq = simulations[currentSim].sequences[currentSeq];
      const presets = ensureArrowPresetsForSequence(seq);
      const stored = seq.arrows[index];
      if (stored && stored.playerIndex != null) {
        presets[stored.playerIndex] = {
          vitesse: clampNumber(stored.vitesse, 200, 6000, 900),
          phase: clampNumber(stored.phase, 0, 99, 0),
          delayMs: clampNumber(stored.delayMs, 0, 5000, 0),
          type: stored.type || "move_player",
        };
      }
      seq.arrows.splice(index, 1);
      saveSimulations(); drawArrows(); drawBall(); drawPlayerConfigUI();
      popupDiv.style.display = "none";
    };
    popupDiv.querySelector("#kasArrowCancel").onclick = () => { popupDiv.style.display = "none"; };
    popupDiv.querySelector("#kasArrowSave").onclick = () => {
      const type = popupDiv.querySelector("#kasArrowType").value;
      const vit  = Math.max(200, Math.min(6000, parseInt(popupDiv.querySelector("#kasArrowVitesse").value||900,10)));
      const ph   = Math.max(0,   Math.min(99,   parseInt(popupDiv.querySelector("#kasArrowPhase").value||0,10)));
      const del  = Math.max(0,   Math.min(5000, parseInt(popupDiv.querySelector("#kasArrowDelay").value||0,10)));

      arrow.type = type; arrow.vitesse = vit; arrow.phase = ph; arrow.delayMs = del;

      const seq = simulations[currentSim].sequences[currentSeq];
      const presets = ensureArrowPresetsForSequence(seq);
      if (arrow.playerIndex != null) presets[arrow.playerIndex] = { vitesse: vit, phase: ph, delayMs: del, type }; 

      saveSimulations(); drawArrows(); drawBall(); drawPlayerConfigUI();
      popupDiv.style.display = "none";
    };

  }

  /* ================= Animation live (DOM) – phases + delays ================= */
  function collectPhases(arrows){
    const set = new Set();
    arrows.forEach(a=> set.add(typeof a.phase==="number"?a.phase:0));
    return Array.from(set).sort((a,b)=>a-b);
  }

  async function animatePhaseDOM(arrowsPhase, startPositions, initialBallPos){
    let positions = JSON.parse(JSON.stringify(startPositions));
    const steps = [];
    arrowsPhase.forEach(a=>{
      const dur = a.vitesse || 900;
      const delay = Math.max(0, a.delayMs || 0);
      if ((a.type === "move_player" || a.type === "dribble") && a.playerIndex != null && positions[a.playerIndex]){
        steps.push({
          playerIndex: a.playerIndex,
          start: {...positions[a.playerIndex]},
          end: {x:a.x2, y:a.y2},
          dur, delay,
        });
      }
    });

    const ballArrow = [...arrowsPhase].reverse().find(a => ["pass_ground", "pass_air", "shoot_ground", "shoot_air", "dribble"].includes(a.type));
    const ballDur   = ballArrow ? (ballArrow.vitesse||900) : 900;
    const ballDelay = ballArrow ? Math.max(0, ballArrow.delayMs||0) : 0;
    const ballStart = ballArrow ? { x: ballArrow.x1, y: ballArrow.y1 } : initialBallPos;
    const ballEnd   = ballArrow ? { x: ballArrow.x2, y: ballArrow.y2 } : ballStart;

    const tickMs = 13;
    let elapsed = 0;

    return await new Promise(resolve=>{
      const tick = async ()=>{
        let running = false;
        elapsed += tickMs;

        steps.forEach(s=>{
          const local = Math.max(0, elapsed - s.delay);
          if (local < s.dur){
            running = true;
            const p = local / s.dur;
            const nx = s.start.x + (s.end.x - s.start.x) * p;
            const ny = s.start.y + (s.end.y - s.start.y) * p;
            updatePlayerRenderPosition(s.playerIndex, nx, ny);
            positions[s.playerIndex] = { x:nx, y:ny };
          } else {
            positions[s.playerIndex] = { x:s.end.x, y:s.end.y };
          }
        });

        let ballPos = ballEnd;
        if (ballArrow){
          const localBall = Math.max(0, elapsed - ballDelay);
          if (localBall < ballDur){
            running = true;
            const pb = localBall / ballDur;
            ballPos = { x: ballStart.x + (ballEnd.x - ballStart.x)*pb, y: ballStart.y + (ballEnd.y - ballStart.y)*pb };
          }
        }
        drawBall(ballPos);

        if (running) setTimeout(tick, tickMs);
        else resolve({ positions, ball: ballEnd });
      };
      setTimeout(tick, tickMs);
    });
  }

  async function animateSequencePremium(seqIndex, startPositions) {
    let positions = JSON.parse(JSON.stringify(startPositions));
    const arrows = (simulations[currentSim].sequences[seqIndex].arrows || []).map(a=>({
      ...a, phase: (typeof a.phase==="number"?a.phase:0), delayMs: (typeof a.delayMs==="number"?a.delayMs:0)
    }));
    const phases = collectPhases(arrows);
    let ballPos = (seqIndex===0) ? (simulations[currentSim].sequences[0].ballPos || {x:450,y:300}) : getBallPositionForSequence(seqIndex-1);

    for (const ph of phases){
      const pack = arrows.filter(a=> (a.phase||0) === ph);
      const res = await animatePhaseDOM(pack, positions, ballPos);
      positions = res.positions;
      ballPos = res.ball;
      await new Promise(r=>setTimeout(r, 250)); // respiration entre vagues
    }
    // mémoriser la position finale du ballon pour cette séquence
    const seq = simulations[currentSim].sequences[seqIndex];
    seq.ballPosFinal = ballPos; saveSimulations();
    drawBall(ballPos);
    return positions;
  }

  /* ================= Admin boutons ================= */
  function attachAdminToolbarEvents() {
    const renameSimBtn    = document.getElementById("renameSimBtn");
    const deleteSimBtn    = document.getElementById("deleteSimBtn");
    const renameSeqBtn    = document.getElementById("renameSeqBtn");
    const deleteSeqBtn    = document.getElementById("deleteSeqBtn");
    const clearArrowsBtn  = document.getElementById("clearArrowsBtn");
    const showSeqStartBtn = document.getElementById("showSeqStartBtn");
    const showSeqEndBtn   = document.getElementById("showSeqEndBtn");

    if (renameSimBtn)
      renameSimBtn.onclick = function () {
        const oldName = currentSim;
        const name = prompt("Nouveau nom pour la simulation ?", oldName);
        if (!name || name === oldName || simulations[name]) return;
        simulations[name] = JSON.parse(JSON.stringify(simulations[oldName]));
        delete simulations[oldName];
        currentSim = name;
        saveSimulations();
        updateSimSelect(); updateSeqSelect();
        renderCurrentSimulation();
      };

    if (deleteSimBtn)
      deleteSimBtn.onclick = function () {
        const keys = Object.keys(simulations).filter(k=>k!=="_display");
        if (keys.length <= 1) { alert("Il doit rester au moins une simulation !"); return; }
        if (!confirm(`Supprimer la simulation « ${currentSim} » ?`)) return;
        delete simulations[currentSim];
        currentSim = Object.keys(simulations).find(k=>k!=="_display");
        currentSeq = 0;
        saveSimulations();
        updateSimSelect(); updateSeqSelect();
        renderCurrentSimulation();
      };

    if (renameSeqBtn)
      renameSeqBtn.onclick = function () {
        const seqs = simulations[currentSim].sequences;
        const oldName = seqs[currentSeq].name;
        const name = prompt("Nouveau nom pour la séquence ?", oldName);
        if (!name || name === oldName) return;
        seqs[currentSeq].name = name;
        saveSimulations(); updateSeqSelect();
      };

    if (deleteSeqBtn)
      deleteSeqBtn.onclick = function () {
        const seqs = simulations[currentSim].sequences;
        if (seqs.length <= 1) { alert("Il doit rester au moins une séquence !"); return; }
        if (!confirm(`Supprimer la séquence « ${seqs[currentSeq].name} » ?`)) return;
        seqs.splice(currentSeq, 1);
        currentSeq = 0;
        saveSimulations();
        updateSeqSelect(); drawPlayerConfigUI(); syncCommentBar(); drawField(); createPlayers(); drawAnnotations();
      };

    if (clearArrowsBtn)
      clearArrowsBtn.onclick = function () {
        if (!confirm("Supprimer toutes les flèches de cette séquence ?")) return;
        simulations[currentSim].sequences[currentSeq].arrows = [];
        saveSimulations(); drawArrows(); drawBall(); drawPlayerConfigUI();
      };

    if (showSeqStartBtn)
      showSeqStartBtn.onclick = function () {
        let positions = getPositionsAtSequenceStart(currentSeq);
        drawField(); createPlayers(positions);
        // ballon = début de seq courante = fin de seq-1
        const bp = (currentSeq===0) ? (simulations[currentSim].sequences[0].ballPos || {x:450,y:300}) : getBallPositionForSequence(currentSeq-1);
        drawBall(bp);
        drawAnnotations();
      };

    if (showSeqEndBtn)
      showSeqEndBtn.onclick = function () {
        let positions = getPositionsAtSequenceStart(currentSeq);
        let arrows = simulations[currentSim].sequences[currentSeq].arrows || [];
        for (let arrow of arrows) {
          if ((arrow.type === "move_player" || arrow.type === "dribble") &&
              arrow.playerIndex != null && positions[arrow.playerIndex]) {
            positions[arrow.playerIndex] = { x: arrow.x2, y: arrow.y2 };
          }
        }
        drawField(); createPlayers(positions);
        drawBall(getBallPositionForSequence(currentSeq));
        drawAnnotations();
      };
  }

  /* ================= Events tactique ================= */
  const addPlayerBtn = document.getElementById("addPlayerBtn");
  if (addPlayerBtn)
    addPlayerBtn.onclick = function () {
      const sim = simulations[currentSim];
      if (!sim.initialPositions) sim.initialPositions = [];
      if (!sim.playerConfigs)    sim.playerConfigs    = [];
      sim.initialPositions.push({ x: 450, y: 300 });
      sim.playerConfigs.push({ style:getDisplay().defaultStyle||"silhouette", circleColor:getDisplay().defaultCircleColor||"#00bfff", sprite: playerSprites[0].src, posture: "statique", skin: skins[0].color, num: sim.playerConfigs.length+1, name:"" });
      (sim.sequences||[]).forEach(seq=>{
        if (!Array.isArray(seq.sprites)) seq.sprites = [];
        seq.sprites.push(null);
        const presets = ensureArrowPresetsForSequence(seq);
        presets.push({ vitesse: 900, phase: 0, delayMs: 0 });
      });
      saveSimulations(); createPlayers(); drawPlayerConfigUI();
    };

  const toggleArrowsBtn = document.getElementById("toggleArrowsBtn");
  if (toggleArrowsBtn) toggleArrowsBtn.onclick = function () { arrowsVisible = !arrowsVisible; drawArrows(); };

  const playSeqBtn = document.getElementById("playSeqBtn");
  if (playSeqBtn)
    playSeqBtn.onclick = async function () {
      if (mode !== "tactic") return;
      createPlayers(undefined, currentSeq);
      document.getElementById("kasendemi-svg").scrollIntoView({ behavior: "smooth", block: "center" });
      let pos = await animateSequencePremium(currentSeq, getPositionsAtSequenceStart(currentSeq));
      createPlayers(pos, currentSeq); drawAnnotations(); // affiche positions fin
      drawBall(getBallPositionForSequence(currentSeq));
    };

  const playAllBtn = document.getElementById("playAllBtn");
  if (playAllBtn)
    playAllBtn.onclick = async function () {
      if (mode !== "tactic") return;
      let positions = getPositionsAtSequenceStart(0);
      createPlayers(positions, 0);
      document.getElementById("kasendemi-svg").scrollIntoView({ behavior: "smooth", block: "center" });
      const seqs = simulations[currentSim].sequences || [];
      for (let i = 0; i < seqs.length; i++) {
        createPlayers(positions, i);
        positions = await animateSequencePremium(i, positions);
        await new Promise(r => setTimeout(r, 250));
      }
      createPlayers(positions, seqs.length-1); drawAnnotations();
      drawBall(getBallPositionForSequence(seqs.length-1));
    };

  const simSelectEl = document.getElementById("simSelect");
  if (simSelectEl)
    simSelectEl.onchange = function () {
      currentSim = this.value; currentSeq = 0;
      clearPlayerEditorUI();
      updateSeqSelect(); customBallPos = null;
      renderCurrentSimulation();
    };

  const seqSelectEl = document.getElementById("seqSelect");
  if (seqSelectEl)
    seqSelectEl.onchange = function () {
      currentSeq = parseInt(this.value, 10); customBallPos = null;
      drawField(); createPlayers(); drawPlayerConfigUI(); syncCommentBar(); drawAnnotations();
    };

  const newSimBtn = document.getElementById("newSimBtn");
  if (newSimBtn)
    newSimBtn.onclick = function () {
      const name = prompt("Nom de la simulation ?");
      if (!name || simulations[name]) return;
      clearPlayerEditorUI();
      simulations[name] = {
        initialPositions: [],
        sequences: [{ name: "Séquence 1", arrows: [], ballPos: { x: 450, y: 300 }, ballPosFinal:null, comment: "", annotations: [], sprites: [], arrowPresets: [] }],
        playerConfigs: [],
      };
      // réinitialiser explicitement les configurations pour éviter de reprendre celles de la simulation précédente
      playerConfigs = simulations[name].playerConfigs;
      currentSim = name; currentSeq = 0;
      saveSimulations(); updateSimSelect(); updateSeqSelect();
      renderCurrentSimulation();
    };

  const newSeqBtn = document.getElementById("newSeqBtn");
  if (newSeqBtn)
    newSeqBtn.onclick = function () {
      const name = prompt("Nom de la séquence ?");
      if (!name) return;
      simulations[currentSim].sequences.push({ name, arrows: [], comment: "", ballPosFinal:null, annotations: [], sprites: [], arrowPresets: [] });
      currentSeq = simulations[currentSim].sequences.length - 1;
      saveSimulations(); updateSeqSelect(); drawField(); createPlayers(); drawPlayerConfigUI(); syncCommentBar(); drawAnnotations();
    };

  const prevSeqBtn = document.getElementById("prevSeqBtn");
  if (prevSeqBtn)
    prevSeqBtn.onclick = function () {
      if (currentSeq > 0) {
        currentSeq--;
        const sel = document.getElementById("seqSelect");
        if (sel) sel.value = currentSeq;
        customBallPos = null;
        drawField(); createPlayers(); drawPlayerConfigUI(); syncCommentBar(); drawAnnotations();
      }
    };

  const nextSeqBtn = document.getElementById("nextSeqBtn");
  if (nextSeqBtn)
    nextSeqBtn.onclick = function () {
      const seqs = simulations[currentSim].sequences || [];
      if (currentSeq < seqs.length - 1) {
        currentSeq++;
        const sel = document.getElementById("seqSelect");
        if (sel) sel.value = currentSeq;
        customBallPos = null;
        drawField(); createPlayers(); drawPlayerConfigUI(); syncCommentBar(); drawAnnotations();
      }
    };

  /* ================= Compo mode ================= */
  function updateCompoSelect() {
    const compoSelect = document.getElementById("compoSelect");
    if (!compoSelect) return;
    compoSelect.innerHTML = "";
    Object.keys(compos).forEach(name => {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name; compoSelect.appendChild(opt);
    });
    compoSelect.value = currentCompo;
  }
  function saveCompo() { saveComposToLocal(compos); saveComposToServer(compos); }
  function drawCompoConfigUI() {
    if (!configContainer) return;
    configContainer.innerHTML = "";
    let compo = compos[currentCompo];
    if (!compo) return;
    if (Object.keys(compos).length > 1) {
      const delCompoBtn = document.createElement("button");
      delCompoBtn.textContent = "❌ Supprimer cette composition";
      delCompoBtn.style.margin = "0 0 10px 0";
      delCompoBtn.onclick = () => {
        if (!confirm(`Supprimer la composition « ${currentCompo} » ?`)) return;
        delete compos[currentCompo];
        currentCompo = Object.keys(compos)[0];
        saveCompo(); updateCompoSelect(); drawCompoConfigUI(); drawField(); drawCompoPlayers();
      };
      configContainer.appendChild(delCompoBtn);
      configContainer.appendChild(document.createElement("br"));
    }
    compo.players.forEach((player, i) => {
      const box = document.createElement("div");
      box.style.background = "#f8f8fa"; box.style.borderRadius = "8px";
      box.style.padding = "6px 10px"; box.style.margin = "3px 3px";
      box.style.display = "inline-block"; box.style.fontSize = "12px";
      box.innerHTML = `<b>${i + 1}</b> `;
      const numInput = document.createElement("input");
      numInput.type = "number"; numInput.value = player.num || i + 1;
      numInput.min = 1; numInput.max = 99; numInput.style.width = "40px";
      numInput.style.fontWeight = "bold"; numInput.style.fontSize = "14px"; numInput.style.marginRight = "7px";
      numInput.onchange = () => { player.num = numInput.value; saveCompo(); drawCompoPlayers(); };
      box.appendChild(numInput);
      const nameInput = document.createElement("input");
      nameInput.value = player.name || ""; nameInput.placeholder = "Nom"; nameInput.style.width = "60px";
      nameInput.onchange = () => { player.name = nameInput.value; saveCompo(); drawCompoConfigUI(); drawCompoPlayers(); };
      box.appendChild(nameInput);
      const colorPicker = document.createElement("input");
      colorPicker.type = "color"; colorPicker.value = player.color || "#00bfff";
      colorPicker.onchange = () => { player.color = colorPicker.value; saveCompo(); drawCompoPlayers(); };
      box.appendChild(colorPicker);
      const delBtn = document.createElement("button");
      delBtn.textContent = "✖"; delBtn.style.marginLeft = "4px";
      delBtn.onclick = () => { compo.players.splice(i, 1); saveCompo(); drawCompoConfigUI(); drawCompoPlayers(); };
      box.appendChild(delBtn);
      configContainer.appendChild(box);
    });
  }
  function drawCompoPlayers() {
    svg.querySelectorAll(".compo-player").forEach(e => e.remove());
    if (mode !== "compo") return;
    let compo = compos[currentCompo];
    compo.players.forEach((player, i) => {
      const group = document.createElementNS(svg.namespaceURI, "g");
      group.classList.add("compo-player");
      const cx = player.x || 120 + 60 * i;
      const cy = player.y || 180 + 30 * i;

      const circle = document.createElementNS(svg.namespaceURI, "circle");
      circle.setAttribute("cx", cx);
      circle.setAttribute("cy", cy);
      circle.setAttribute("r", 24);
      circle.setAttribute("fill", player.color || "#007fff");
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", 3);
      group.appendChild(circle);

      const num = document.createElementNS(svg.namespaceURI, "text");
      num.setAttribute("x", cx); num.setAttribute("y", cy + 6);
      num.setAttribute("text-anchor", "middle");
      num.setAttribute("font-size", "18px");
      num.setAttribute("fill", "#fff");
      num.setAttribute("font-weight", "bold");
      num.textContent = player.num || i + 1;
      group.appendChild(num);

      const name = document.createElementNS(svg.namespaceURI, "text");
      name.setAttribute("x", cx); name.setAttribute("y", cy + 38);
      name.setAttribute("text-anchor", "middle");
      name.setAttribute("font-size", "12px");
      name.setAttribute("fill", "#fff");
      name.textContent = player.name || "";
      group.appendChild(name);

      let dragging = false, startX, startY, origX, origY;
      group.addEventListener("mousedown", function (e) {
        dragging = true; startX = e.clientX; startY = e.clientY;
        origX = cx; origY = cy;
      });
      window.addEventListener("mousemove", function (e) {
        if (!dragging) return;
        const dx = e.clientX - startX; const dy = e.clientY - startY;
        player.x = origX + dx; player.y = origY + dy;
        drawCompoPlayers();
      });
      window.addEventListener("mouseup", () => { dragging = false; });
      svg.appendChild(group);
    });
  }

  /* ================= Snapshots / PNG / Storyboards ================= */
  const IMAGE_CACHE = new Map();

  async function inlineImagesInSVG(svgEl) {
    const XLINK = "http://www.w3.org/1999/xlink";
    const clone = svgEl.cloneNode(true);
    const nodes = clone.querySelectorAll("image");
    await Promise.all([...nodes].map(async img=>{
      let href = img.getAttributeNS(XLINK, "href") || img.getAttribute("href");
      if (!href || href.startsWith("data:")) return;
      const abs = new URL(href, location.href).toString();
      try {
        let dataUrl = IMAGE_CACHE.get(abs);
        if (!dataUrl) {
          const res = await fetch(abs, { credentials: "same-origin" });
          const blob = await res.blob();
          dataUrl = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob); });
          IMAGE_CACHE.set(abs, dataUrl);
        }
        img.setAttributeNS(XLINK, "href", dataUrl);
        img.setAttribute("href", dataUrl);
      } catch (e) { console.warn("Inline image échouée pour", abs, e); }
    }));
    return clone;
  }

  function ks_makeSVGRoot(mode) {
    const svgNS  = "http://www.w3.org/2000/svg";
    const xlink  = "http://www.w3.org/1999/xlink";
    const root   = document.createElementNS(svgNS, "svg");
    root.setAttribute("xmlns", svgNS);
    root.setAttribute("xmlns:xlink", xlink);
    root.setAttribute("viewBox", "0 0 900 600");
    root.setAttribute("width", "900");
    root.setAttribute("height", "600");
    const bg = document.createElementNS(svgNS, "image");
    bg.setAttributeNS(xlink, "href", pluginUrl + "assets/" + (mode === "tactic" ? "terrain 1 avec foule.png" : "terrain 2 compo.png"));
    bg.setAttribute("x", "0"); bg.setAttribute("y", "0");
    bg.setAttribute("width", "900"); bg.setAttribute("height", "600");
    bg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    root.appendChild(bg);
    return root;
  }
  function ks_appendArrowHeadDefs(root){
    if (root.querySelector("#arrowhead")) return;
    const svgNS = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(svgNS, "defs");
    const marker = document.createElementNS(svgNS, "marker");
    marker.setAttribute("id", "arrowhead");
    marker.setAttribute("markerWidth", "13");
    marker.setAttribute("markerHeight", "8");
    marker.setAttribute("refX", "11");
    marker.setAttribute("refY", "4");
    marker.setAttribute("orient", "auto");
    marker.setAttribute("markerUnits", "strokeWidth");
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("d", "M0,0 L13,4 L0,8 L2,4 Z");
    path.setAttribute("fill", "#f4d03f");
    marker.appendChild(path);
    defs.appendChild(marker);
    root.insertBefore(defs, root.firstChild);
  }
  function ks_appendAnnMarker(root){
    if (root.querySelector("#ann-arrowhead")) return;
    const svgNS = "http://www.w3.org/2000/svg";
    let defs = root.querySelector("defs"); if (!defs){ defs=document.createElementNS(svgNS,"defs"); root.insertBefore(defs, root.firstChild); }
    const marker = document.createElementNS(svgNS,"marker");
    marker.setAttribute("id","ann-arrowhead");
    marker.setAttribute("markerWidth","10"); marker.setAttribute("markerHeight","6");
    marker.setAttribute("refX","8"); marker.setAttribute("refY","3"); marker.setAttribute("orient","auto");
    marker.setAttribute("markerUnits","strokeWidth");
    const path = document.createElementNS(svgNS,"path");
    path.setAttribute("d","M0,0 L10,3 L0,6 L2,3 Z");
    path.setAttribute("fill","#222");
    marker.appendChild(path); defs.appendChild(marker);
  }

    function renderPlayerToSVG(root, pos, conf, i, seqIndex){
     const svgNS="http://www.w3.org/2000/svg"; const xlink="http://www.w3.org/1999/xlink";
  const d = getDisplay(); const scale = d.playerScale||0.8;
  const style = effStyle(conf);
  let w=0,h=0,r=0;

if (style==="rond"){
  r = Math.round(22*scale);
  const circle = document.createElementNS(svgNS,"circle");
  circle.setAttribute("cx", pos.x); circle.setAttribute("cy", pos.y);
  circle.setAttribute("r", r);
  circle.setAttribute("fill", effCircleColor(conf));
  circle.setAttribute("stroke","#fff"); circle.setAttribute("stroke-width","3");
  root.appendChild(circle);
} else {
  const img = document.createElementNS(svgNS,"image");
  w = Math.round(64*scale); h = Math.round(64*scale);
  img.setAttributeNS(xlink,"href", pluginUrl+"assets/"+effSeqSprite(conf, seqIndex ?? currentSeq, i));
  img.setAttribute("x", pos.x - w/2); img.setAttribute("y", pos.y - (h*0.72));
  img.setAttribute("width", w); img.setAttribute("height", h);
  img.setAttribute("preserveAspectRatio","xMidYMid meet");
  root.appendChild(img);
}

    const text = playerLabelText(i);
    if (text){
      const label = document.createElementNS(svgNS,"text");
      label.setAttribute("text-anchor","middle");
      label.setAttribute("font-size","12");
      label.setAttribute("font-weight","700");
      label.setAttribute("fill","#fff");
      if (d.labelShadow){ label.setAttribute("stroke","#111"); label.setAttribute("stroke-width",".8"); label.setAttribute("paint-order","stroke fill"); }
      const ly = style==="rond" ? (pos.y - (r+8)) : (pos.y - (h*0.86));
      label.setAttribute("x", pos.x); label.setAttribute("y", ly);
      label.textContent = text;
      root.appendChild(label);
    }
  }

  function ks_snapshotTacticSVG(seqIndex, {showArrows=true, showAnnotations=true} = {}){
    const svgNS="http://www.w3.org/2000/svg"; const xlink="http://www.w3.org/1999/xlink";
    const root = ks_makeSVGRoot("tactic");
    if (showArrows) ks_appendArrowHeadDefs(root);
    ks_appendAnnMarker(root);

    const positions = getPositionsAtSequenceStart(seqIndex);
    ensurePlayerConfigs();
    while (playerConfigs.length < positions.length) {
      playerConfigs.push({ style:getDisplay().defaultStyle||"silhouette", circleColor:getDisplay().defaultCircleColor||"#00bfff", sprite: playerSprites[0].src, posture: "statique", skin: skins[0].color, num: playerConfigs.length+1, name:"" });
    }
    positions.forEach((pos,i)=> renderPlayerToSVG(root, pos, playerConfigs[i], i, seqIndex));

    if (showArrows){
      const arrs = (simulations[currentSim]?.sequences?.[seqIndex]?.arrows) || [];
      arrs.forEach(item=>{
        const x1 = (item.playerIndex!=null && positions[item.playerIndex]) ? positions[item.playerIndex].x : item.x1;
        const y1 = (item.playerIndex!=null && positions[item.playerIndex]) ? positions[item.playerIndex].y : item.y1;
        const line = document.createElementNS(svgNS,"line");
        line.setAttribute("x1", x1); line.setAttribute("y1", y1);
        line.setAttribute("x2", item.x2); line.setAttribute("y2", item.y2);
        line.setAttribute("stroke", getColorByType(item.type));
        line.setAttribute("stroke-width", "3");
        line.setAttribute("marker-end", "url(#arrowhead)");
        root.appendChild(line);

        // Badge de phase
        const ph = (typeof item.phase === "number" ? item.phase : 0);
        const dx = item.x2 - x1, dy = item.y2 - y1;
        const mx = x1 + dx * 0.5, my = y1 + dy * 0.5;
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * 12, oy = (dx / len) * 12;
        const bx = mx + ox, by = my + oy;

        const badge = document.createElementNS(svgNS, "g");
        badge.setAttribute("transform", `translate(${bx},${by})`);
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("r", 9); circle.setAttribute("fill", "#111");
        circle.setAttribute("stroke", "#fff"); circle.setAttribute("stroke-width", "2");
        badge.appendChild(circle);
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", 0); text.setAttribute("y", 4);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill","#fff"); text.setAttribute("font-size","10"); text.setAttribute("font-weight","700");
        text.textContent = String(ph);
        badge.appendChild(text);
        root.appendChild(badge);
      });
    }

    // Annotations
    if (showAnnotations){
      const seq = simulations[currentSim]?.sequences?.[seqIndex];
      if (seq?.annotations?.length){
        const d = getDisplay(); const scale = d.playerScale||0.8;
        seq.annotations.forEach(st=>{
          let node=null;
          switch(st.kind){
            case "free":{
              node = document.createElementNS(svgNS,"path");
              node.setAttribute("fill","none");
              node.setAttribute("stroke", st.color||"#ff3b30");
              node.setAttribute("stroke-width", st.width||3);
              node.setAttribute("stroke-linecap","round");
              node.setAttribute("stroke-linejoin","round");
              if (st.points?.length){
                let d = `M ${st.points[0].x} ${st.points[0].y}`;
                for (let i=1;i<st.points.length;i++) d += ` L ${st.points[i].x} ${st.points[i].y}`;
                node.setAttribute("d", d);
              }
              break;
            }
            case "rect":{
              node = document.createElementNS(svgNS,"rect");
              node.setAttribute("x", Math.min(st.x, st.x+st.w));
              node.setAttribute("y", Math.min(st.y, st.y+st.h));
              node.setAttribute("width", Math.abs(st.w));
              node.setAttribute("height", Math.abs(st.h));
              node.setAttribute("fill","rgba(0,0,0,0)");
              node.setAttribute("stroke", st.color||annotationColor);
              node.setAttribute("stroke-width", st.width||2);
              break;
            }
            case "circle":{
              node = document.createElementNS(svgNS,"ellipse");
              node.setAttribute("cx", st.x + st.w/2); node.setAttribute("cy", st.y + st.h/2);
              node.setAttribute("rx", Math.abs(st.w)/2); node.setAttribute("ry", Math.abs(st.h)/2);
              node.setAttribute("fill","rgba(0,0,0,0)");
              node.setAttribute("stroke", st.color||annotationColor);
              node.setAttribute("stroke-width", st.width||2);
              break;
            }
            case "dashed_arrow":{
              ks_appendAnnMarker(root);
              node = document.createElementNS(svgNS,"line");
              node.setAttribute("x1", st.x1); node.setAttribute("y1", st.y1);
              node.setAttribute("x2", st.x2); node.setAttribute("y2", st.y2);
              node.setAttribute("stroke", st.color||"#222");
              node.setAttribute("stroke-width", st.width||3);
              node.setAttribute("stroke-dasharray","6,6");
              node.setAttribute("marker-end","url(#ann-arrowhead)");
              break;
            }
            case "text":{
              node = document.createElementNS(svgNS,"text");
              node.setAttribute("x", st.x); node.setAttribute("y", st.y);
              node.setAttribute("fill", st.color||annotationColor);
              node.setAttribute("font-size","14");
              node.setAttribute("font-weight","700");
              node.textContent = st.text || "";
              break;
            }
            case "highlight":{
              const positions = getPositionsAtSequenceStart(seqIndex);
              const p = positions[st.playerIndex] || {x:0,y:0};
              node = document.createElementNS(svgNS,"circle");
              node.setAttribute("cx", p.x); node.setAttribute("cy", p.y);
              node.setAttribute("r", Math.round(28*scale));
              node.setAttribute("fill","rgba(0,0,0,0)");
              node.setAttribute("stroke", st.color||"#ffd400");
              node.setAttribute("stroke-width", st.width||4);
              break;
            }
            case "connect":{
              const positions = getPositionsAtSequenceStart(seqIndex);
              const a = positions[st.pair[0]]; const b = positions[st.pair[1]];
              if (!a||!b) return;
              node = document.createElementNS(svgNS,"line");
              node.setAttribute("x1", a.x); node.setAttribute("y1", a.y);
              node.setAttribute("x2", b.x); node.setAttribute("y2", b.y);
              node.setAttribute("stroke", st.color||"#00aaee");
              node.setAttribute("stroke-width", st.width||2);
              break;
            }
          }
          if (node) root.appendChild(node);
        });
      }
    }

    const bp = getBallPositionForSequence(seqIndex);
    const ball = document.createElementNS(svgNS, "image");
    ball.setAttributeNS(xlink,"href", pluginUrl+"assets/"+ballSprite);
    ball.setAttribute("x", bp.x-14); ball.setAttribute("y", bp.y-14);
    ball.setAttribute("width", "28"); ball.setAttribute("height","28");
    root.appendChild(ball);
    return root;
  }

  function ks_snapshotCompoSVG(){
    const svgNS="http://www.w3.org/2000/svg";
    const root = ks_makeSVGRoot("compo");
    const compo = compos[currentCompo];
    if (!compo) return root;
    compo.players.forEach((p,i)=>{
      const cx = p.x || 120 + 60*i;
      const cy = p.y || 180 + 30*i;
      const circle = document.createElementNS(svgNS,"circle");
      circle.setAttribute("cx", cx); circle.setAttribute("cy", cy);
      circle.setAttribute("r", "24");
      circle.setAttribute("fill", p.color || "#007fff");
      circle.setAttribute("stroke", "#fff");
      circle.setAttribute("stroke-width", "3");
      root.appendChild(circle);
      const num = document.createElementNS(svgNS,"text");
      num.setAttribute("x", cx); num.setAttribute("y", cy+6);
      num.setAttribute("text-anchor","middle");
      num.setAttribute("font-size","18"); num.setAttribute("font-weight","bold");
      num.setAttribute("fill","#fff"); num.textContent = p.num || i+1;
      root.appendChild(num);
      const name = document.createElementNS(svgNS,"text");
      name.setAttribute("x", cx); name.setAttribute("y", cy+38);
      name.setAttribute("text-anchor","middle");
      name.setAttribute("font-size","12"); name.setAttribute("fill","#fff");
      name.textContent = p.name || "";
      root.appendChild(name);
    });
    return root;
  }

  async function ks_svgNodeToPNG(svgNode){
    const clone = await inlineImagesInSVG(svgNode);
    const w = 900, h = 600;
    clone.setAttribute("width", w);
    clone.setAttribute("height", h);
    const xml = new XMLSerializer().serializeToString(clone);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    return await new Promise((resolve, reject)=>{
      const img = new Image();
      img.onload = ()=>{
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject; img.src = url;
    });
  }

  async function exportCurrentSequencePNG(showArrows = true) {
    const snap = ks_snapshotTacticSVG(currentSeq, {showArrows, showAnnotations:true});
    const dataURL = await ks_svgNodeToPNG(snap);
    const a = document.createElement("a");
    const simName = currentSim || "Simulation";
    const seqName = (simulations[currentSim]?.sequences?.[currentSeq]?.name) || `Sequence-${currentSeq + 1}`;
    a.href = dataURL; a.download = `${simName}-${seqName}${showArrows?"":"-sans-fleches"}.png`; a.click();
  }
  async function exportCompoPNG(){
    const snap = ks_snapshotCompoSVG();
    const dataURL = await ks_svgNodeToPNG(snap);
    const a = document.createElement("a");
    a.href = dataURL; a.download = `${currentCompo || "Composition"}.png`; a.click();
  }

  // Storyboard tactique
  async function openStoryboardWindow(showArrows = true){
    const seqs = simulations[currentSim]?.sequences || [];
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Storyboard - ${currentSim}</title><style>
      body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:20px;background:#111;color:#eee}
      .page{break-inside:avoid;margin:0 0 24px}
      h1{margin:0 0 16px} h2{margin:0 6px 6px;font-size:18px}
      img{display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #2a2a2a}
      .meta{font-size:12px;color:#aaa;margin:4px 6px}
      .comment{font-size:14px;margin:8px 6px 10px;color:#ddd;white-space:pre-wrap}
      @media print{body{background:#fff;color:#000} img{border:none} .comment{color:#000}}
    </style></head><body><h1>Storyboard — ${currentSim}</h1>`);
    for(let i=0;i<seqs.length;i++){
      const snap = ks_snapshotTacticSVG(i, {showArrows, showAnnotations:true});
      const dataURL = await ks_svgNodeToPNG(snap);
      const title = seqs[i].name || `Séquence ${i+1}`;
      const comment = (seqs[i].comment||"").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      win.document.write(`
        <div class="page">
          <h2>${i+1}. ${title}</h2>
          <div class="meta">Séquence ${i+1}/${seqs.length} • ${showArrows ? "avec" : "sans"} flèches</div>
          ${comment ? `<div class="comment">${comment}</div>` : ""}
          <img src="${dataURL}" alt="${title}">
        </div>
      `);
    }
    win.document.write(`</body></html>`); win.document.close();
  }

  // Storyboard compo
  async function openCompoBoardWindow(){
    const snap = ks_snapshotCompoSVG();
    const dataURL = await ks_svgNodeToPNG(snap);
    const win = window.open("", "_blank");
    win.document.write(`<html><head><title>Composition - ${currentCompo}</title><style>
      body{font-family:system-ui,Segoe UI,Roboto,Arial;margin:20px;background:#111;color:#eee}
      img{display:block;max-width:100%;height:auto;border-radius:10px;border:1px solid #2a2a2a}
      @media print{body{background:#fff;color:#000} img{border:none}}
    </style></head><body>
      <h1>Composition — ${currentCompo}</h1>
      <img src="${dataURL}" alt="${currentCompo}">
    </body></html>`);
    win.document.close();
  }

  /* ================= Vidéo Canvas (fluide) – phases + delays ================= */
  async function loadImageAbs(url){ return await new Promise((ok,ko)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src=url; }); }
  async function preloadCanvasAssetsForSeq(seqIndex){
    const terrainUrl = pluginUrl + "assets/terrain 1 avec foule.png";
    const ballUrl    = pluginUrl + "assets/" + ballSprite;
    const positions = getPositionsAtSequenceStart(seqIndex);
    ensurePlayerConfigs();
    const spriteUrls = new Set();
    for (let i=0;i<positions.length;i++){
      const conf = playerConfigs[i]||{};
      if ((conf.style||getDisplay().defaultStyle||"silhouette")==="silhouette"){
        const s = effSeqSprite(conf, seqIndex, i) || playerSprites[0].src;
        spriteUrls.add(pluginUrl + "assets/" + s);
      }
    }
    // Fallback garanti : toujours charger la silhouette de base pour éviter les joueurs invisibles
    spriteUrls.add(pluginUrl + "assets/" + playerSprites[0].src);
    const allUrls = [terrainUrl, ballUrl, ...spriteUrls];
    const results = await Promise.all(allUrls.map(u=>loadImageAbs(u)));
    const assets = { terrain: results[0], ball: results[1], sprites: {} };
    let idx=2;
    for (const su of spriteUrls) { assets.sprites[su] = results[idx++]; }
    return assets;
  }

  function startCanvasRecorder(canvas, fps = 60){
    const stream = canvas.captureStream(fps);
    let mime = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm;codecs=vp8';
    if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
    const chunks = [];
    rec.ondataavailable = (e)=>{ if (e.data && e.data.size) chunks.push(e.data); };
    function stopAndSave(filename='tactique.webm'){
      return new Promise((res)=>{
        rec.onstop = ()=>{
          const blob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename; a.click();
          setTimeout(()=>URL.revokeObjectURL(url), 10000);
          res();
        };
        rec.stop();
      });
    }
    rec.start(100);
    return { rec, stopAndSave };
  }

  // Rendu unique d'une frame vidéo (utilisé par toutes les boucles d'animation export)
  function drawFrameCanvas(ctx, assets, positions, ballPos, seqIndex, {showArrows=true}={}){
    const W = ctx.canvas.width = 900;
    const H = ctx.canvas.height = 600;
    ctx.clearRect(0,0,W,H);
    ctx.drawImage(assets.terrain, 0, 0, W, H);

    // Annotations (formes + texte + free + connect + highlight)
    const seq = simulations[currentSim]?.sequences?.[seqIndex];
    if (seq?.annotations?.length){
      seq.annotations.forEach(st=>{
        ctx.lineJoin="round"; ctx.lineCap="round";
        switch(st.kind){
          case "free":
            if (!st.points?.length) return;
            ctx.lineWidth = st.width||3; ctx.strokeStyle = st.color||"#ff3b30";
            ctx.beginPath(); ctx.moveTo(st.points[0].x, st.points[0].y);
            for (let i=1;i<st.points.length;i++) ctx.lineTo(st.points[i].x, st.points[i].y);
            ctx.stroke(); break;
          case "rect":
            ctx.lineWidth = st.width||2; ctx.strokeStyle = st.color||annotationColor;
            ctx.strokeRect(Math.min(st.x, st.x+st.w), Math.min(st.y, st.y+st.h), Math.abs(st.w), Math.abs(st.h)); break;
          case "circle":
            ctx.lineWidth = st.width||2; ctx.strokeStyle = st.color||annotationColor;
            ctx.beginPath(); ctx.ellipse(st.x+st.w/2, st.y+st.h/2, Math.abs(st.w)/2, Math.abs(st.h)/2, 0, 0, Math.PI*2); ctx.stroke(); break;
          case "dashed_arrow":
            ctx.save(); ctx.setLineDash([6,6]); ctx.lineWidth = st.width||3; ctx.strokeStyle = st.color||"#222";
            // ligne
            ctx.beginPath(); ctx.moveTo(st.x1, st.y1); ctx.lineTo(st.x2, st.y2); ctx.stroke();
            // tête simple
            const ang = Math.atan2(st.y2 - st.y1, st.x2 - st.x1); const ah=10;
            ctx.beginPath();
            ctx.moveTo(st.x2, st.y2);
            ctx.lineTo(st.x2 - ah*Math.cos(ang - Math.PI/8), st.y2 - ah*Math.sin(ang - Math.PI/8));
            ctx.lineTo(st.x2 - ah*Math.cos(ang + Math.PI/8), st.y2 - ah*Math.sin(ang + Math.PI/8));
            ctx.closePath(); ctx.fillStyle = st.color||"#222"; ctx.fill();
            ctx.restore(); break;
          case "text":
            ctx.fillStyle = st.color||annotationColor;
            ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
            ctx.fillText(st.text||"", st.x, st.y); break;
          case "highlight":{
            const scale = getDisplay().playerScale||0.8;
            const p = positions[st.playerIndex] || {x:0,y:0};
            ctx.lineWidth = st.width||4; ctx.strokeStyle = st.color||"#ffd400";
            ctx.beginPath(); ctx.arc(p.x, p.y, Math.round(28*scale), 0, Math.PI*2); ctx.stroke(); break;
          }
          case "connect":{
            const a = positions[st.pair[0]]; const b = positions[st.pair[1]]; if (!a||!b) return;
            ctx.lineWidth = st.width||2; ctx.strokeStyle = st.color||"#00aaee";
            ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); break;
          }
        }
      });
    }

    // Flèches tactiques
    if (showArrows){
      const arrs = simulations[currentSim]?.sequences?.[seqIndex]?.arrows || [];
      ctx.lineWidth = 3;
      arrs.forEach(a=>{
        ctx.strokeStyle = getColorByType(a.type);
        ctx.beginPath();
        const pos = (a.playerIndex!=null && positions[a.playerIndex]) ? positions[a.playerIndex] : {x:a.x1, y:a.y1};
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(a.x2, a.y2);
        ctx.stroke();
        const ang = Math.atan2(a.y2 - pos.y, a.x2 - pos.x);
        const ah = 10;
        ctx.beginPath();
        ctx.moveTo(a.x2, a.y2);
        ctx.lineTo(a.x2 - ah*Math.cos(ang - Math.PI/8), a.y2 - ah*Math.sin(ang - Math.PI/8));
        ctx.lineTo(a.x2 - ah*Math.cos(ang + Math.PI/8), a.y2 - ah*Math.sin(ang + Math.PI/8));
        ctx.closePath();
        ctx.fillStyle = getColorByType(a.type);
        ctx.fill();
      });
    }

    // Joueurs
    const scale = getDisplay().playerScale||0.8;
    ensurePlayerConfigs();
    for (let i=0;i<positions.length;i++){
      const conf = playerConfigs[i] || {};
      const style = effStyle(conf);
      if (style==="rond"){
        const r = Math.round(22*scale);
        ctx.fillStyle = effCircleColor(conf);
        ctx.strokeStyle="#fff"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(positions[i].x, positions[i].y, r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      } else {
        const spriteName = effSeqSprite(conf, seqIndex, i) || playerSprites[0].src;
        const su = pluginUrl + "assets/" + spriteName;
        const fallbackSu = pluginUrl + "assets/" + playerSprites[0].src;
        const img = assets.sprites[su] || assets.sprites[fallbackSu];
        if (img){
          const w = Math.round(64*scale), h = Math.round(64*scale);
          ctx.drawImage(img, positions[i].x - w/2, positions[i].y - (h*0.72), w, h);
        }
      }
  
      // label
      const text = playerLabelText(i);
      if (text){
        ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
        const useStroke = !!getDisplay().labelShadow;
        if (useStroke){ ctx.strokeStyle="#111"; ctx.lineWidth=3; ctx.strokeText(text, positions[i].x, positions[i].y - Math.round( (style==="rond"? (22*scale+8) : (64*scale*0.86)) )); }
        ctx.fillStyle="#fff";
        ctx.fillText(text, positions[i].x, positions[i].y - Math.round( (style==="rond"? (22*scale+8) : (64*scale*0.86)) ));
      }
    }

    // Ballon
    ctx.drawImage(assets.ball, ballPos.x - 14, ballPos.y - 14, 28, 28);
  }

  async function animatePhaseCanvas(seqIndex, positionsIn, ctx, assets, fps, showArrows, phaseVal, initialBallPos){
    let positions = JSON.parse(JSON.stringify(positionsIn));
    const arrows = (simulations[currentSim]?.sequences?.[seqIndex]?.arrows || [])
      .filter(a => (typeof a.phase==="number"?a.phase:0) === phaseVal)
      .map(a=>({ ...a, delayMs: Math.max(0, a.delayMs||0), vitesse: a.vitesse||900 }));

    const steps = [];
    arrows.forEach(a=>{
      if ((a.type === "move_player" || a.type === "dribble") && a.playerIndex != null && positions[a.playerIndex]){
        steps.push({
          playerIndex: a.playerIndex, start: {...positions[a.playerIndex]}, end: {x:a.x2, y:a.y2},
          dur: a.vitesse, delay: a.delayMs
        });
      }
    });

    const ballArrow = [...arrows].reverse().find(a => ["pass_ground","pass_air","shoot_ground","shoot_air","dribble"].includes(a.type));
    const ballDur   = ballArrow ? ballArrow.vitesse : 900;
    const ballDelay = ballArrow ? ballArrow.delayMs : 0;
    const ballStart = ballArrow ? { x: ballArrow.x1, y: ballArrow.y1 } : initialBallPos;
    const ballEnd   = ballArrow ? { x: ballArrow.x2, y: ballArrow.y2 } : ballStart;

    const frameMs = 1000 / fps;
    let elapsed = 0;
    let accumulator = 0;
    let last = performance.now();

    return await new Promise(resolve=>{
      const tick = (now)=>{
        const delta = Math.min(now - last, frameMs * 3);
        last = now;
        accumulator += delta;

        // Pas de rendu si on n'a pas atteint l'intervalle de frame cible (stabilité FPS)
        if (accumulator < frameMs){
          requestAnimationFrame(tick);
          return;
        }

        // On peut rattraper un éventuel retard en consommant plusieurs frames logiques
        while (accumulator >= frameMs){
          elapsed += frameMs;
          accumulator -= frameMs;
        }

        let running = false;

        steps.forEach(s=>{
          const local = Math.max(0, elapsed - s.delay);
          if (local < s.dur){
            running = true;
            const p = local / s.dur;
            const nx = s.start.x + (s.end.x - s.start.x)*p;
            const ny = s.start.y + (s.end.y - s.start.y)*p;
            positions[s.playerIndex] = { x:nx, y:ny };
          } else {
            positions[s.playerIndex] = { x:s.end.x, y:s.end.y };
          }
        });

        let ballPos = ballEnd;
        if (ballArrow){
          const local = Math.max(0, elapsed - ballDelay);
          if (local < ballDur){
            running = true;
            const p = local / ballDur;
            ballPos = { x: ballStart.x + (ballEnd.x - ballStart.x)*p, y: ballStart.y + (ballEnd.y - ballStart.y)*p };
          }
        }

        drawFrameCanvas(ctx, assets, positions, ballPos, seqIndex, {showArrows});
        if (running) requestAnimationFrame(tick);
        else resolve({ positions, ball: ballEnd });
      };
      requestAnimationFrame(tick);
    });
  }

  async function animateAndRecordSequenceCanvas(seqIndex, startPositions, ctx, assets, fps = 60, showArrows = true){
    let positions = JSON.parse(JSON.stringify(startPositions));
    const arrows = (simulations[currentSim]?.sequences?.[seqIndex]?.arrows || []).map(a=>({
      ...a, phase: (typeof a.phase==="number"?a.phase:0)
    }));
    const phases = collectPhases(arrows);
    let ballPos = (seqIndex===0) ? (simulations[currentSim].sequences[0].ballPos || {x:450,y:300}) : getBallPositionForSequence(seqIndex-1);

    for (const ph of phases){
      const res = await animatePhaseCanvas(seqIndex, positions, ctx, assets, fps, showArrows, ph, ballPos);
      positions = res.positions;
      ballPos = res.ball;
      await new Promise(r=>setTimeout(r,120));
    }
    // mémorise position finale du ballon pour cette séquence
    simulations[currentSim].sequences[seqIndex].ballPosFinal = ballPos; saveSimulations();
    return positions;
  }

  async function exportVideoCurrentSequenceCanvas(showArrows = true){
    const canvas = document.createElement("canvas");
    canvas.width = 900; canvas.height = 600;
    const ctx = canvas.getContext("2d");
    const targetFps = 60;
    const { stopAndSave } = startCanvasRecorder(canvas, targetFps);

    const assets = await preloadCanvasAssetsForSeq(currentSeq);
    let positions = getPositionsAtSequenceStart(currentSeq);
    // premier frame
    drawFrameCanvas(ctx, assets, positions, (currentSeq===0 ? (simulations[currentSim].sequences[0].ballPos||{x:450,y:300}) : getBallPositionForSequence(currentSeq-1)), currentSeq, {showArrows});
    await animateAndRecordSequenceCanvas(currentSeq, positions, ctx, assets, targetFps, showArrows);

    const simName = currentSim || "Simulation";
    const seqName = (simulations[currentSim]?.sequences?.[currentSeq]?.name) || `Sequence-${currentSeq + 1}`;
    await new Promise(r=>setTimeout(r,150));
    await stopAndSave(`${simName}-${seqName}${showArrows?"":"-sans-fleches"}.webm`);
  }

  async function exportVideoAllSequencesCanvas(showArrows = true){
    const seqs = simulations[currentSim]?.sequences || [];
    if (!seqs.length) return;

    const canvas = document.createElement("canvas");
    canvas.width = 900; canvas.height = 600;
    const ctx = canvas.getContext("2d");
    const targetFps = 60;
    const { stopAndSave } = startCanvasRecorder(canvas, targetFps);

    let positions = getPositionsAtSequenceStart(0);

    for (let i=0;i<seqs.length;i++){
      const assets = await preloadCanvasAssetsForSeq(i);
      drawFrameCanvas(ctx, assets, positions, (i===0 ? (seqs[0].ballPos||{x:450,y:300}) : getBallPositionForSequence(i-1)), i, {showArrows});
      await new Promise(r=>setTimeout(r,120));
      positions = await animateAndRecordSequenceCanvas(i, positions, ctx, assets, targetFps, showArrows);
      await new Promise(r=>setTimeout(r,120));
    }

    await stopAndSave(`${currentSim || "Simulation"}-toutes-sequences${showArrows?"":"-sans-fleches"}.webm`);
  }

  /* ================= Init ================= */
  switchMode("tactic");
});
