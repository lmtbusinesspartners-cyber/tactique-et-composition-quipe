// Entraînement – moteur dédié (séquences, matériaux, export)
// Version initiale
(function(){
  document.addEventListener("DOMContentLoaded", () => {
    const trainingRoot = document.getElementById("training-root");
    const trainingModeBtn = document.getElementById("trainingModeBtn");
    const svg = document.getElementById("training-svg");
    if (!trainingRoot || !trainingModeBtn || !svg) return;

    const pluginUrl = (window.kasendemiVars && window.kasendemiVars.pluginUrl) ? window.kasendemiVars.pluginUrl : "";
    const TRAINING_ASSET_BASE = pluginUrl + "assets/entrainement/";
    const assetUrl = (file) => TRAINING_ASSET_BASE + encodeURI(file);
    const STORAGE_KEY = "ks_training_simulations";
    const bgPath = assetUrl("terrain-entrainement.jpg");
    const bgFallbackPath = TRAINING_ASSET_BASE + encodeURI("terrain entrainement.jpg");
    const terrainSize = { width: 900, height: 600 };

    const materials = [
      "ballon.png",
      "1ballon.png",
      "plot orange.png",
      "piquet.png",
      "piquet jaune.png",
      "cerceau rouge.png",
      "cerceau jaune.png",
      "echelle de rythme jaune horizontale.png",
      "echelle de rythme verticale rouge.png",
      "grand but face.png",
      "mini but face.png",
      "mini but dos.png",
      "mini but face profil droit.png",
      "mini but face profil gauche.png",
      "mini but dos profil droit.png",
      "mini but dos profil gauche.png",
      "manequin mur unique.png",
      "mannequi mur a 3.png",
      "hai rouge profil gauche.png",
      "haie de face.png"
    ];

    let view = { x: 0, y: 0, scale: 1 };
    let selectedId = null;
    let isPlaying = false;
    let dragContext = null;
    let handleContext = null;
    let panContext = null;
    let preChangeSnapshot = null;

    const state = loadState();
    let currentSimKey = state.currentSim || Object.keys(state.simulations)[0];
    if (!state.simulations[currentSimKey]) currentSimKey = Object.keys(state.simulations)[0];
    let currentSeqIndex = state.simulations[currentSimKey].currentSeq || 0;
    let trainingArrowMode = false;
    let arrowStartId = null;

    const els = {
      simSelect: document.getElementById("training-sim-select"),
      seqSelect: document.getElementById("training-seq-select"),
      playBtn: document.getElementById("training-play-seq"),
      newSim: document.getElementById("training-new-sim"),
      renameSim: document.getElementById("training-rename-sim"),
      deleteSim: document.getElementById("training-delete-sim"),
      newSeq: document.getElementById("training-new-seq"),
      renameSeq: document.getElementById("training-rename-seq"),
      deleteSeq: document.getElementById("training-delete-seq"),
      nextSeq: document.getElementById("training-next-seq"),
      prevSeq: document.getElementById("training-prev-seq"),
      addPlayer: document.getElementById("training-add-player"),
      arrowMode: document.getElementById("training-arrow-mode"),
      dupBtn: document.getElementById("training-duplicate"),
      delBtn: document.getElementById("training-delete"),
      exportPng: document.getElementById("training-export-png"),
      exportVideo: document.getElementById("training-export-video"),
      materials: document.getElementById("training-materials"),
      sequencesPanel: document.getElementById("training-sequence-panel"),
      selectionPanel: document.getElementById("training-selection-panel"),
      toolbarAdvanced: document.getElementById("toolbar-advanced"),
      toolbarMain: document.getElementById("toolbar-main"),
      fieldScroll: document.getElementById("kas-field-scroll"),
      uiDock: document.getElementById("kas-ui-dock"),
      returnTop: document.getElementById("ks-return-top"),
      classicRoot: document.querySelector(".kasendemi-tactique-frontend")
    };

    const objectsLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
    objectsLayer.setAttribute("id", "training-objects");
    svg.appendChild(objectsLayer);

    const toast = createToast();

    renderTerrain();
    renderSelectors();
    renderMaterials();
    renderSequencePanel();
    renderSelectionPanel();
    drawObjects();

    attachUI();
    attachSvgInteractions();
    attachKeyboard();

    function loadState(){
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch(e){ console.warn("Lecture stockage entraînement impossible", e); }
      return defaultState();
    }

    function defaultState(){
      return {
        currentSim: "Séance 1",
        simulations: {
          "Séance 1": {
            name: "Séance 1",
            sequences: [{ name: "Séquence 1", objects: [], arrows: [], lastSnapshot: [] }],
            currentSeq: 0
          }
        }
      };
    }

    function normalizeSequence(seq){
      if (!Array.isArray(seq.objects)) seq.objects = [];
      seq.objects.forEach(o => { if (!o.type) o.type = "material"; if (typeof o.scale === "undefined") o.scale = 1; });
      if (!Array.isArray(seq.arrows)) seq.arrows = [];
      if (!Array.isArray(seq.lastSnapshot)) seq.lastSnapshot = [];
    }

    function saveState(){
      try {
        state.currentSim = currentSimKey;
        state.simulations[currentSimKey].currentSeq = currentSeqIndex;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch(e){ console.warn("Sauvegarde entraînement impossible", e); }
    }

    function getCurrentSim(){
      const sim = state.simulations[currentSimKey];
      return sim || state.simulations[Object.keys(state.simulations)[0]];
    }

    function getCurrentSeq(){
      const sim = getCurrentSim();
      const seq = sim.sequences[currentSeqIndex];
      const usable = seq || sim.sequences[0];
      normalizeSequence(usable);
      return usable;
    }

    function renderTerrain(){
      console.debug("[training] terrain url", bgPath, "fallback", bgFallbackPath);
      svg.innerHTML = "";
      const bg = document.createElementNS(svg.namespaceURI, "image");
      bg.setAttribute("x", 0); bg.setAttribute("y", 0);
      bg.setAttribute("width", terrainSize.width); bg.setAttribute("height", terrainSize.height);
      bg.setAttribute("preserveAspectRatio", "xMidYMid slice");
      bg.dataset.background = "1";
      bg.setAttributeNS("http://www.w3.org/1999/xlink", "href", bgPath);
      bg.addEventListener("error", () => {
        console.warn("Fond entraînement manquant: ", bgPath);
        if (!bg.dataset.fallback && bgFallbackPath){
          bg.dataset.fallback = "1";
          bg.setAttributeNS("http://www.w3.org/1999/xlink", "href", bgFallbackPath);
        }
      });
      svg.appendChild(bg);
      svg.appendChild(objectsLayer);
      applyView();
    }

    function clampView(){
      const vbWidth = terrainSize.width / view.scale;
      const vbHeight = terrainSize.height / view.scale;
      const maxX = terrainSize.width - vbWidth;
      const maxY = terrainSize.height - vbHeight;
      view.x = Math.min(Math.max(0, view.x), Math.max(0, maxX));
      view.y = Math.min(Math.max(0, view.y), Math.max(0, maxY));
    }
    function applyView(){
      clampView();
      const vbWidth = terrainSize.width / view.scale;
      const vbHeight = terrainSize.height / view.scale;
      svg.setAttribute("viewBox", `${view.x} ${view.y} ${vbWidth} ${vbHeight}`);
    }

    function renderSelectors(){
      const sim = getCurrentSim();
      els.simSelect.innerHTML = "";
      Object.keys(state.simulations).forEach(key => {
        const opt = document.createElement("option");
        opt.value = key; opt.textContent = state.simulations[key].name || key;
        els.simSelect.appendChild(opt);
      });
      els.simSelect.value = currentSimKey;

      els.seqSelect.innerHTML = "";
      sim.sequences.forEach((seq, i)=>{
        const opt = document.createElement("option");
        opt.value = i; opt.textContent = seq.name;
        els.seqSelect.appendChild(opt);
      });
      els.seqSelect.value = currentSeqIndex;
    }

    function renderMaterials(){
      if (!els.materials) return;
      els.materials.innerHTML = "";
      const title = document.createElement("h3");
      title.textContent = "Bibliothèque de matériels";
      els.materials.appendChild(title);
      const list = document.createElement("div");
      list.className = "training-material-list";
      materials.forEach(file => {
        const url = assetUrl(file);
        console.debug("[training] material url", url);
        const card = document.createElement("button");
        card.type = "button";
        card.className = "training-material";
        const img = document.createElement("img");
        img.loading = "lazy";
        img.alt = file;
        img.src = url;
        img.onerror = () => { img.remove(); card.classList.add("training-material-missing"); };
        const label = document.createElement("span");
        label.textContent = file.replace(/\.[^.]+$/, "");
        card.appendChild(img);
        card.appendChild(label);
        card.addEventListener("click", ()=> addMaterial(file));
        list.appendChild(card);
      });
      els.materials.appendChild(list);
    }

    function renderSequencePanel(){
      if (!els.sequencesPanel) return;
      const sim = getCurrentSim();
      sim.sequences.forEach(normalizeSequence);
      els.sequencesPanel.innerHTML = "";
      const title = document.createElement("h3");
      title.textContent = "Séquences";
      els.sequencesPanel.appendChild(title);
      const list = document.createElement("div");
      list.className = "training-seq-list";
      sim.sequences.forEach((seq, idx)=>{
        const row = document.createElement("div");
        row.className = "training-seq-row";
        row.dataset.active = idx === currentSeqIndex ? "1" : "0";
        const name = document.createElement("div");
        name.textContent = seq.name;
        const badge = document.createElement("span");
        badge.className = "training-badge";
        badge.textContent = `${seq.objects?.length || 0} obj.`;
        row.appendChild(name);
        row.appendChild(badge);
        row.addEventListener("click", ()=>{ currentSeqIndex = idx; renderSelectors(); drawObjects(); saveState(); });
        list.appendChild(row);
      });
      els.sequencesPanel.appendChild(list);
    }

    function getObjectPosition(id){
      const seq = getCurrentSeq();
      const obj = (seq.objects || []).find(o => o.id === id);
      if (!obj) return null;
      return { x: obj.x, y: obj.y };
    }

    function ensureArrowMarker(){
      let defs = svg.querySelector("defs");
      if (!defs){ defs = document.createElementNS(svg.namespaceURI, "defs"); svg.appendChild(defs); }
      if (svg.querySelector("#training-arrow-head")) return;
      const marker = document.createElementNS(svg.namespaceURI, "marker");
      marker.setAttribute("id", "training-arrow-head");
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      marker.setAttribute("refX", "5");
      marker.setAttribute("refY", "5");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "strokeWidth");
      const path = document.createElementNS(svg.namespaceURI, "path");
      path.setAttribute("d", "M0,0 L10,5 L0,10 z");
      path.setAttribute("fill", "#ffba3e");
      marker.appendChild(path);
      defs.appendChild(marker);
    }

    function drawArrows(){
      ensureArrowMarker();
      const seq = getCurrentSeq();
      const arrowLayerId = "training-arrows";
      let arrowLayer = svg.querySelector(`#${arrowLayerId}`);
      if (!arrowLayer){
        arrowLayer = document.createElementNS(svg.namespaceURI, "g");
        arrowLayer.setAttribute("id", arrowLayerId);
        svg.insertBefore(arrowLayer, svg.firstChild);
      }
      while (arrowLayer.firstChild) arrowLayer.removeChild(arrowLayer.firstChild);
      (seq.arrows || []).forEach(a => {
        const from = getObjectPosition(a.from);
        const to = getObjectPosition(a.to);
        if (!from || !to) return;
        const line = document.createElementNS(svg.namespaceURI, "line");
        line.setAttribute("x1", from.x);
        line.setAttribute("y1", from.y);
        line.setAttribute("x2", to.x);
        line.setAttribute("y2", to.y);
        line.setAttribute("stroke", "#ffba3e");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("marker-end", "url(#training-arrow-head)");
        arrowLayer.appendChild(line);
      });
    }

    function renderSelectionPanel(){
      if (!els.selectionPanel) return;
      els.selectionPanel.innerHTML = "";
      const title = document.createElement("h3");
      title.textContent = "Sélection";
      els.selectionPanel.appendChild(title);
      const seq = getCurrentSeq();
      const obj = seq.objects.find(o => o.id === selectedId);
      if (!obj){
        const p = document.createElement("p");
        p.textContent = "Aucun objet sélectionné.";
        els.selectionPanel.appendChild(p);
        return;
      }
      const name = document.createElement("div");
      name.textContent = obj.type === "player" ? (obj.label || "Joueur") : (obj.asset || "Matériel");
      name.style.fontWeight = "700";
      els.selectionPanel.appendChild(name);

      const sizeWrap = document.createElement("div");
      sizeWrap.style.display = "flex";
      sizeWrap.style.alignItems = "center";
      sizeWrap.style.gap = "8px";
      const lbl = document.createElement("label");
      lbl.textContent = "Taille";
      lbl.style.minWidth = "60px";
      const slider = document.createElement("input");
      slider.type = "range";
      slider.min = "0.2";
      slider.max = "3";
      slider.step = "0.05";
      slider.value = obj.scale || 1;
      const val = document.createElement("span");
      val.textContent = (obj.scale || 1).toFixed(2);
      slider.addEventListener("input", ()=>{
        obj.scale = Math.max(0.2, Math.min(3, parseFloat(slider.value || "1")));
        val.textContent = obj.scale.toFixed(2);
        drawObjects();
        saveState();
      });
      sizeWrap.appendChild(lbl);
      sizeWrap.appendChild(slider);
      sizeWrap.appendChild(val);
      els.selectionPanel.appendChild(sizeWrap);
    }

    function attachUI(){
      trainingModeBtn.addEventListener("click", ()=> setTrainingActive(true));
      document.addEventListener("kas-training-exit", ()=> setTrainingActive(false));

      els.simSelect.addEventListener("change", ()=>{
        currentSimKey = els.simSelect.value;
        currentSeqIndex = state.simulations[currentSimKey].currentSeq || 0;
        selectedId = null;
        renderSelectors();
        renderSequencePanel();
        drawObjects();
        saveState();
      });

      els.seqSelect.addEventListener("change", ()=>{
        currentSeqIndex = parseInt(els.seqSelect.value, 10) || 0;
        getCurrentSim().currentSeq = currentSeqIndex;
        selectedId = null;
        renderSequencePanel();
        drawObjects();
        saveState();
      });

      els.newSim.addEventListener("click", ()=>{
        const name = prompt("Nom de la nouvelle séance ?", `Séance ${Object.keys(state.simulations).length + 1}`);
        if (!name) return;
        if (state.simulations[name]) { toast.show("Nom déjà utilisé"); return; }
        state.simulations[name] = { name, sequences: [{ name: "Séquence 1", objects: [], lastSnapshot: [] }], currentSeq: 0 };
        currentSimKey = name; currentSeqIndex = 0; selectedId = null;
        renderSelectors(); renderSequencePanel(); drawObjects(); saveState();
      });

      els.renameSim.addEventListener("click", ()=>{
        const sim = getCurrentSim();
        const name = prompt("Renommer la séance", sim.name || currentSimKey);
        if (!name) return;
        const previous = currentSimKey;
        sim.name = name;
        state.simulations[name] = sim;
        if (name !== previous) delete state.simulations[previous];
        currentSimKey = name;
        renderSelectors(); renderSequencePanel(); saveState();
      });

      els.deleteSim.addEventListener("click", ()=>{
        if (Object.keys(state.simulations).length <= 1) { toast.show("Impossible de supprimer la dernière séance"); return; }
        if (!confirm("Supprimer la séance actuelle ?")) return;
        delete state.simulations[currentSimKey];
        currentSimKey = Object.keys(state.simulations)[0];
        currentSeqIndex = state.simulations[currentSimKey].currentSeq || 0;
        selectedId = null;
        renderSelectors(); renderSequencePanel(); drawObjects(); saveState();
      });

      els.newSeq.addEventListener("click", ()=>{
        const sim = getCurrentSim();
        const name = prompt("Nom de la séquence ?", `Séquence ${sim.sequences.length + 1}`);
        if (!name) return;
        sim.sequences.push({ name, objects: [], arrows: [], lastSnapshot: [] });
        currentSeqIndex = sim.sequences.length - 1;
        selectedId = null;
        renderSelectors(); renderSequencePanel(); drawObjects(); saveState();
      });

      els.renameSeq.addEventListener("click", ()=>{
        const seq = getCurrentSeq();
        const name = prompt("Renommer la séquence", seq.name);
        if (!name) return;
        seq.name = name;
        renderSelectors(); renderSequencePanel(); saveState();
      });

      els.deleteSeq.addEventListener("click", ()=>{
        const sim = getCurrentSim();
        if (sim.sequences.length <= 1) { toast.show("Au moins une séquence est requise"); return; }
        if (!confirm("Supprimer la séquence actuelle ?")) return;
        sim.sequences.splice(currentSeqIndex, 1);
        currentSeqIndex = Math.max(0, currentSeqIndex - 1);
        selectedId = null;
        renderSelectors(); renderSequencePanel(); drawObjects(); saveState();
      });

      els.nextSeq.addEventListener("click", ()=>{ navigateSeq(1); });
      els.prevSeq.addEventListener("click", ()=>{ navigateSeq(-1); });
      els.playBtn.addEventListener("click", ()=> playSequence());
      els.addPlayer.addEventListener("click", ()=> addPlayer());
      els.arrowMode.addEventListener("click", ()=> toggleArrowMode());
      els.dupBtn.addEventListener("click", ()=> duplicateSelected());
      els.delBtn.addEventListener("click", ()=> deleteSelected());
      els.exportPng.addEventListener("click", ()=> exportPng());
      els.exportVideo.addEventListener("click", ()=> exportVideo());
    }

    function setTrainingActive(active){
      document.body.dataset.ksTraining = active ? "1" : "0";
      trainingRoot.style.display = active ? "block" : "none";
      [els.toolbarAdvanced, els.toolbarMain, els.fieldScroll, els.uiDock, els.returnTop].forEach(node => {
        if (!node) return;
        node.dataset.trainingHidden = active ? "1" : "0";
        node.style.display = active ? "none" : "";
      });
      if (!active){
        selectedId = null;
        drawObjects();
        renderSelectionPanel();
      }
    }

    function navigateSeq(delta){
      const sim = getCurrentSim();
      currentSeqIndex = (currentSeqIndex + delta + sim.sequences.length) % sim.sequences.length;
      sim.currentSeq = currentSeqIndex;
      selectedId = null;
      renderSelectors(); renderSequencePanel(); drawObjects(); saveState();
    }

    function toggleArrowMode(){
      trainingArrowMode = !trainingArrowMode;
      arrowStartId = null;
      if (els.arrowMode) els.arrowMode.dataset.active = trainingArrowMode ? "1" : "0";
      toast.show(trainingArrowMode ? "Mode flèche activé" : "Mode flèche désactivé");
    }

    function addMaterial(file){
      const seq = getCurrentSeq();
      const id = `obj_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      const obj = {
        id,
        type: "material",
        asset: file,
        x: terrainSize.width / 2,
        y: terrainSize.height / 2,
        scale: 1,
        rotation: 0,
        w: 80,
        h: 80
      };
      seq.objects.push(obj);
      seq.lastSnapshot = seq.lastSnapshot || [];
      selectedId = id;
      drawObjects();
      renderSequencePanel();
      saveState();
      toast.show("Matériel ajouté");
    }

    function addPlayer(){
      const seq = getCurrentSeq();
      const id = `ply_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      const obj = {
        id,
        type: "player",
        label: `J${(seq.objects.filter(o=>o.type==="player").length||0)+1}`,
        color: "#00bfff",
        x: terrainSize.width / 2,
        y: terrainSize.height / 2,
        scale: 1,
        rotation: 0,
        w: 60,
        h: 60
      };
      seq.objects.push(obj);
      seq.lastSnapshot = seq.lastSnapshot || [];
      selectedId = id;
      drawObjects();
      renderSequencePanel();
      renderSelectionPanel();
      saveState();
      toast.show("Joueur ajouté");
    }

    function drawObjects(showHandles = true){
      while (objectsLayer.firstChild) objectsLayer.removeChild(objectsLayer.firstChild);
      drawArrows();
      const seq = getCurrentSeq();
      if (!seq || !seq.objects) return;
      seq.objects.forEach(obj => {
        const g = document.createElementNS(svg.namespaceURI, "g");
        g.dataset.trainingObject = "1";
        g.dataset.id = obj.id;
        g.setAttribute("transform", `translate(${obj.x} ${obj.y}) rotate(${obj.rotation||0}) scale(${obj.scale||1})`);

        if (obj.type === "player"){
          const radius = (obj.w||60)/2 * (obj.scale||1);
          const circle = document.createElementNS(svg.namespaceURI, "circle");
          circle.setAttribute("r", radius);
          circle.setAttribute("fill", obj.color || "#00bfff");
          circle.setAttribute("stroke", "#102030");
          circle.setAttribute("stroke-width", 2);
          g.appendChild(circle);

          const label = document.createElementNS(svg.namespaceURI, "text");
          label.textContent = obj.label || "";
          label.setAttribute("fill", "#fff");
          label.setAttribute("font-size", "14");
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("dominant-baseline", "middle");
          g.appendChild(label);
        } else {
          const img = document.createElementNS(svg.namespaceURI, "image");
          img.setAttribute("href", assetUrl(obj.asset));
          img.setAttribute("x", -(obj.w||80)/2);
          img.setAttribute("y", -(obj.h||80)/2);
          img.setAttribute("width", obj.w||80);
          img.setAttribute("height", obj.h||80);
          img.setAttribute("preserveAspectRatio", "xMidYMid meet");
          img.addEventListener("error", ()=> console.warn("Asset entraînement manquant:", obj.asset));
          g.appendChild(img);
        }

        if (selectedId === obj.id && showHandles){
          const sel = document.createElementNS(svg.namespaceURI, "rect");
          const baseSize = obj.type === "player" ? (obj.w||60) : (obj.w||80);
          const boxSize = baseSize * (obj.scale||1);
          sel.setAttribute("x", -boxSize/2);
          sel.setAttribute("y", -boxSize/2);
          sel.setAttribute("width", boxSize);
          sel.setAttribute("height", boxSize);
          sel.setAttribute("class", "training-selection");
          g.appendChild(sel);

          const resize = document.createElementNS(svg.namespaceURI, "rect");
          resize.setAttribute("class", "training-handle");
          resize.dataset.type = "resize";
          resize.dataset.id = obj.id;
          resize.setAttribute("x", boxSize/2 - 8);
          resize.setAttribute("y", -boxSize/2 - 8);
          resize.setAttribute("width", 16);
          resize.setAttribute("height", 16);
          resize.dataset.handle = "1";
          g.appendChild(resize);

          const rotate = document.createElementNS(svg.namespaceURI, "circle");
          rotate.setAttribute("class", "training-handle");
          rotate.dataset.type = "rotate";
          rotate.dataset.id = obj.id;
          rotate.setAttribute("cx", 0);
          rotate.setAttribute("cy", -(boxSize/2 + 24));
          rotate.setAttribute("r", 8);
          rotate.dataset.handle = "1";
          g.appendChild(rotate);
        }

        g.addEventListener("pointerdown", e => startObjectDrag(e, obj.id));
        objectsLayer.appendChild(g);
      });
      renderSelectionPanel();
    }

    function getSvgPoint(evt){
      const rect = svg.getBoundingClientRect();
      const x = ((evt.clientX - rect.left) / rect.width) * (terrainSize.width / view.scale) + view.x;
      const y = ((evt.clientY - rect.top) / rect.height) * (terrainSize.height / view.scale) + view.y;
      return { x, y };
    }

    function startObjectDrag(evt, id){
      const handleType = evt.target.dataset?.type;
      if (handleType){
        const seq = getCurrentSeq();
        preChangeSnapshot = cloneObjects(seq.objects);
        selectedId = id;
        handleContext = { id, type: handleType, start: getSvgPoint(evt) };
        evt.stopPropagation();
        svg.setPointerCapture(evt.pointerId);
        return;
      }
      const seq = getCurrentSeq();
      const obj = seq.objects.find(o => o.id === id);
      if (!obj) return;
      if (trainingArrowMode){
        if (!arrowStartId){
          arrowStartId = id;
          toast.show("Définir la cible de la flèche");
        } else if (arrowStartId !== id){
          seq.arrows.push({ id: `arr_${Date.now()}`, from: arrowStartId, to: id, type: "move_player" });
          arrowStartId = null;
          drawObjects();
          saveState();
          toast.show("Flèche ajoutée");
        }
        selectedId = id;
        renderSelectionPanel();
        return;
      }
      preChangeSnapshot = cloneObjects(seq.objects);
      selectedId = id;
      renderSelectionPanel();
      const start = getSvgPoint(evt);
      dragContext = { id, start, origin: { x: obj.x, y: obj.y } };
      svg.setPointerCapture(evt.pointerId);
      evt.preventDefault();
    }

    function attachSvgInteractions(){
      svg.addEventListener("pointermove", evt => {
        if (isPlaying) return;
        if (handleContext){
          evt.preventDefault();
          const seq = getCurrentSeq();
          const obj = seq.objects.find(o => o.id === handleContext.id);
          if (!obj) return;
          const pt = getSvgPoint(evt);
          if (handleContext.type === "resize"){
            const dist = Math.max(20, Math.hypot(pt.x - obj.x, pt.y - obj.y));
            obj.scale = Math.min(3, Math.max(0.3, (dist / ((obj.w||80)/2))));
          } else if (handleContext.type === "rotate"){
            const angle = Math.atan2(pt.y - obj.y, pt.x - obj.x) * 180 / Math.PI;
            obj.rotation = angle;
          }
          drawObjects();
          renderSelectionPanel();
          return;
        }
        if (dragContext){
          evt.preventDefault();
          const pt = getSvgPoint(evt);
          const seq = getCurrentSeq();
          const obj = seq.objects.find(o => o.id === dragContext.id);
          if (!obj) return;
          obj.x = dragContext.origin.x + (pt.x - dragContext.start.x);
          obj.y = dragContext.origin.y + (pt.y - dragContext.start.y);
          drawObjects();
          renderSelectionPanel();
          return;
        }
        if (panContext){
          evt.preventDefault();
          const pt = getSvgPoint(evt);
          view.x = panContext.originView.x - (pt.x - panContext.start.x);
          view.y = panContext.originView.y - (pt.y - panContext.start.y);
          applyView();
        }
      });

      svg.addEventListener("pointerup", evt => finishPointer(evt));
      svg.addEventListener("pointercancel", evt => finishPointer(evt));

      svg.addEventListener("wheel", evt => {
        if (!evt.ctrlKey) evt.preventDefault();
        const delta = -evt.deltaY * 0.0015;
        const factor = 1 + delta;
        const mouse = getSvgPoint(evt);
        const newScale = Math.min(2.8, Math.max(0.5, view.scale * factor));
        const k = newScale / view.scale;
        view.x = mouse.x - (mouse.x - view.x) * k;
        view.y = mouse.y - (mouse.y - view.y) * k;
        view.scale = newScale;
        applyView();
      }, { passive: false });

      svg.addEventListener("pointerdown", evt => {
        if (evt.target.dataset.background === "1"){
          selectedId = null; drawObjects(); renderSelectionPanel();
          panContext = { start: getSvgPoint(evt), originView: { ...view } };
          svg.setPointerCapture(evt.pointerId);
        }
      });
    }

    function finishPointer(evt){
      if (handleContext){
        persistAfterChange();
        handleContext = null;
      }
      if (dragContext){
        persistAfterChange();
        dragContext = null;
      }
      if (panContext){
        panContext = null;
      }
      if (svg.hasPointerCapture(evt.pointerId)) svg.releasePointerCapture(evt.pointerId);
    }

    function persistAfterChange(){
      const seq = getCurrentSeq();
      if (preChangeSnapshot) seq.lastSnapshot = preChangeSnapshot;
      preChangeSnapshot = null;
      saveState();
      renderSequencePanel();
    }

    function cloneObjects(list){
      return (list || []).map(o => ({ ...o }));
    }

    function duplicateSelected(){
      const seq = getCurrentSeq();
      const obj = seq.objects.find(o => o.id === selectedId);
      if (!obj) { toast.show("Aucun objet sélectionné"); return; }
      const copy = { ...obj, id: `obj_${Date.now()}_${Math.floor(Math.random()*1000)}`, x: obj.x + 18, y: obj.y + 18 };
      seq.lastSnapshot = cloneObjects(seq.objects);
      seq.objects.push(copy);
      selectedId = copy.id;
      drawObjects();
      renderSequencePanel();
      saveState();
    }

    function deleteSelected(){
      const seq = getCurrentSeq();
      const idx = seq.objects.findIndex(o => o.id === selectedId);
      if (idx === -1) { toast.show("Aucun objet sélectionné"); return; }
      seq.arrows = (seq.arrows || []).filter(a => a.from !== selectedId && a.to !== selectedId);
      seq.lastSnapshot = cloneObjects(seq.objects);
      seq.objects.splice(idx, 1);
      selectedId = null;
      drawObjects();
      renderSequencePanel();
      saveState();
    }

    function playSequence(){
      if (isPlaying) return;
      const seq = getCurrentSeq();
      const startState = (seq.lastSnapshot && seq.lastSnapshot.length) ? seq.lastSnapshot : cloneObjects(seq.objects);
      const endState = cloneObjects(seq.objects);
      const duration = 1200;
      const startTime = performance.now();
      isPlaying = true;
      function step(ts){
        const t = Math.min(1, (ts - startTime) / duration);
        const blend = interpolateStates(startState, endState, t);
        drawInterpolated(blend);
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          seq.objects = endState;
          seq.lastSnapshot = startState;
          isPlaying = false;
          drawObjects();
          saveState();
        }
      }
      requestAnimationFrame(step);
    }

    function interpolateStates(start, end, t){
      const mapStart = new Map(start.map(o => [o.id, o]));
      return end.map(o => {
        const s = mapStart.get(o.id) || o;
        return {
          ...o,
          x: s.x + (o.x - s.x) * t,
          y: s.y + (o.y - s.y) * t,
          rotation: s.rotation + (o.rotation - s.rotation) * t,
          scale: s.scale + (o.scale - s.scale) * t
        };
      });
    }

    function drawInterpolated(objects){
      while (objectsLayer.firstChild) objectsLayer.removeChild(objectsLayer.firstChild);
      drawArrows();
      objects.forEach(obj => {
        const g = document.createElementNS(svg.namespaceURI, "g");
        g.setAttribute("transform", `translate(${obj.x} ${obj.y}) rotate(${obj.rotation||0}) scale(${obj.scale||1})`);
        if (obj.type === "player"){
          const radius = (obj.w||60)/2 * (obj.scale||1);
          const circle = document.createElementNS(svg.namespaceURI, "circle");
          circle.setAttribute("r", radius);
          circle.setAttribute("fill", obj.color || "#00bfff");
          circle.setAttribute("stroke", "#102030");
          circle.setAttribute("stroke-width", 2);
          g.appendChild(circle);

          const label = document.createElementNS(svg.namespaceURI, "text");
          label.textContent = obj.label || "";
          label.setAttribute("fill", "#fff");
          label.setAttribute("font-size", "14");
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("dominant-baseline", "middle");
          g.appendChild(label);
        } else {
          const img = document.createElementNS(svg.namespaceURI, "image");
          img.setAttribute("href", assetUrl(obj.asset));
          img.setAttribute("x", -(obj.w||80)/2);
          img.setAttribute("y", -(obj.h||80)/2);
          img.setAttribute("width", obj.w||80);
          img.setAttribute("height", obj.h||80);
          img.setAttribute("preserveAspectRatio", "xMidYMid meet");
          g.appendChild(img);
        }
        objectsLayer.appendChild(g);
      });
    }

    const imageCache = new Map();
    function getImage(src, fallback){
      const key = `${encodeURI(src)}|${fallback ? encodeURI(fallback) : ""}`;
      if (imageCache.has(key)) return imageCache.get(key);
      const p = new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => {
          if (fallback) {
            const alt = new Image();
            alt.crossOrigin = "anonymous";
            alt.onload = () => resolve(alt);
            alt.onerror = () => { console.warn("Ressource entraînement introuvable", src); resolve(null); };
            alt.src = encodeURI(fallback);
            return;
          }
          console.warn("Ressource entraînement introuvable", src);
          resolve(null);
        };
        img.src = encodeURI(src);
      });
      imageCache.set(key, p);
      return p;
    }

    async function drawStateToCanvas(objects, arrows = getCurrentSeq().arrows || [], existingCanvas, existingCtx){
      const canvas = existingCanvas || document.createElement("canvas");
      canvas.width = terrainSize.width; canvas.height = terrainSize.height;
      const ctx = existingCtx || canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bg = await getImage(bgPath, bgFallbackPath);
      if (bg) ctx.drawImage(bg, 0, 0, canvas.width, canvas.height); else {
        ctx.fillStyle = "#0f2c19"; ctx.fillRect(0,0,canvas.width, canvas.height);
      }
      for (const obj of objects){
        const img = await getImage(assetUrl(obj.asset), pluginUrl + encodeURI(obj.asset));
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(((obj.rotation||0) * Math.PI)/180);
        if (obj.type === "player"){
          const radius = (obj.w||60)/2 * (obj.scale||1);
          ctx.fillStyle = obj.color || "#00bfff";
          ctx.strokeStyle = "#102030";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI*2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#fff";
          ctx.font = "14px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(obj.label || "", 0, 0);
        } else {
          const sizeW = (obj.w||80) * (obj.scale||1);
          const sizeH = (obj.h||80) * (obj.scale||1);
          if (img) {
            ctx.drawImage(img, -sizeW/2, -sizeH/2, sizeW, sizeH);
          } else {
            ctx.fillStyle = "#ffba3e";
            ctx.fillRect(-sizeW/2, -sizeH/2, sizeW, sizeH);
          }
        }
        ctx.restore();
      }
      ctx.strokeStyle = "#ffba3e";
      ctx.fillStyle = "#ffba3e";
      ctx.lineWidth = 3;
      arrows.forEach(a => {
        const from = objects.find(o => o.id === a.from);
        const to = objects.find(o => o.id === a.to);
        if (!from || !to) return;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        const headLen = 10;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI/6), to.y - headLen * Math.sin(angle - Math.PI/6));
        ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI/6), to.y - headLen * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fill();
      });
      return canvas;
    }

    async function exportPng(){
      const seq = getCurrentSeq();
      const canvas = await drawStateToCanvas(seq.objects, seq.arrows);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${getCurrentSeq().name || "entrainement"}.png`;
        a.click(); URL.revokeObjectURL(url);
      });
    }

    async function exportVideo(){
      const seq = getCurrentSeq();
      const startState = (seq.lastSnapshot && seq.lastSnapshot.length) ? seq.lastSnapshot : cloneObjects(seq.objects);
      const endState = cloneObjects(seq.objects);
      const canvas = document.createElement("canvas");
      canvas.width = terrainSize.width; canvas.height = terrainSize.height;
      const ctx = canvas.getContext("2d");
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `${seq.name || "entrainement"}.webm`;
        a.click(); URL.revokeObjectURL(url);
      };
      recorder.start();
      const frames = 90;
      let frame = 0;
      async function frameStep(){
        const t = Math.min(1, frame / (frames - 1));
        const blend = interpolateStates(startState, endState, t);
        await drawStateToCanvas(blend, seq.arrows, canvas, ctx);
        frame++;
        if (frame < frames){
          requestAnimationFrame(frameStep);
        } else {
          recorder.stop();
        }
      }
      frameStep();
    }

    function attachKeyboard(){
      document.addEventListener("keydown", e => {
        if (document.body.dataset.ksTraining !== "1") return;
        if (e.key === "Delete" || e.key === "Backspace") { deleteSelected(); }
        if (e.key.toLowerCase() === "d" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); duplicateSelected(); }
      });
    }

    function attachMouseLeave(){
      document.addEventListener("pointerup", ()=>{ dragContext=null; handleContext=null; panContext=null; });
    }
    attachMouseLeave();

    function createToast(){
      const el = document.createElement("div");
      el.className = "training-toast";
      document.body.appendChild(el);
      let timer = null;
      return {
        show(msg){
          el.textContent = msg;
          el.dataset.active = "1";
          clearTimeout(timer);
          timer = setTimeout(()=>{ el.dataset.active = "0"; }, 1800);
        }
      };
    }
  });
})();
