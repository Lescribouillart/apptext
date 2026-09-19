(function (global) {
    const STOP_WORDS = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'dans', 'pour', 'avec', 'sans',
        'sur', 'sous', 'entre', 'comme', 'plus', 'moins', 'mais', 'oui', 'non',
        'donc', 'alors', 'encore', 'toujours', 'puis', 'avant', 'apres', 'depuis',
        'chez', 'quoi', 'comment', 'pourquoi', 'parce', 'cela', 'cette', 'ces', 'etre',
        'avoir', 'faire', 'aller', 'voir', 'dire', 'mettre', 'prendre', 'quel', 'quelle',
        'quand', 'ou', 'est', 'sont', 'vous', 'nous', 'ils', 'elles', 'moi', 'toi', 'je',
        'tu', 'il', 'elle', 'de', 'du', 'des', 'et', 'ou', 'a', 'b', 'c', 'd', 'e', 'f',
        'tres', 'tout', 'toute', 'toutes', 'autre', 'autres', 'entre', 'vers', 'contre', 'apres'
    ]);

    function normalizeText(text = '') {
        return String(text || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/https?:\/\/\S+/g, ' ')
            .replace(/[#*_\[\]()]/g, ' ')
            .replace(/[\r\n]+/g, ' ')
            .replace(/[^a-zA-ZÀ-ÿ0-9\s'-]/g, ' ')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    function tokenizeWords(text) {
        return normalizeText(text)
            .split(/\s+/)
            .filter(Boolean);
    }

    function countWords(text) {
        const words = tokenizeWords(text);
        const counts = new Map();
        words.forEach((word) => {
            if (!word || word.length < 3 || STOP_WORDS.has(word)) return;
            counts.set(word, (counts.get(word) || 0) + 1);
        });
        return counts;
    }

    function extractKeywords(text, maxKeywords = 8) {
        const counts = countWords(text);
        if (!counts.size) return [];

        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
            .slice(0, maxKeywords)
            .map(([word]) => word);
    }

    function detectWritingStyle(text) {
        const cleaned = normalizeText(text);
        if (!cleaned) {
            return { tone: 'neutre', style: 'neutre', confidence: 0 };
        }

        const words = tokenizeWords(text);
        const lower = cleaned;
        const score = {
            narratif: 0,
            descriptif: 0,
            analytique: 0,
            persuasif: 0,
            poetique: 0,
            intime: 0
        };

        const markers = {
            narratif: ['il', 'elle', 'alors', 'puis', 'jour', 'soir', 'maison', 'chemin', 'histoire', 'apres', 'soudain'],
            descriptif: ['couleur', 'forme', 'bruit', 'lumiere', 'details', 'grand', 'petit', 'beau', 'clair', 'sombre', 'odeur', 'texture'],
            analytique: ['analyse', 'raison', 'cause', 'effet', 'donc', 'ensuite', 'objectif', 'methode', 'facteur', 'conclusion', 'argument'],
            persuasif: ['important', 'doit', 'il faut', 'essentiel', 'avantage', 'convaincre', 'choisir', 'preferer', 'devrait', 'pourquoi'],
            poetique: ['ombre', 'vent', 'mer', 'reve', 'silence', 'ame', 'lune', 'souffle', 'brume', 'clair', 'vague'],
            intime: ['je', 'moi', 'nous', 'je pense', 'je veux', 'je crois', 'je me sens', 'je me rappelle', 'je ressens']
        };

        words.forEach((word) => {
            Object.entries(markers).forEach(([styleName, values]) => {
                if (values.includes(word)) {
                    score[styleName] += 1;
                }
            });
        });

        if (/[!?]/.test(text)) score.persuasif += 2;
        if (/(\b\w+\b\s+){12,}/.test(lower)) score.analytique += 1;
        if ((text.match(/\?/g) || []).length > 0) score.persuasif += 2;
        if ((text.match(/\bje\b|\bmon\b|\bma\b|\bmes\b/i) || []).length > 0) score.intime += 2;

        const bestEntry = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
        const styleMap = {
            narratif: 'narratif',
            descriptif: 'descriptif',
            analytique: 'analytique',
            persuasif: 'persuasif',
            poetique: 'poetique',
            intime: 'intime'
        };

        const resolvedStyle = styleMap[bestEntry[0]] || 'neutre';

        return {
            tone: resolvedStyle,
            style: resolvedStyle,
            confidence: bestEntry[1]
        };
    }

    function detectIntent(text) {
        const lower = normalizeText(text);
        if (!lower) return 'inconnu';

        if (/\b(pourquoi|comment|commentaire|analyse|raison|explication)\b/.test(lower)) return 'explication';
        if (/\b(je veux|je souhaite|j aimerais|je pense|je me sens)\b/.test(lower)) return 'personnel';
        if (/\b(doit|il faut|important|avantage|solution|résultat)\b/.test(lower)) return 'persuasif';
        if (/\b(histoire|scene|personnage|alors|soudain)\b/.test(lower)) return 'narratif';
        if (/\b(couleur|lumiere|odeur|son|bruit|texture)\b/.test(lower)) return 'descriptif';
        return 'créatif';
    }

    function detectGenre(text) {
        const lower = normalizeText(text);
        if (!lower) return 'libre';

        const genreRules = [
            { genre: 'fantastique', words: ['dragon', 'mage', 'sortilege', 'ombre', 'lune', 'royaume', 'magie', 'fantastique', 'sorcier', 'crystal', 'portal', 'forge', 'mythique'] },
            { genre: 'policier', words: ['enquete', 'suspect', 'indice', 'mystere', 'police', 'lieu', 'alibi', 'preuve', 'crime', 'detective', 'tueur', 'affaire'] },
            { genre: 'romance', words: ['amour', 'coeur', 'tendre', 'flirt', 'promesse', 'rencontre', 'sentiment', 'baiser', 'confession'] },
            { genre: 'science-fiction', words: ['vaisseau', 'planete', 'robot', 'nucleaire', 'futur', 'galaxie', 'signal', 'simulation', 'ordinateur', 'technologie'] },
            { genre: 'aventure', words: ['voyage', 'foret', 'montagne', 'pirate', 'temple', 'route', 'explorer', 'danger', 'aventure', 'escapade'] },
            { genre: 'horreur', words: ['effroi', 'sombre', 'silence', 'hant', 'fantome', 'maison', 'gouffre', 'peur', 'nocturne', 'ombre'] },
            { genre: 'poetique', words: ['vent', 'mer', 'lune', 'reve', 'silence', 'souffle', 'brume', 'ame', 'poesie', 'murmure'] },
            { genre: 'course', words: ['oeufs', 'lait', 'pain', 'fromage', 'pommes', 'tomates', 'bananes', 'riz', 'poisson', 'huile', 'sel', 'sucre', 'cafe', 'yaourt', 'legumes', 'fruits'] }
        ];

        let bestGenre = 'libre';
        let bestScore = 0;

        genreRules.forEach(({ genre, words }) => {
            const score = words.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
            if (score > bestScore) {
                bestScore = score;
                bestGenre = genre;
            }
        });

        if (bestScore === 0 && /\b(ombre|lune|maison|porte|fenetre|murmure|secret|night)\b/.test(lower)) {
            return 'fantastique';
        }

        return bestGenre;
    }

    function detectTextType(text) {
        const rawText = String(text || '');
        const lower = normalizeText(rawText);
        if (!lower) {
            return { type: 'inconnu', label: 'inconnu', genre: 'libre', confidence: 0 };
        }

        const lines = rawText
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        const bulletCount = lines.filter((line) => /^(?:[-*•]|\d+[.)])\s+/.test(line)).length;
        const shoppingWords = /\b(oeufs|fromage|lait|pain|pommes|tomates|riz|beurre|yaourt|poisson|viande|cafe|sucre|sel|huile|bananes|legumes|fruits)\b/i;
        const listSignals = /\b(acheter|ajouter|besoin|liste|course|courses|panier|magasins?)\b/i;

        if ((lines.length > 1 && (bulletCount >= Math.max(2, Math.ceil(lines.length / 2)) || listSignals.test(lower))) || shoppingWords.test(lower)) {
            return {
                type: 'liste',
                label: 'liste de course',
                genre: detectGenre(rawText) === 'course' ? 'course' : 'liste',
                confidence: 0.94
            };
        }

        const songSignals = /\b(oh|refrain|chorus|coeur|amour|la la|je chante|dans ma tete|sur mon chemin|viens avec moi)\b/i;
        const lineBreaks = rawText.split(/\r?\n/).filter(Boolean).length;
        if ((lineBreaks >= 2 && songSignals.test(lower)) || /\b(accord|couplet|chorus|refrain)\b/i.test(lower)) {
            return {
                type: 'chanson',
                label: 'chanson',
                genre: detectGenre(rawText) === 'romance' ? 'romance' : 'lyrique',
                confidence: 0.9
            };
        }

        const speechSignals = /\b(nous devons|il faut|je vous demande|citoyens|amis|freres|concitoyens|ensemble|devons agir|nous avons choisi)\b/i;
        if (speechSignals.test(lower) || (/\b(nous|vous)\b/i.test(lower) && /\b(doit|devons|faut|ensemble|action|avenir|patrie|gouvernement)\b/i.test(lower))) {
            return {
                type: 'discours',
                label: 'discours',
                genre: 'argumentatif',
                confidence: 0.88
            };
        }

        const isVerseLike = lines.length >= 2 && lines.every((line) => line.split(/\s+/).length <= 12) && /\b(oh|je|tu|nous|coeur|vent|lune|silence|reve|amour|mer|brume|souffle|ombre|murmure)\b/i.test(lower);
        if (isVerseLike) {
            return {
                type: 'poeme',
                label: 'poème',
                genre: detectGenre(rawText) === 'libre' ? 'poetique' : detectGenre(rawText),
                confidence: 0.9
            };
        }

        const narrativeSignals = /\b(il|elle|ils|elles|alors|puis|soudain|au bout|ce soir|ce matin|dans la maison|sur le chemin|dans la foret|a travers)\b/i;
        if (narrativeSignals.test(lower) || /\b(personnage|scene|histoire|chapitre|events?)\b/i.test(lower)) {
            return {
                type: 'recit',
                label: 'récit',
                genre: detectGenre(rawText),
                confidence: 0.83
            };
        }

        return {
            type: 'libre',
            label: 'texte libre',
            genre: detectGenre(rawText),
            confidence: 0.5
        };
    }

    function getSentenceStats(text) {
        const normalized = normalizeText(text);
        if (!normalized) return { sentences: 0, avgLength: 0, questionCount: 0 };

        const sentences = normalized
            .split(/[.!?]+/)
            .map((sentence) => sentence.trim())
            .filter(Boolean);

        const questionCount = (text.match(/\?/g) || []).length;
        const totalWords = tokenizeWords(normalized).length;

        return {
            sentences: sentences.length,
            avgLength: sentences.length ? Math.round(totalWords / sentences.length) : 0,
            questionCount
        };
    }

    function estimateProgress(text) {
        const normalized = normalizeText(text);
        const length = normalized.length;
        const sentenceStats = getSentenceStats(text);

        if (!length) return 'debut';
        if (length < 90 || sentenceStats.sentences < 2) return 'debut';
        if (length < 280 || sentenceStats.sentences < 5) return 'milieu';
        return 'fin';
    }

    function buildSuggestionContext(text) {
        const normalized = normalizeText(text);
        const keywords = extractKeywords(text, 8);
        const style = detectWritingStyle(text);
        const progress = estimateProgress(text);
        const sentenceStats = getSentenceStats(text);
        const theme = keywords[0] || 'inspiration';
        const intent = detectIntent(text);

        return {
            text: normalized,
            keywords,
            style,
            progress,
            theme,
            sentenceStats,
            intent,
            questionCount: sentenceStats.questionCount
        };
    }

    function capitalizeFirst(value = '') {
        const text = String(value || '').trim();
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    function buildContinuationIdeas(context, textType, webIdeas = []) {
        const { keywords, theme } = context;
        const firstKeyword = keywords[0] || (webIdeas[0] && webIdeas[0].title) || theme || 'le mystère';
        const sourceWord = capitalizeFirst(firstKeyword.replace(/_/g, ' '));
        const secondWord = keywords[1] || (webIdeas[1] && webIdeas[1].title) || 'la nuit';
        const dynamicSeed = capitalizeFirst(secondWord.replace(/_/g, ' '));

        const basis = {
            recit: [
                `${sourceWord} se rapprocha encore davantage, sans qu’aucun bruit ne vienne troubler le silence.`,
                `Au moment où tout semblait figé, ${dynamicSeed.toLowerCase()} fit une apparition qui changea le cours de l’histoire.`,
                `Georges hésita un instant, puis le chemin se fit plus étroit, comme si ${sourceWord.toLowerCase()} l’observait déjà.`,
                `Le danger n’était pas là où il l’attendait : c’était dans le détail qu’il n’avait pas vu avant.`
            ],
            liste: [
                `Ajoute ensuite un élément utile pour compléter ce panier : une viande, un légume ou un produit frais qui manque encore.`,
                `Rappelle les essentiels à acheter en priorité, puis détaille les produits de la semaine dans l’ordre logique.`,
                `Complète la liste avec un ingrédient qui donnera de la saveur ou un produit de base pour le repas du soir.`
            ],
            chanson: [
                `Et le refrain revient, plus fort, comme si le cœur répétait encore une fois : ${sourceWord}.`,
                `Sur le même rythme, ajoute une phrase courte et chantante qui permet au refrain de tomber naturellement.`,
                `Le refrain devient plus intense : la voix monte, le mot-clé revient, et le cœur répond à la musique.`
            ],
            poeme: [
                `Sous la brume, ${sourceWord.toLowerCase()} respire encore plus fort, comme une phrase qui cherche son dernier vers.`,
                `Le silence s’ouvre doucement, puis le mot ${sourceWord.toLowerCase()} revient dans le rythme du souffle.`,
                `Termine sur une image nette, presque lumineuse, pour laisser le poème flotter dans l’air.`
            ],
            discours: [
                `Et c’est précisément ici que le choix devient clair : il faut agir, sans attendre, sans détour.`,
                `Le lecteur comprend alors que le prochain pas n’est plus une question, mais une nécessité.`,
                `Le message se termine sur une ligne forte, simple et directe, pour laisser une impression durable.`
            ],
            libre: [
                `${sourceWord} devient le point de bascule : un détail, un souvenir ou un indice suffit à faire avancer la scène.`,
                `Ajoute une phrase qui fait avancer le lecteur : un geste, une réaction, une révélation, un tournant.`,
                `Le texte gagne en puissance si tu précises ce qui change à ce moment précis.`
            ]
        };

        return basis[textType.type] || basis.libre;
    }

    function buildFallbackWebIdeas(topic, textType) {
        const baseTopic = String(topic || '').trim() || (textType && textType.genre) || 'mystère';
        const ideasByTopic = {
            fantastique: [
                { title: 'L’ancienne forêt', description: 'Un lieu mystérieux où les arbres gardent les secrets oubliés.' },
                { title: 'Le portail disparu', description: 'Une entrée cachée vers un monde qui n’a plus de frontières.' },
                { title: 'La lune noire', description: 'Un signe étrange qui annonce un événement irréversible.' }
            ],
            policier: [
                { title: 'Le dossier oublié', description: 'Un indice ancien qui refait surface au mauvais moment.' },
                { title: 'La chambre close', description: 'Un lieu dont l’histoire ne colle pas avec les témoignages.' },
                { title: 'L’empreinte de cire', description: 'Une preuve qui force la vérité à parler.' }
            ],
            romance: [
                { title: 'La lettre cachée', description: 'Une promesse écrite avant qu’il ne soit trop tard.' },
                { title: 'Le rendez-vous sous la pluie', description: 'Un moment où le cœur décide plus vite que la raison.' },
                { title: 'Le regard qui revient', description: 'Un lien discret mais impossible à ignorer.' }
            ],
            'science-fiction': [
                { title: 'Le signal perdu', description: 'Un message venu d’une autre époque, encore actif.' },
                { title: 'L’orbite basse', description: 'Une zone dangereuse où la réalité se dédouble.' },
                { title: 'Le cœur artificiel', description: 'Une intelligence capable de choisir sa propre destinée.' }
            ],
            aventure: [
                { title: 'Le pont suspendu', description: 'Un passage impossible à traverser sans un risque calculé.' },
                { title: 'La grotte du vent', description: 'Un lieu qui cache une vérité plus ancienne que la route.' },
                { title: 'Le sentier sans retour', description: 'Un chemin dont il faut sortir avec une réponse.' }
            ],
            horreur: [
                { title: 'La maison silencieuse', description: 'Un lieu où le moindre bruit semble annoncer une présence.' },
                { title: 'Le miroir déformé', description: 'Une image qui ne reflète pas exactement la vérité.' },
                { title: 'Le corridor vide', description: 'Un espace où quelque chose attend au bout du silence.' }
            ],
            course: [
                { title: 'Le marché du matin', description: 'Des produits frais et simples, bien rangés pour la semaine.' },
                { title: 'Le repas de famille', description: 'Une liste pensée pour nourrir et partager un moment.' },
                { title: 'La cuisine improvisée', description: 'Un assortiment de basiques pour un plat à la surprise.' }
            ]
        };

        const fallback = ideasByTopic[baseTopic] || [
            { title: 'Le détail décisif', description: 'Un élément discret qui change tout le sens du récit.' },
            { title: 'La piste cachée', description: 'Une trace qui pousse le personnage à aller plus loin.' },
            { title: 'Le choix impossible', description: 'Un tournant où le prochain acte détermine la suite.' }
        ];

        return fallback.map((idea) => ({
            title: idea.title,
            description: idea.description,
            url: '#'
        }));
    }

    function generateLocalSuggestions(text) {
        const context = buildSuggestionContext(text);
        const { keywords, style, progress, theme, sentenceStats, intent, questionCount } = context;
        const textType = detectTextType(text);
        const topicText = keywords.length ? keywords.map((word) => `"${word}"`).join(', ') : 'le sujet';

        const base = [
            `Poursuis sur le thème ${topicText} avec un exemple concret et précis.`,
            `Explique pourquoi ${keywords[0] || 'ce sujet'} est important pour ton lecteur.`,
            'Ajoute un moment de tension ou un obstacle pour donner de la dynamique.',
            'Pose une question qui pousse le lecteur à continuer.',
            'Développe un point de vue opposé pour donner du relief à ton texte.',
            'Conclue avec une idée forte ou une réflexion durable.'
        ];

        const dynamic = [];

        if (questionCount > 0) {
            dynamic.push('Réponds directement à la question qui ouvre le texte, sans détour.');
            dynamic.push('Développe la réponse de manière plus concrète et plus personnelle.');
        }

        if (intent === 'personnel') {
            dynamic.push('Rappelle un souvenir ou une expérience qui donne du poids à cette idée.');
            dynamic.push('Explique ce que cette situation te fait ressentir, en détail.');
        }

        if (intent === 'explication') {
            dynamic.push('Donne une explication plus simple avec un exemple du quotidien.');
            dynamic.push('Compare la situation actuelle avec un cas opposé pour clarifier.');
        }

        if (intent === 'persuasif') {
            dynamic.push('Présente un bénéfice immédiat pour le lecteur ou pour la situation.');
            dynamic.push('Ajoute une preuve concrète pour renforcer ton argument.');
        }

        if (intent === 'narratif') {
            dynamic.push('Ajoute un élément de surprise ou de changement de direction.');
            dynamic.push('Montre la réaction du personnage face au conflit.');
        }

        if (intent === 'descriptif') {
            dynamic.push('Développe la scène en ajoutant des détails sensoriels.');
            dynamic.push('Utilise une comparaison visuelle ou auditive pour rendre la description plus vivante.');
        }

        const byStyle = {
            narratif: [
                'Raconte un moment décisif qui fait basculer le récit.',
                'Ajoute un personnage ou un élément de contexte qui change la direction.',
                'Montre ce qui change dans la façon de voir les choses.'
            ],
            descriptif: [
                'Décris l’espace ou le décor avec plus de précision.',
                'Ajoute des détails de lumière, de son ou d’atmosphère.',
                'Montre la scène à travers les impressions du personnage.'
            ],
            analytique: [
                'Donne un exemple concret pour illustrer ton raisonnement.',
                'Compare deux points de vue pour enrichir la réflexion.',
                'Explique la cause, la conséquence et la solution de manière claire.'
            ],
            persuasif: [
                'Présente un bénéfice immédiat pour le lecteur.',
                'Ajoute un exemple qui montre le résultat attendu.',
                'Formule une idée plus directe et plus convaincante.'
            ],
            poetique: [
                'Utilise une image forte qui attire immédiatement l’attention.',
                'Refais une phrase avec un rythme plus musical.',
                'Joue sur le contraste entre lumière et obscurité ou calme et agitation.'
            ],
            intime: [
                'Exprime ce que tu ressens avec plus de précision.',
                'Rappelle un souvenir précis qui aide à expliquer cette émotion.',
                'Ajoute une phrase qui révèle une vérité plus profonde.'
            ],
            neutre: [
                'Donne un point de départ simple et clair.',
                'Ajoute une idée secondaire pour renforcer le sujet.',
                'Conclue avec une formulation plus nette.'
            ]
        };

        const byProgress = {
            debut: [
                'Introduis le sujet avec une phrase d’ouverture concrète.',
                'Présente le contexte en 2 ou 3 lignes seulement.',
                'Pose le vrai problème à résoudre avant d’aller plus loin.'
            ],
            milieu: [
                'Développe une idée centrale avec un exemple précis.',
                'Ajoute un point de conflit, une difficulté ou une alternative.',
                'Fais une transition naturelle vers la conclusion.'
            ],
            fin: [
                'Réponds clairement à la question ou au problème initial.',
                'Donne une conclusion forte, mémorable et précise.',
                'Ajoute une ouverture qui laisse le lecteur réfléchir.'
            ]
        };

        const typeSpecific = {
            liste: [
                'Ajoute un ingrédient ou un produit qui manque encore dans cette liste.',
                'Précise la quantité pour rendre la liste plus utile et plus réaliste.',
                'Sépare les produits par catégories : fruits, légumes, produits frais, épicerie.',
                'Ajoute une idée de recette ou de repas à partir des éléments déjà présents.'
            ],
            recit: [
                'Ajoute un détail concret qui donne une image forte à la scène.',
                'Introduis un élément de surprise ou un tournant dramatique.',
                'Montre la réaction du personnage face au changement de situation.',
                'Laisse une trace de suspense avant la prochaine révélation.'
            ],
            chanson: [
                'Crée un refrain court et mémorable sur le mot-clé central.',
                'Ajoute une image plus forte pour rendre le chorus plus chantant.',
                'Répète un mot ou une formule pour donner un rythme plus musical.',
                'Ajoute un pont émotionnel avant la dernière répétition.'
            ],
            poeme: [
                'Joue sur une image visuelle ou sonore pour renforcer la scène.',
                'Réduit certaines phrases pour garder un rythme plus poétique.',
                'Utilise un mot clé en refrain pour donner de la cohérence.',
                'Termine sur une image forte qui laisse une impression durable.'
            ],
            discours: [
                'Ajoute un exemple concret pour donner plus de force à l’argument.',
                'Présente un défi ou un enjeu important pour faire réagir le lecteur.',
                'Appelle à une action claire et immédiate.',
                'Termine avec une phrase courte et mémorable.'
            ],
            libre: [
                'Donne une idée plus précise pour faire avancer le texte.',
                'Ajoute une étape simple : exemple, tension, conclusion.',
                'Renforce le point central avec un détail, une émotion ou une image.'
            ]
        };

        const genreSpecific = {
            fantastique: [
                'Introduis une apparition ou un signe mystérieux qui trouble la scène.',
                'La menace ou la promesse magique doit modifier le cours de l’action.',
                'Ajoute un détail ancien, lumineux ou surnaturel qui fait évoluer le décor.'
            ],
            policier: [
                'Introduis un indice ou un détail oublié qui change tout.',
                'Place une contradiction entre le témoignage et la réalité.',
                'Fais apparaître une piste qui pousse le personnage vers une nouvelle découverte.'
            ],
            romance: [
                'Ajoute un geste discret qui révèle un sentiment profond.',
                'Fais émerger une hésitation ou une promesse sincère.',
                'Montre un moment où le cœur semble prendre le dessus sur la raison.'
            ],
            'science-fiction': [
                'Ajoute une donnée technologique ou un signe de changement futur.',
                'Introduis une conséquence inattendue de cette innovation.',
                'Fais émerger une question sur le sens de la technologie.'
            ],
            aventure: [
                'Ajoute un obstacle imprévu sur le chemin.',
                'Présente une découverte qui change la mission ou le voyage.',
                'Donne un rythme plus rapide pour faire monter l’adrénaline.'
            ],
            horreur: [
                'Ajoute un bruit, un silence ou un détail qui fait basculer le courage.',
                'Rend la menace plus proche, plus tangible, plus personnelle.',
                'Laisse le lecteur sentir que quelque chose de mauvais va arriver.'
            ],
            poetique: [
                'Utilise une comparaison qui donne une image forte et lumineuse.',
                'Répète un mot pour créer du rythme et une émotion plus intense.',
                'Termine sur une sensation plus douce ou plus profonde.'
            ],
            course: [
                'Ajoute un produit utile pour compléter le repas ou la semaine.',
                'Ajoute un ingrédient qui manque pour rendre la liste plus cohérente.',
                'Introduis une remarque pratique sur l’organisation de la liste.'
            ],
            libre: [
                'Ajoute un détail concret pour ancrer le texte dans la réalité.',
                'Rends la phrase suivante plus nette, plus vive et plus engageante.'
            ]
        };

        const continuationIdeas = buildContinuationIdeas(context, textType, []);

        const extra = [];
        if (sentenceStats.sentences > 0 && sentenceStats.avgLength > 20) {
            extra.push('Simplifie certaines phrases pour rendre l’idée plus lisible et plus percutante.');
        }
        if (keywords.length >= 2) {
            extra.push(`Relie ${keywords[0]} et ${keywords[1]} pour créer une véritable tension narrative ou conceptuelle.`);
        }

        const suggestions = [
            ...base,
            ...dynamic,
            ...(byStyle[style.style] || []),
            ...(byProgress[progress] || []),
            ...(typeSpecific[textType.type] || []),
            ...(genreSpecific[textType.genre] || []),
            ...continuationIdeas,
            ...extra
        ];

        return {
            ...context,
            textType,
            genre: textType.genre,
            suggestions: [...new Set(suggestions)].slice(0, 10)
        };
    }

    async function fetchWebIdeas(topic, { limit = 4 } = {}) {
        const safeTopic = String(topic || '').trim();
        if (!safeTopic) return [];
        if (typeof fetch !== 'function') return buildFallbackWebIdeas(safeTopic, { genre: 'libre' });

        const url = `https://fr.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(safeTopic)}&limit=${limit}&namespace=0&format=json&origin=*`;

        try {
            const response = await fetch(url);
            if (!response.ok) return buildFallbackWebIdeas(safeTopic, { genre: 'libre' });

            const data = await response.json();
            const titles = Array.isArray(data[1]) ? data[1] : [];
            const descriptions = Array.isArray(data[2]) ? data[2] : [];
            const links = Array.isArray(data[3]) ? data[3] : [];

            const result = titles.map((title, index) => ({
                title,
                description: descriptions[index] || 'Idée thématique ouverte',
                url: links[index] || '#'
            })).filter((item) => item.title);

            return result.length ? result : buildFallbackWebIdeas(safeTopic, { genre: 'libre' });
        } catch (error) {
            console.warn('fetchWebIdeas error:', error);
            return buildFallbackWebIdeas(safeTopic, { genre: 'libre' });
        }
    }

    function generateSuggestions(text, options = {}) {
        const localResult = generateLocalSuggestions(text || '');
        const includeWebIdeas = options.includeWebIdeas === true;

        if (!includeWebIdeas) {
            return Promise.resolve({
                ...localResult,
                webIdeas: []
            });
        }

        return fetchWebIdeas(localResult.theme, { limit: 3 }).then((webIdeas) => ({
            ...localResult,
            webIdeas: webIdeas.length ? webIdeas : buildFallbackWebIdeas(localResult.theme, localResult.textType)
        }));
    }

    const api = {
        normalizeText,
        tokenizeWords,
        extractKeywords,
        detectWritingStyle,
        detectIntent,
        detectGenre,
        detectTextType,
        getSentenceStats,
        estimateProgress,
        buildSuggestionContext,
        generateLocalSuggestions,
        fetchWebIdeas,
        generateSuggestions
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }

    global.TextSuggestions = api;
})(typeof window !== 'undefined' ? window : globalThis);
