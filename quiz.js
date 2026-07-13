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

  function afficherBilan() {
    if (progres) { progres.textContent = T.ui.termine; }
    if (barre) { barre.style.width = "100%"; }

    var b = (MODE === "profil") ? bilanProfil() : bilanScore();

    var html =
      '<div class="bilan">' +
      '<p class="bilan__score">' + escapeHtml(b.entete) + '</p>' +
      '<p class="bilan__libelle">' + escapeHtml(b.l) + '</p>' +
      '<p class="bilan__texte">' + escapeHtml(b.t) + '</p>';

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
      index = 0; score = 0; points = {}; afficherQuestion();
    });
  }

  function demarrer() {
    T = DATA[currentLang()] || DATA.fr;
    index = 0; score = 0; points = {};
    afficherQuestion();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", demarrer);
  } else {
    demarrer();
  }
})();
