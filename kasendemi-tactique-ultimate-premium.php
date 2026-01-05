<?php
/*
Plugin Name: Kasendemi Tactique Ultimate Premium Front
Description: Outil tactique 3D ultime — modes schéma tactique et composition, sécurisé, multi-utilisateur, front-end avec collaboration future.
Version: 1.4
Author: Kasendemi Sport
*/

// ------------------------
// Ajout page admin optionnelle
// ------------------------
add_action('admin_menu', function() {
    add_menu_page(
        'Kasendemi Tactique',
        'Kasendemi Tactique',
        'manage_options',
        'kasendemi-tactique',
        'kasendemi_tactique_admin_page',
        null,
        56
    );
});
// ------------------------
// Enqueue scripts & styles front et admin (ciblé + nonce)
// ------------------------
add_action('admin_enqueue_scripts', function($hook){
    if ($hook !== 'toplevel_page_kasendemi-tactique') return;
    kasendemi_tactique_enqueue_assets();
});

add_action('wp_enqueue_scripts', function(){
    // Front : charger UNIQUEMENT si (1) connecté, (2) page unique, (3) contient le shortcode
    if ( !is_user_logged_in() ) return;
    if ( !is_singular() ) return;
    global $post;
    if ( empty($post) || ! has_shortcode($post->post_content, 'kasendemi_tactique') ) return;
    kasendemi_tactique_enqueue_assets();
});

function kasendemi_tactique_enqueue_assets(){
    $plugin_url = plugin_dir_url(__FILE__);
    wp_enqueue_style('kasendemi-tactique-style', $plugin_url . 'kasendemi-tactique-premium.css', [], '1.5');
    wp_enqueue_script('kasendemi-tactique-script', $plugin_url . 'script.js', [], '1.5', true);
    wp_enqueue_script('kasendemi-training-script', $plugin_url . 'training.js', ['kasendemi-tactique-script'], '1.0', true);
    wp_localize_script('kasendemi-tactique-script', 'kasendemiVars', [
        'pluginUrl'   => $plugin_url,
        'ajaxUrl'     => admin_url('admin-ajax.php'),
        'currentUser' => get_current_user_id(),
        'nonce'       => wp_create_nonce('ksim_nonce'),
    ]);
}



// ------------------------
// Shortcode front-end : affiche l'outil tactique
// ------------------------
add_shortcode('kasendemi_tactique', function() {
    if (!is_user_logged_in()) {
        return '<div class="kas-premium-alert">Merci de vous connecter pour accéder à l’outil tactique premium.</div>';
    }
    ob_start();
    kasendemi_tactique_admin_page();
    return ob_get_clean();
});

