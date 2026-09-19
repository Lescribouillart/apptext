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

    function generateLocalSuggestions(text) {
        const context = buildSuggestionContext(text);
        const { keywords, style, progress, theme, sentenceStats, intent, questionCount } = context;

        const topicText = keywords.length ? keywords.map((word) => `"${word}"`).join(', ') : 'le sujet';

        const base = [
            `Poursuis sur le thème ${topicText} avec un exemple concret et précis.`,
            `Explique pourquoi ${keywords[0] || 'ce sujet'} est important pour ton lecteur.` ,
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
            ...extra
        ];

        return {
            ...context,
            suggestions: [...new Set(suggestions)].slice(0, 10)
        };
    }

    async function fetchWebIdeas(topic, { limit = 4 } = {}) {
        const safeTopic = String(topic || '').trim();
        if (!safeTopic) return [];
        if (typeof fetch !== 'function') return [];

        const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(safeTopic)}&limit=${limit}&namespace=0&format=json&origin=*`;

        try {
            const response = await fetch(url);
            if (!response.ok) return [];

            const data = await response.json();
            const titles = Array.isArray(data[1]) ? data[1] : [];
            const descriptions = Array.isArray(data[2]) ? data[2] : [];
            const links = Array.isArray(data[3]) ? data[3] : [];

            return titles.map((title, index) => ({
                title,
                description: descriptions[index] || 'Idée thématique ouverte',
                url: links[index] || '#'
            })).filter((item) => item.title);
        } catch (error) {
            console.warn('fetchWebIdeas error:', error);
            return [];
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
            webIdeas
        }));
    }

    const api = {
        normalizeText,
        tokenizeWords,
        extractKeywords,
        detectWritingStyle,
        detectIntent,
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
