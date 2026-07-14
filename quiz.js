/*
  Moteur de quiz partage - Route vers le Million

  Reprend exactement le balisage et les classes CSS du quiz existant
  (.question, .options, .option, .option--juste, .option--faux, .explication,
  .actions, .bouton, .bilan) afin de ne pas dupliquer de styles.

  Chaque page de quiz definit window.QUIZ_DATA avant de charger ce fichier :

    window.QUIZ_DATA = {
      mode: "score",   // ou "profil"
      fr: { ui: {...}, bilan: {...}, questions: [...] },
      en: { ... },
      es: { ... }
    };

  mode "score"  : chaque question porte "bonne" (index de la bonne reponse) et
                  "explication". Le bilan est choisi dans bilan.paliers, une liste
                  ordonnee du plus haut au plus bas : [{ min, l, t }, ...].

  mode "profil" : aucune bonne reponse. Chaque option porte "p", l'identifiant du
                  profil auquel elle ajoute un point. Le bilan est
                  bilan.profils[<id>] = { nom, l, t }. En cas d'egalite, on affiche
                  bilan.defaut.

  mode "calcul" : aucune bonne reponse non plus. Chaque option porte "v", un objet
                  de variables versees dans un accumulateur, et facultativement
                  "note" (identifiant d'une note conditionnelle) ou "texte"
                  (identifiant d'un texte de fin). A la derniere question, le moteur
                  appelle QUIZ_DATA.calcul(vars), qui doit renvoyer
                  { faible: <bool>, min: <nombre>, max: <nombre> }.
                  Le resultat est TOUJOURS une fourchette, jamais un chiffre unique.
                  Le bilan attend : bilan.plage ("{min} ... {max}"), bilan.resultatTitre,
                  bilan.resultat, bilan.methode, bilan.faibleTitre, bilan.faible,
                  bilan.notes{}, bilan.textes{}, bilan.liens[], bilan.avertissement.

                  Variante a verdicts : calcul() peut aussi renvoyer
                  { verdict: <cle>, entete: <texte ou vide>, vals: { ... } }.
                  Le moteur prend alors bilan.verdicts[<cle>] = { l, t } et remplace
                  dans "t" chaque {cle} par vals[cle], deja formate. Cela permet
                  plusieurs paliers de lecture au lieu d'une seule fourchette.

  mode "composite" : score sur 100 reparti en dimensions. Chaque question porte "d"
                  (identifiant de dimension) et chaque option porte "pts". Le moteur
                  additionne le total et le total par dimension, puis identifie la
                  dimension la plus faible. En cas d'egalite, la premiere dimension
                  declaree dans DATA.dimensions l'emporte : l'ordre exprime une
                  priorite (les fondations d'abord), il n'est pas arbitraire.
                  Le bilan attend : bilan.paliers [{min, l, t}] (t accepte {score}),
                  bilan.faibleTitre, bilan.conseils[<dimension>] = { t, lien, lienT },
                  bilan.liens[], bilan.avertissement.

  La langue affichee est celle de la page : le verrou de langue ecrit dans
  localStorage avant le chargement des scripts, donc l'URL fait foi.
*/
(function () {
  "use strict";

  if (!window.QUIZ_DATA) { return; }

  var corps   = document.getElementById("corps");
  var progres = document.getElementById("progres");
  var barre   = document.getElementById("barre");
  if (!corps) { return; }

  var DATA = window.QUIZ_DATA;
  var MODE = DATA.mode || "score";
  var T, index = 0, score = 0, points = {}, repondu = false;
  var vars = {}, notes = [], texteCle = null;
  var dims = {};
  var LOCALE = { fr: "fr-CA", en: "en-CA", es: "es-ES" };

  function currentLang() {
    var l;
    try { l = localStorage.getItem("lang"); } catch (e) { l = null; }
    if (!l) {
      var nav = (navigator.language || "fr").toLowerCase();
      l = nav.indexOf("es") === 0 ? "es" : nav.indexOf("fr") === 0 ? "fr" : "en";
    }
    return (l === "en" || l === "es") ? l : "fr";
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function afficherQuestion() {
    repondu = false;
    var item = T.questions[index];
    var total = T.questions.length;

    if (progres) { progres.textContent = T.ui.progres.replace("{n}", index + 1).replace("{t}", total); }
    if (barre) { barre.style.width = (index / total * 100) + "%"; }

    var html = '<p class="question">' + escapeHtml(item.q) + '</p><div class="options">';
    item.options.forEach(function (opt, i) {
      var texte = (typeof opt === "string") ? opt : opt.t;
      html += '<button class="option" data-i="' + i + '">' + escapeHtml(texte) + '</button>';
    });
    html += '</div><div id="zone-explication"></div><div class="actions" id="zone-action"></div>';
    corps.innerHTML = html;

    corps.querySelectorAll(".option").forEach(function (btn) {
      btn.addEventListener("click", function () { choisir(parseInt(btn.dataset.i, 10)); });
    });
  }

  function choisir(choix) {
    if (repondu) { return; }
    repondu = true;

    var item = T.questions[index];
    var dernier = (index === T.questions.length - 1);
    var boutons = corps.querySelectorAll(".option");

    if (MODE === "profil") {
      var p = item.options[choix].p;
      points[p] = (points[p] || 0) + 1;
      boutons.forEach(function (btn, i) {
        btn.disabled = true;
        if (i === choix) { btn.classList.add("option--juste"); }
      });
    } else if (MODE === "calcul") {
      var opt = item.options[choix];
      if (opt.v) {
        Object.keys(opt.v).forEach(function (k) { vars[k] = opt.v[k]; });
      }
      if (opt.note && notes.indexOf(opt.note) === -1) { notes.push(opt.note); }
      if (opt.texte) { texteCle = opt.texte; }
      boutons.forEach(function (btn, i) {
        btn.disabled = true;
        if (i === choix) { btn.classList.add("option--juste"); }
      });
    } else if (MODE === "composite") {
      var pts = item.options[choix].pts || 0;
      score += pts;
      dims[item.d] = (dims[item.d] || 0) + pts;
      boutons.forEach(function (btn, i) {
        btn.disabled = true;
        if (i === choix) { btn.classList.add("option--juste"); }
      });
    } else {
      boutons.forEach(function (btn, i) {
        btn.disabled = true;
        if (i === item.bonne) { btn.classList.add("option--juste"); }
        if (i === choix && choix !== item.bonne) { btn.classList.add("option--faux"); }
      });
      if (choix === item.bonne) { score++; }
      var intro = (choix === item.bonne) ? T.ui.bonne : T.ui.revoir;
      document.getElementById("zone-explication").innerHTML =
        '<div class="explication"><strong>' + escapeHtml(intro) + '</strong>' +
        escapeHtml(item.explication) + '</div>';
    }

    document.getElementById("zone-action").innerHTML =
      '<button class="bouton" id="suivant">' + escapeHtml(dernier ? T.ui.voir : T.ui.suivant) + '</button>';

    document.getElementById("suivant").addEventListener("click", function () {
      if (dernier) { afficherBilan(); } else { index++; afficherQuestion(); }
    });
  }

  function bilanScore() {
    var paliers = T.bilan.paliers;
    var choisi = paliers[paliers.length - 1];
    for (var i = 0; i < paliers.length; i++) {
      if (score >= paliers[i].min) { choisi = paliers[i]; break; }
    }
    return { entete: score + " / " + T.questions.length, l: choisi.l, t: choisi.t };
  }

  function bilanProfil() {
    var meilleur = null, max = -1, exaequo = false;
    Object.keys(T.bilan.profils).forEach(function (k) {
      var v = points[k] || 0;
      if (v > max) { max = v; meilleur = k; exaequo = false; }
      else if (v === max) { exaequo = true; }
    });
    if (exaequo) { meilleur = T.bilan.defaut; }
    var p = T.bilan.profils[meilleur];
    return { entete: p.nom, l: p.l, t: p.t };
  }

  // Mode calcul : le resultat est une fourchette, jamais un chiffre unique.
  function bilanCalcul() {
    var lang = currentLang();
    var r = DATA.calcul(vars);

    function fmt(n) {
      try { return Math.round(n).toLocaleString(LOCALE[lang]); }
      catch (e) { return String(Math.round(n)); }
    }

    // Variante a verdicts : plusieurs paliers de lecture, valeurs deja calculees.
    if (r.verdict) {
      var v = T.bilan.verdicts[r.verdict];
      var texte = v.t;
      Object.keys(r.vals || {}).forEach(function (k) {
        var val = (typeof r.vals[k] === "number") ? fmt(r.vals[k]) : String(r.vals[k]);
        texte = texte.split("{" + k + "}").join(val);
      });
      return { entete: r.entete || "", l: v.l, t: texte };
    }

    if (r.faible) {
      return { entete: "", l: T.bilan.faibleTitre, t: T.bilan.faible };
    }
    var plage = T.bilan.plage.replace("{min}", fmt(r.min)).replace("{max}", fmt(r.max));
    return {
      entete: plage,
      l: T.bilan.resultatTitre,
      t: T.bilan.resultat.replace("{min}", fmt(r.min)).replace("{max}", fmt(r.max))
    };
  }

  // Mode composite : un score global, et surtout la dimension la plus faible.
  // Un score seul ne dit pas quoi faire; la dimension, oui.
  function bilanComposite() {
    var palier = null;
    for (var i = 0; i < T.bilan.paliers.length; i++) {
      if (score >= T.bilan.paliers[i].min) { palier = T.bilan.paliers[i]; break; }
    }
    if (!palier) { palier = T.bilan.paliers[T.bilan.paliers.length - 1]; }

    // Egalite : la premiere dimension declaree gagne. L'ordre porte la priorite.
    var faible = null, bas = Infinity;
    DATA.dimensions.forEach(function (d) {
      var s = dims[d] || 0;
      if (s < bas) { bas = s; faible = d; }
    });

    return {
      entete: String(score) + " / 100",
      l: palier.l,
      t: palier.t.split("{score}").join(String(score)),
      faible: faible
    };
  }

  function afficherBilan() {
    if (progres) { progres.textContent = T.ui.termine; }
    if (barre) { barre.style.width = "100%"; }

    var b = (MODE === "profil") ? bilanProfil()
          : (MODE === "calcul") ? bilanCalcul()
          : (MODE === "composite") ? bilanComposite()
          : bilanScore();

    var html = '<div class="bilan">';
    if (b.entete) { html += '<p class="bilan__score">' + escapeHtml(b.entete) + '</p>'; }
    html += '<p class="bilan__libelle">' + escapeHtml(b.l) + '</p>' +
            '<p class="bilan__texte">' + escapeHtml(b.t) + '</p>';

    if (MODE === "calcul") {
      // Transparence de la methode, puis les notes conditionnelles retenues,
      // puis le texte de fin choisi a la derniere question.
      if (T.bilan.methode) {
        html += '<div class="explication"><strong>' + escapeHtml(T.bilan.methodeTitre) + '</strong>' +
                escapeHtml(T.bilan.methode) + '</div>';
      }
      notes.forEach(function (k) {
        if (T.bilan.notes && T.bilan.notes[k]) {
          html += '<div class="explication">' + escapeHtml(T.bilan.notes[k]) + '</div>';
        }
      });
      if (texteCle && T.bilan.textes && T.bilan.textes[texteCle]) {
        html += '<p class="bilan__texte" style="margin-top:22px;">' +
                escapeHtml(T.bilan.textes[texteCle]) + '</p>';
      }
    }

    if (MODE === "composite" && b.faible) {
      var c = T.bilan.conseils[b.faible];
      html += '<div class="explication"><strong>' + escapeHtml(T.bilan.faibleTitre) + '</strong>' +
              escapeHtml(c.t);
      if (c.lien) {
        html += ' <a href="' + c.lien + '">' + escapeHtml(c.lienT) + '</a>';
      }
      html += '</div>';
    }

    if (T.bilan.avertissement) {
      html += '<p class="bilan__texte">' + escapeHtml(T.bilan.avertissement) + '</p>';
    }
    if (T.bilan.liens && T.bilan.liens.length) {
      html += '<p class="quiz-cta">';
      T.bilan.liens.forEach(function (lien, i) {
        html += (i ? ' &middot; ' : '') + '<a href="' + lien.href + '">' + escapeHtml(lien.t) + '</a>';
      });
      html += '</p>';
    }
    html += '<div class="actions"><button class="bouton bouton--secondaire" id="recommencer">' +
            escapeHtml(T.ui.recommencer) + '</button></div></div>';

    corps.innerHTML = html;

    document.getElementById("recommencer").addEventListener("click", function () {
      reinit(); afficherQuestion();
    });
  }

  function reinit() {
    index = 0; score = 0; points = {}; vars = {}; notes = []; texteCle = null; dims = {};
  }

  function demarrer() {
    T = DATA[currentLang()] || DATA.fr;
    reinit();
    afficherQuestion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }
})();