// ------------------------
// Contenu commun front + admin (HTML)
// ------------------------
function kasendemi_tactique_admin_page() { ?>
    <div class="kasendemi-tactique-frontend" style="padding:18px;display:flex;flex-direction:column;align-items:center;max-width:100vw;margin:auto;overflow-x:hidden;box-sizing:border-box;">
        <div id="ks-commands-anchor"></div>
        <!-- 1. BOUTONS DE MODE -->
        <div style="margin-bottom:18px; width:100%; max-width:calc(100vw - 36px); box-sizing:border-box; text-align:center;">
            <button id="tacticModeBtn">Schéma tactique</button>
            <button id="compoModeBtn">Composition d'équipe</button>
            <button id="trainingModeBtn">Entraînement</button>
        </div>

        <!-- 2. BARRE AVANCÉE -->
        <div id="toolbar-advanced" style="display:none; margin-bottom:8px; gap:10px; flex-wrap:wrap; justify-content:center; width:100%; max-width:calc(100vw - 36px); box-sizing:border-box;">
            <button id="addPlayerBtn" class="tactic-only">Ajouter un joueur</button>
            <button id="newSimBtn" class="tactic-only">Nouvelle simulation</button>
            <button id="renameSimBtn" class="tactic-only" title="Renommer simulation">✏️</button>
            <button id="deleteSimBtn" class="tactic-only" title="Supprimer simulation">🗑️</button>
            <button id="newSeqBtn" class="tactic-only">Nouvelle séquence</button>
            <button id="renameSeqBtn" class="tactic-only" title="Renommer séquence">✏️</button>
            <button id="deleteSeqBtn" class="tactic-only" title="Supprimer séquence">🗑️</button>
            <button id="clearArrowsBtn" class="tactic-only" title="Supprimer toutes les flèches de la séquence">🧹 Flèches</button>
            <button id="toggleArrowsBtn" class="tactic-only">Afficher/Masquer flèches</button>
            <button id="mode-navigation" class="tactic-only">Mode Navigation</button>
            <button id="mode-edition" class="tactic-only">Mode Édition</button>
            <button id="tool-move-players" class="tactic-only">Déplacer joueurs</button>
            <button id="tool-draw-arrows" class="tactic-only">Flèches / Mouvements</button>
            <!-- ICI : type de flèche dans la barre avancée -->
            <select id="arrow-type-select" class="tactic-only" style="min-width:110px;">
                <option value="move_player">Déplacement</option>
                <option value="dribble">Conduite</option>
                <option value="pass_ground">Passe au sol</option>
                <option value="pass_air">Passe en l'air</option>
                <option value="shoot_ground">Tir au sol</option>
                <option value="shoot_air">Tir en l'air</option>
            </select>
            <select id="simSelect" class="tactic-only" style="min-width:80px;max-width:120px;"></select>
            <select id="seqSelect" class="tactic-only" style="min-width:70px;max-width:100px;"></select>
            <button id="addCompoPlayerBtn" class="compo-only">Ajouter un joueur</button>
            <select id="compoSelect" class="compo-only" style="min-width:90px;max-width:140px;margin-left:6px;"></select>
            <button id="resetCompoBtn" class="compo-only">Nouvelle compo</button>
        </div>

        <!-- Bouton retour commandes en mode édition -->
        <button id="ks-return-top" class="tactic-only ks-edition-only ks-floating-return" style="display:none;">⬆ Retour commandes</button>

        <!-- 3. BARRE PRINCIPALE (lecture) -->
        <div id="toolbar-main" style="display:none; margin-bottom:10px; gap:10px; flex-wrap:wrap; justify-content:center; background:#f8f8fa; border-radius:10px; box-shadow:0 1px 7px #0001; padding:6px; width:100%; max-width:calc(100vw - 36px); box-sizing:border-box; overflow-x:hidden;">
            <button id="playSeqBtn" class="tactic-only">▶ Séquence</button>
            <button id="playAllBtn" class="tactic-only">▶ Tout</button>
            <button id="showSeqStartBtn" class="tactic-only" title="Début de séquence">Début</button>
            <button id="showSeqEndBtn" class="tactic-only" title="Fin de séquence">Fin</button>
            <button id="prevSeqBtn" class="tactic-only" title="Séquence précédente">&lt;</button>
            <button id="nextSeqBtn" class="tactic-only" title="Séquence suivante">&gt;</button>
        </div>

        <!-- 4. WRAPPER SCROLL : terrain + config (scroll horizontal synchronisé) -->
        <div id="kas-field-scroll" style="display:none; width:100%; max-width:calc(100vw - 36px); overflow-x:auto; overflow-y:visible; -webkit-overflow-scrolling:touch; touch-action:pan-x pan-y; box-sizing:border-box;">
            <!-- CONTENEUR DU TERRAIN avec flèches d'orientation -->
            <div id="kas-terrain-wrapper" style="position:relative; display:inline-block;">
                <!-- TERRAIN SVG -->
                <svg id="kasendemi-svg" width="900" height="600" style="border:1px solid #ddd; background:#14341c; display:block;"></svg>
            </div>
            <!-- CONFIG CONTAINER (dans le même scroll que le terrain) -->
            <div id="config-container" style="margin-top:20px;width:900px;min-width:900px;"></div>
        </div>

        <!-- 5. MODULE ENTRAÎNEMENT -->
        <div id="training-root" style="width:100%; max-width:calc(100vw - 36px); box-sizing:border-box; margin-top:12px;">
            <div id="training-toolbar" class="training-toolbar">
                <div class="training-toolbar-row">
                    <span class="session-label" style="font-weight:600">Séance</span>
                    <button id="training-new-sim">Nouvelle séance</button>
                    <button id="training-rename-sim" title="Renommer la séance">✏️</button>
                    <button id="training-delete-sim" title="Supprimer la séance">🗑️</button>
                    <select id="training-sim-select"></select>
                </div>
                <div class="training-toolbar-row">
                    <button id="training-new-seq">Nouvelle séquence</button>
                    <button id="training-rename-seq" title="Renommer la séquence">✏️</button>
                    <button id="training-delete-seq" title="Supprimer la séquence">🗑️</button>
                    <button id="training-prev-seq" title="Séquence précédente">&lt;</button>
                    <select id="training-seq-select"></select>
                    <button id="training-next-seq" title="Séquence suivante">&gt;</button>
                    <button id="training-play-seq">▶ Lecture</button>
                </div>
                <div class="training-toolbar-row">
                    <button id="training-add-player">Ajouter un joueur</button>
                    <button id="training-arrow-mode">Mode flèches</button>
                    <button id="training-duplicate">Dupliquer</button>
                    <button id="training-delete">Supprimer</button>
                    <button id="training-export-png">Export PNG</button>
                    <button id="training-export-video">Export Vidéo</button>
                </div>
            </div>
            <div id="training-materials" class="training-panel training-materials-top"></div>
            <div id="training-scroll" style="width:100%; overflow-x:auto; overflow-y:visible; -webkit-overflow-scrolling:touch;">
                <div id="training-terrain-wrapper" style="position:relative; display:inline-block;">
                    <svg id="training-svg" width="900" height="600" style="border:1px solid #ddd; background:#0f2c19; display:block;"></svg>
                </div>
            </div>
            <div id="training-panels" class="training-panels">
                <div id="training-sequence-panel" class="training-panel"></div>
                <div id="training-selection-panel" class="training-panel"></div>
                <div id="training-players-panel" class="training-panel"></div>
                <div id="training-arrows-panel" class="training-panel"></div>
            </div>
        </div>
    </div>
<?php }

