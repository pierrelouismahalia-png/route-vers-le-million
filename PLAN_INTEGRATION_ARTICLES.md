# Plan d'intégration : 9 articles trilingues

## Vérifications réalisées ✅
- Articles 5 & 6 : ABSENTS du site (à créer)
- Template : Réutiliser `articles/fiscalite-particuliers.html`
- Recherche : Système côté client (data-tags) + cartes article
- Index : `/articles/index.html`, `/en/articles/index.html`, `/es/articles/index.html`
- GA4 : `G-L9QEBYDL8R` (déjà intégré)
- Consent Mode v2 : `/consent.js` (déjà intégré)

## Stratégie par article

### Article 1 — Trouver un investisseur : le manuel pratique
- FR slug: `trouver-investisseur-manuel-pratique`
- EN slug: `finding-investor-practical-manual`
- ES slug: `encontrar-inversionista-manual-practico`
- Statut : **À créer en complet (FR/EN/ES)**
- Blocs : En-tête ✅ | Contenu ✅ | Arbre de décision ✅ | Clôture ✅

### Article 2 — Le guide ultime du CÉLI
- FR slug: `guide-ultime-celi`
- EN slug: `ultimate-guide-tfsa`
- ES slug: `guia-completa-tfsa`
- Statut : À créer

### Article 3 — Déductions fiscales (Partie 2)
- FR slug: `guide-ultime-deductions-fiscales`
- EN slug: `ultimate-tax-deductions-guide`
- ES slug: `guia-deducciones-fiscales`
- Statut : À créer

### Article 4 — SEO comme actif financier
- FR slug: `guide-ultime-seo-actif-financier`
- EN slug: `seo-as-financial-asset`
- ES slug: `seo-como-activo-financiero`
- Statut : À créer

### Article 5 — IA comme levier de productivité
- FR slug: `productivite-intelligence-artificielle`
- EN slug: `productivity-ai-leverage`
- ES slug: `productividad-ia-apalancamiento`
- **Statut : VÉRIFIER D'ABORD S'IL EXISTE**
- **Si absent** → créer + ajouter bloc en-tête + bloc clôture
- **Si présent** → ajouter SEULEMENT les blocs manquants, EN/ES uniquement

### Article 6 — Essai personnel (J'ai arrêté de courir)
- FR slug: `jour-arrete-courir-apres-argent`
- EN slug: `day-stopped-chasing-money`
- ES slug: `dia-deje-perseguir-dinero`
- **Statut : VÉRIFIER D'ABORD S'IL EXISTE**
- **Traitement spécial** : Pas de bloc en-tête, pas d'arbre de décision, pas de check-list
- **Si absent** → créer tel quel (essai simple)
- **Si présent** → laisser inchangé

### Article 7 — Négociation salariale
- FR slug: `guide-ultime-negociation-salariale-canada`
- EN slug: `ultimate-salary-negotiation-guide-canada`
- ES slug: `guia-negociacion-salarial-canada`
- Statut : À créer (arbre intégré dans le contenu)

### Article 8 — CV et ATS
- FR slug: `guide-ultime-cv-ats-canada`
- EN slug: `ultimate-cv-ats-guide-canada`
- ES slug: `guia-cv-ats-canada`
- Statut : À créer (arbre intégré dans le contenu)

### Article 9 — Buanderie
- FR slug: `guide-ultime-buanderie-entreprise-rentable`
- EN slug: `ultimate-laundromat-business-guide`
- ES slug: `guia-lavandera-automatica-negocio`
- Statut : À créer (arbre intégré dans le contenu)

## Étapes par article

Pour chaque article :

1. **Créer FR** → `/articles/[slug].html`
   - Bloc en-tête
   - Contenu + ancres + table matières
   - Arbre de décision (si applicable)
   - Bloc de clôture
   - Métadonnées SEO FR

2. **Créer EN** → `/en/articles/[slug].html`
   - Traduction complète (FR→EN)
   - Même structure, mêmes ancres (anglicisées)
   - Métadonnées SEO EN

3. **Créer ES** → `/es/articles/[slug].html`
   - Traduction complète (FR→ES)
   - Même structure, mêmes ancres (hispanisées)
   - Métadonnées SEO ES

4. **Ajouter aux index** :
   - Carte article dans `/articles/index.html` (FR)
   - Carte article dans `/en/articles/index.html` (EN)
   - Carte article dans `/es/articles/index.html` (ES)
   - Mettre à jour compteur (articles-count)

5. **Vérifier** :
   - GA4 tracking fonctionne
   - Consent Mode v2 actif
   - beehiiv form visible
   - Liens de navigation multilingues corrects
   - Table des matières cliquable

## Ordre d'exécution

**DÉBUT** → Article 1 (complet FR/EN/ES) → VALIDATION → Article 2 → ... → Article 9

EOL