// ------------------------
// AJAX handlers sécurisés
// ------------------------

// Récupérer simulations de l'utilisateur connecté
add_action('wp_ajax_ksim_get_simulations', function() {
    check_ajax_referer('ksim_nonce','nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Non connecté']);
    }
    $user_id = get_current_user_id();
    $sims = get_user_meta($user_id, 'ksim_simulations', true);
    if (!$sims) $sims = [];
    wp_send_json_success(['simulations' => $sims]);
});

// Sauvegarder simulations de l'utilisateur connecté
add_action('wp_ajax_ksim_save_simulations', function() {
    check_ajax_referer('ksim_nonce','nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Non connecté']);
    }
    $json = file_get_contents('php://input');
    $body = json_decode($json, true);
    if (!isset($body['simulations']) || !is_array($body['simulations'])) {
        wp_send_json_error(['message' => 'Données invalides']);
    }
    // Limite taille raisonnable (~500KB)
    if (strlen(json_encode($body['simulations'])) > 500 * 1024) {
        wp_send_json_error(['message' => 'Données trop volumineuses']);
    }
    $user_id = get_current_user_id();
    update_user_meta($user_id, 'ksim_simulations', $body['simulations']);
    wp_send_json_success(['message' => 'Sauvegardé']);
});

// Récupérer compositions de l'utilisateur connecté
add_action('wp_ajax_ksim_get_compos', function() {
    check_ajax_referer('ksim_nonce','nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Non connecté']);
    }
    $user_id = get_current_user_id();
    $compos = get_user_meta($user_id, 'ksim_compos', true);
    if (!$compos) $compos = [];
    wp_send_json_success(['compos' => $compos]);
});

// Sauvegarder compositions de l'utilisateur connecté
add_action('wp_ajax_ksim_save_compos', function() {
    check_ajax_referer('ksim_nonce','nonce');
    if (!is_user_logged_in()) {
        wp_send_json_error(['message' => 'Non connecté']);
    }
    $json = file_get_contents('php://input');
    $body = json_decode($json, true);
    if (!isset($body['compos']) || !is_array($body['compos'])) {
        wp_send_json_error(['message' => 'Données invalides']);
    }
    // Limite taille raisonnable (~500KB)
    if (strlen(json_encode($body['compos'])) > 500 * 1024) {
        wp_send_json_error(['message' => 'Données trop volumineuses']);
    }
    $user_id = get_current_user_id();
    update_user_meta($user_id, 'ksim_compos', $body['compos']);
    wp_send_json_success(['message' => 'Sauvegardé']);
});
add_action('wp_ajax_nopriv_ksim_get_simulations', 'ksim_nopriv');
add_action('wp_ajax_nopriv_ksim_save_simulations', 'ksim_nopriv');
add_action('wp_ajax_nopriv_ksim_get_compos', 'ksim_nopriv');
add_action('wp_ajax_nopriv_ksim_save_compos', 'ksim_nopriv');

function ksim_nopriv(){
    wp_send_json_error(['message' => 'Non connecté'], 401);
}
