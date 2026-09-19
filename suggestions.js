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

    const SENTENCE_LIBRARY = {
        fantastique: [
            'À {theme}, le silence se rompit d’un seul coup, comme si une promesse ancienne avait enfin retrouvé sa voix.',
            'Dans le {detail}, une lueur changea la couleur de la scène et le personnage comprit que la porte n’était plus fermée.',
            'Le mystère grandit lorsque {theme} réapparut là où l’on croyait tout oublié.',
            'Les ombres ne bougèrent pas, mais quelque chose dans l’air dit que la magie venait de se réveiller.',
            'Avant qu’il ne s’en rende compte, le monde autour de lui semblait avoir changé de logique.'
        ],
        policier: [
            'Le détail semblait insignifiant, mais il suffisait à faire basculer l’enquête entière.',
            'Quand le suspect parla, il confirma exactement ce que le dossier avait tenté de cacher.',
            'L’empreinte trouvée dans la pièce ne disait pas tout : elle ouvrait une piste plus dangereuse encore.',
            'La vérité était dans la contradiction entre le témoignage et le lieu du crime.',
            'Il fallait remonter le fil jusqu’au silence qui cachait le plus gros indice.'
        ],
        romance: [
            'La main qui se posa sur la sienne suffit à faire disparaître toute prudence.',
            'À ce moment-là, le cœur ne lui demanda plus d’explication : il voulait seulement la vérité.',
            'Ce fut dans le silence que la promesse sembla enfin prendre forme.',
            'Le regard ne disait pas tout, mais il suffit à changer le rythme de la scène.',
            'Entre deux mots, elle comprit que ce qu’elle avait caché depuis si longtemps était déjà trop tard.'
        ],
        aventure: [
            'Le chemin se fit plus étroit, mais ce fut précisément à cet endroit que la vraie piste apparut.',
            'Chaque pas faisait avancer la quête, même si le danger semblait désormais déjà présent.',
            'Au bord du précipice, le personnage comprit que la seule réponse était de continuer.',
            'Le voyage ne changea pas seulement le décor : il transforma aussi la façon de voir le monde.',
            'La route ne menait pas là où il avait prévu, mais elle menait exactement là où il devait aller.'
        ],
        sciencefiction: [
            'Le signal ne venait pas d’un satellite, mais d’une mémoire qui avait survécu dans l’espace.',
            'L’interface s’ouvrit au moment précis où la station s’apprêtait à perdre sa dernière vérité.',
            'La technologie ne créait pas seulement une solution : elle posait une question impossible.',
            'Dans l’orbite basse, chaque seconde semblait compter comme une mémoire supplémentaire.',
            'Ce qui était censé être une machine devint une trace du futur encore en train de se décider.'
        ],
        horreur: [
            'Le bruit ne venait pas du couloir : il venait de l’intérieur du silence.',
            'La chambre semblait vide, pourtant quelque chose y respirait sans jamais se montrer.',
            'Le personnage se retourna trop tard, et c’est à ce moment qu’il comprit que la peur avait déjà dépassé la porte.',
            'À la fin du corridor, la lumière trembla comme si elle savait ce qu’elle allait révéler.',
            'La vérité ne fit que se rapprocher, et le mauvais instinct de l’ombre devint irrésistible.'
        ],
        historique: [
            'Sous l’armure du chevalier, la vérité de l’époque se cachait dans une décision importante.',
            'Le roi ne voyait pas encore l’ampleur du changement, mais le peuple sentait déjà la terre trembler.',
            'Dans la cour du château, chaque mot avait un poids trop grand pour être dit à l’instant.',
            'La guerre n’était pas encore déclarée, mais le destin s’était déjà mis en mouvement.',
            'Sous les murs de pierre, la mémoire de l’empire gardait encore le secret de sa chute.'
        ],
        realiste: [
            'Au tournant de la rue, le détail banal devint soudain le plus important de la journée.',
            'Le quartier n’était pas grand, mais chaque fenêtre semblait contenir une histoire différente.',
            'Le travail, la maison et le souci du lendemain se mêlaient dans une réalité trop lourde pour être ignorée.',
            'Ce qu’il disait aux autres semblait ordre du jour, mais ce qu’il gardait pour lui changeait déjà tout.',
            'L’instant le plus simple du quotidien devenait brutalement le plus décisif.'
        ],
        poetique: [
            'Le vent revint comme une phrase oubliée, et chaque mot portait désormais une lumière plus douce.',
            'Sous la lune, {theme} respirait encore plus fort, comme si le monde lui répondait en silence.',
            'La pluie fit tomber le dernier voile, et la phrase se mit enfin à vibrer comme une voix.',
            'La brume laissa passer un seul détail, et tout le reste aima soudain se taire.',
            'Le murmure restait dans l’air comme une promesse que le poème n’avait pas fini d’écrire.'
        ],
        thriller: [
            'L’alarme ne sonna pas dans le couloir, elle se déclencha au cœur de la mémoire.',
            'Le personnage s’arrêta exactement au moment où le danger devient plus proche que sa propre ombre.',
            'Chaque seconde se comprima jusqu’à faire croire que la fuite n’était plus qu’une illusion.',
            'La traque se jouait dans le moindre détail, dans la moindre pause avant la vérité.',
            'Quand il comprit qu’il était déjà suivi, la scène bascula sans un seul mot de plus.'
        ],
        epique: [
            'Le destin ne choisit pas le héros, il lui imposa la route qu’il devait suivre.',
            'Au pied du trône, la vérité pesa plus lourd que l’épée du champion.',
            'L’histoire ne se jouait pas dans la bataille, mais dans la décision qui la suivit.',
            'La légende naquit au moment où le personnage refusa de fuir devant la guerre.',
            'Le royaume se souvenait encore du nom qui avait changé la fin du siècle.'
        ],
        dystopique: [
            'Le mur ne gardait pas seulement les frontières : il gardait aussi les souvenirs.',
            'Le système parlait déjà pour eux, avant même qu’ils n’osent exprimer leur refus.',
            'Chaque fenêtre s’ouvrait sur une vérité à laquelle ils n’avaient jamais pensé.',
            'L’alarme ne sonnait plus pour prévenir : elle sonnait pour rappeler qu’il n’y avait plus de retour.',
            'La fuite n’était pas une solution, c’était le test ultime de leur liberté.'
        ],
        mystere: [
            'Le secret ne se révéla pas en une phrase, mais dans le détail oublié du premier chapitre.',
            'La piste était si petite que le lecteur ne pourrait l’apercevoir qu’au moment exact où il en aurait besoin.',
            'Le message caché dans l’archive fit tomber les pièces du puzzle dans l’ordre exact.',
            'Tout dépendait d’un seul mot que personne n’avait lu de la bonne façon.',
            'L’inconnu se rapprocha sans faire de bruit, comme un souvenir qui attend enfin son moment.'
        ],
        comique: [
            'Le malentendu fut si simple qu’il réussit à faire perdre le fil à tout le monde.',
            'L’idée semblait drôle à l’instant où elle fut imaginée, puis elle devint une catastrophe bien organisée.',
            'Il tenta de sauver la situation, mais le geste le fit entrer dans un autre chaos encore plus grand.',
            'La blague passa du bureau à la rue, puis à la scène entière, sans jamais vraiment finir.',
            'Le ridicule n’était plus un défaut : c’était désormais le point de départ de tout.'
        ],
        tragique: [
            'Le dernier mot connu fut aussi le premier qu’il ne put jamais reprendre.',
            'La perte n’arriva pas d’un coup : elle se mit en place doucement, comme une vérité qui attendait son heure.',
            'Le destin n’avait pas choisi l’échec, il avait seulement attendu le bon moment pour le montrer.',
            'Le personnage venait d’ouvrir une porte et il comprit qu’il ne pourrait plus jamais la refermer.',
            'La fin n’était pas un accident : c’était la conséquence naturelle d’un chemin déjà trop lourd.'
        ],
        western: [
            'Le saloon se tut, et ce fut dans ce silence que le vrai danger sortit de l’ombre.',
            'La prairie semblait infinie, mais le coup de feu venait déjà de décider de la suite.',
            'Le cowboy ne s’arrêta pas au premier virage : il connaissait l’endroit où se cachait la vraie menace.',
            'L’ennemi n’était pas celui qui tirait le premier, mais celui qui savait attendre.',
            'Au bord de la route, la poussière retint longtemps le souvenir du dernier duel.'
        ],
        steampunk: [
            'La machine gronda plus fort quand le système comprit qu’il allait devoir choisir une nouvelle loi.',
            'Quelque chose dans l’atelier bougeait sans que personne ne l’ait réellement réparé.',
            'La vapeur n’était qu’un prétexte : le vrai pouvoir se cachait dans le mécanisme invisible.',
            'Le rouage se mit à tourner plus vite, comme si le destin lui-même avait pris sa place.',
            'L’atelier gardait encore la mémoire de la première invention qui avait changé le monde.'
        ],
        narratif: [
            'L’événement suivant changea la direction du récit sans prévenir.',
            'Le personnage continua, mais il ne pouvait plus ignorer ce détail qui l’avait déjà touché.',
            'La narration se resserra autour d’un instant précis où tout bascula.',
            'Le suspense était dans le geste, pas dans les mots, et c’était là que la scène prit son vrai sens.',
            'Le récit avança plus vite dès qu’une vérité simple fut enfin mise en lumière.'
        ],
        descriptif: [
            'Le décor se précisa peu à peu, jusqu’à devenir aussi important que le personnage lui-même.',
            'La lumière changea de teinte, et avec elle la scène tout entière se transforma.',
            'Le bruit de la rue, la texture du mur et la couleur du ciel firent basculer l’atmosphère.',
            'Le détail sensoriel suffit à donner au lecteur une image claire et immédiate.',
            'L’environnement ne servait plus seulement de cadre : il devenait le cœur de la tension.'
        ],
        persuasif: [
            'Le lecteur comprend alors que l’argument ne tient pas seulement par la forme, mais par la preuve.',
            'Il faut aller plus loin et montrer pourquoi cette idée change réellement la situation.',
            'La phrase devient plus forte quand elle s’appuie sur un exemple simple et concret.',
            'Le prochain pas est clair : il faut agir, sans détour ni hésitation.',
            'Le message gagne en force lorsqu’il laisse une impression immédiate et durable.'
        ],
        dialogique: [
            'Le dialogue prend soudain une tournure plus dangereuse quand chacun garde ses mots longtemps trop longtemps.',
            'Au milieu de la conversation, une seule phrase suffit à faire tomber le masque.',
            'La réplique suivante change le rythme de la scène et oblige le lecteur à se poser une question.',
            'Le ton se durcit lorsque la vérité finit par passer entre les lignes.',
            'La discussion devient plus explosive à mesure que chacun évite le même sujet.'
        ],
        intime: [
            'Je me rendis compte que le plus important n’était pas ce que je disais, mais ce que j’avais refusé de voir.',
            'Dans ce souvenir, tout se clarifiait d’un seul coup, comme si le cœur avait enfin trouver son vraie rythme.',
            'Je n’avais pas prévu cette émotion, mais elle était déjà là, au fond de la phrase.',
            'La vérité n’était pas dans le mot, mais dans la manière dont il faisait mal.',
            'J’ai compris qu’il fallait laisser cette sensation traverser la phrase pour qu’elle soit vraiment honnête.'
        ],
        recit: [
            'Le personnage s’arrêta, puis le monde continua sans lui, ce qui changea tout.',
            'L’action prit une autre direction dès qu’un détail simple se mit à peser trop lourd.',
            'Le récit devient plus fort quand la scène montre la réaction plutôt que l’explication.',
            'Le tournant arrive au moment où l’ennui cesse d’être un simple cadre pour devenir une menace.',
            'Un seul geste suffit parfois à faire basculer toute la suite du récit.'
        ],
        poeme: [
            'Le mot revient comme une vague, puis disparaît juste avant que la ligne ne se referme.',
            'Il suffit d’une image claire pour faire tenir toute la strophe ensemble.',
            'Le silence devient alors le vrai mot de la fin, plus fort que tous les autres.',
            'La phrase se casse doucement, comme une lumière qui cherche encore son rythme.',
            'Chaque vers semble se souvenir d’une vérité que le poème n’a pas fini de dire.'
        ],
        chanson: [
            'Le refrain revient plus fort, comme si le cœur cherchait la même note encore une fois.',
            'La mélodie prend le dessus et le mot-clé résonne sur toute la ligne.',
            'Au moment où le rythme se stabilise, l’émotion devient plus claire et plus profonde.',
            'La phrase se fait plus chantante, plus légère, plus proche de la voix.',
            'Le couplet se construit autour d’un souvenir simple qui donne à la chanson son âme.'
        ],
        discours: [
            'Le message prend sa force dans la clarté, pas dans la longueur de la phrase.',
            'Il faut faire entendre l’enjeu et donner au lecteur une raison de continuer.',
            'Le discours gagne en puissance quand il se termine sur une idée simple, précise et durable.',
            'L’argument devient plus fort lorsque le lecteur comprend immédiatement l’enjeu.',
            'La ligne suivante doit faire avancer l’idée sans perdre son énergie.'
        ],
        lettre: [
            'Le mot que l’on hésitait à écrire devient soudain le plus honnête de la lettre.',
            'La phrase tombe enfin juste, comme si le cœur avait trouvé son meilleur niveau de vérité.',
            'La lettre garde sa force dans ce qui reste non dit entre les lignes.',
            'Ce qui semblait anodin prend soudain la forme d’une explication nécessaire.',
            'La fin de la lettre ne doit pas résoudre tout : elle doit surtout laisser une trace.'
        ],
        dialogue: [
            'La réplique suivante impose un changement de rythme et rend la scène plus intense.',
            'Le dialogue devient plus fort quand chacun choisit de dire plus que ce qu’il veut vraiment avouer.',
            'Une seule phrase de réponse suffit à changer la dynamique de la discussion.',
            'La vérité passe alors entre deux silences, bien avant la dernière réplique.',
            'Le personnage ne répond pas seulement à la question : il révèle le vrai enjeu de la scène.'
        ],
        default: [
            'Ajoute un détail concret qui donne une image claire et une direction à la scène.',
            'Fais avancer la phrase en introduisant un changement d’état ou de tension.',
            'Donne à la prochaine ligne un objectif précis : révélation, émotion ou action.',
            'Rends la phrase plus nette en cherchant un mot plus fort ou plus exact.',
            'Ajoute un moment de transformation pour donner un vrai mouvement à ton texte.'
        ]
    };

    function fillSentenceTemplate(template, context) {
        const replacements = {
            theme: context.theme || 'le mystère',
            detail: context.detail || 'le chemin',
            second: context.second || 'la nuit',
            person: context.person || 'Le personnage'
        };

        let filled = String(template || '');
        Object.entries(replacements).forEach(([key, value]) => {
            filled = filled.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        });

        return filled;
    }

    function scoreSentenceTemplate(template, genre, style, type, context) {
        const lower = normalizeText(template);
        if (!lower) return 0;

        let score = 0;
        const genreWords = LITERARY_DICTIONARY.genres[genre] || [];
        const styleWords = LITERARY_DICTIONARY.styles[style] || [];
        const typeWords = LITERARY_DICTIONARY.types[type] || [];

        genreWords.forEach((word) => {
            if (lower.includes(normalizeText(word))) score += 2;
        });

        styleWords.forEach((word) => {
            if (lower.includes(normalizeText(word))) score += 1.5;
        });

        typeWords.forEach((word) => {
            if (lower.includes(normalizeText(word))) score += 1.5;
        });

        (context.keywords || []).forEach((keyword) => {
            if (lower.includes(normalizeText(keyword))) score += 2;
        });

        if (genre === 'poetique' || style === 'poetique') score += 1;
        if (type === 'recit' || type === 'poeme') score += 0.5;
        if (template.includes('silence') || template.includes('lumiere') || template.includes('ombre')) score += 0.5;

        return score;
    }

    const LITERARY_DICTIONARY = {
        genres: {
            fantastique: ['magie', 'mage', 'dragon', 'sort', 'ombre', 'lune', 'potion', 'monstre', 'royaume', 'enchante', 'sorcier', 'rune', 'crystal', 'mystere', 'fantome', 'porte', 'labyrinthe', 'ancêtre', 'fée', 'elfe', 'toile', 'mythique'],
            policier: ['enquete', 'suspect', 'indice', 'affaire', 'crime', 'detective', 'preuve', 'alibi', 'temoin', 'mystere', 'cadavre', 'lieu', 'secret', 'scene', 'bureau', 'meurtre', 'interrogatoire', 'empreinte'],
            romance: ['amour', 'coeur', 'tendre', 'promesse', 'rendez', 'sentiment', 'desir', 'flirt', 'confession', 'emotion', 'amoureux', 'rencontre', 'baiser', 'douceur', 'souvenir', 'baiser'],
            aventure: ['route', 'voyage', 'foret', 'montagne', 'temple', 'pirate', 'quete', 'danger', 'explorer', 'caravane', 'tresor', 'aventurier', 'frontiere', 'piste', 'terrain', 'campement', 'exploration'],
            sciencefiction: ['vaisseau', 'planete', 'robot', 'galaxie', 'simulation', 'technologie', 'futur', 'orbitale', 'intelligence', 'station', 'univers', 'quantique', 'interface', 'cyber', 'android', 'neon'],
            horreur: ['sombre', 'peur', 'effroi', 'fantome', 'silence', 'hallucination', 'grincement', 'nocturne', 'rouge', 'ombre', 'cave', 'hante', 'gouffre', 'sang', 'chutement', 'blackout'],
            historique: ['royaume', 'cour', 'chevalier', 'empire', 'ancien', 'medieval', 'guerre', 'armure', 'village', 'chronique', 'monarque', 'epoque', 'bataille', 'chateau', 'dynastie', 'sacre'],
            realiste: ['rue', 'quartier', 'bureau', 'famille', 'maison', 'voisin', 'travail', 'marche', 'ecole', 'arrondissement', 'femme', 'enfant', 'emploi', 'service', 'banlieue', 'voiture'],
            poetique: ['vent', 'mer', 'lune', 'brume', 'silence', 'ame', 'souffle', 'murmure', 'reve', 'vague', 'etoile', 'fleur', 'nocturne', 'sable', 'horizon', 'pluie'],
            thriller: ['pression', 'suivi', 'menace', 'survie', 'traque', 'escalade', 'danger', 'intrusion', 'alarme', 'mort', 'poursuite', 'suspense', 'piège'],
            epique: ['guerre', 'heros', 'royaume', 'bataille', 'legende', 'destin', 'armée', 'champion', 'mural', 'trone', 'national', 'mythe', 'vague'],
            dystopique: ['cité', 'censeur', 'prison', 'mur', 'alarme', 'controle', 'surveillance', 'etat', 'fuite', 'systeme', 'soumission', 'serf'],
            mystere: ['secret', 'indice', 'omerta', 'disparu', 'intrigue', 'archive', 'message', 'ombre', 'inconnu', 'tueur', 'témoin', 'verite'],
            comique: ['rire', 'blague', 'gag', 'malentendu', 'bazar', 'pouce', 'sarcasme', 'gai', 'farce', 'clown', 'carnaval', 'ridicule'],
            tragique: ['destin', 'deuil', 'fatal', 'ruine', 'proie', 'perte', 'malheur', 'souffrance', 'preuve', 'adieu', 'sans retour'],
            western: ['prairie', 'cheval', 'saloon', 'pistolet', 'bison', 'frontiere', 'cowboy', 'colline', 'poudre', 'droit', 'gare'],
            steampunk: ['machine', 'vapeur', 'mecanique', 'roue', 'cog', 'chambre', 'engin', 'industrie', 'atelier', 'metallique', 'aiguille']
        },
        styles: {
            narratif: ['alors', 'puis', 'soudain', 'personnage', 'histoire', 'chemin', 'maison', 'jour', 'soir', 'chapitre', 'scene', 'regarda', 'continua', 'apres', 'quand'],
            descriptif: ['lumiere', 'ombre', 'couleur', 'bruit', 'odeur', 'forme', 'texture', 'decor', 'atmosphere', 'silhouette', 'clarte', 'brume', 'vent', 'murmure'],
            analytique: ['raison', 'cause', 'effet', 'analyse', 'objectif', 'methode', 'consequence', 'preuve', 'hypothese', 'conclusion', 'logique', 'comparaison'],
            persuasif: ['doit', 'il faut', 'important', 'avantage', 'convaincre', 'pourquoi', 'essentiel', 'choisir', 'prefere', 'necessaire', 'ensemble', 'conviction'],
            poetique: ['vent', 'mer', 'lune', 'brume', 'silence', 'ame', 'souffle', 'murmure', 'reve', 'vague', 'etoile', 'fleur', 'nocturne', 'pluie', 'horizon'],
            intime: ['je', 'moi', 'mes', 'mon', 'souvenir', 'emotion', 'coeur', 'secret', 'je pense', 'je veux', 'je me sens', 'je me rappelle', 'je crois'],
            dialogique: ['dit', 'repondit', 'demanda', 'ajouta', 's’exclama', 'repliqua', 'parla', 'question', 'replique', 'conversation'],
            suspens: ['attend', 'silence', 'mystere', 'danger', 'soudain', 'effroi', 'battement', 'brouillard', 'alarme', 'plus loin'],
            epique: ['heros', 'destin', 'bataille', 'trone', 'legende', 'royaume', 'champion', 'mythe', 'nations', 'guerre'],
            ironique: ['ridicule', 'absurde', 'sarcasme', 'parodie', 'mauvais', 'drole', 'farce', 'incoherent', 'improbable']
        },
        types: {
            recit: ['histoire', 'personnage', 'alors', 'puis', 'quand', 'soudain', 'scene', 'chemin', 'maison', 'soir', 'jour', 'apparut', 'continua', 'entendit'],
            liste: ['liste', 'acheter', 'ajouter', 'besoin', 'course', 'panier', 'produit', 'frais', 'legumes', 'oeufs', 'lait', 'pain', 'fromage', 'fromages', 'ingredient'],
            chanson: ['refrain', 'chorus', 'coeur', 'amour', 'oh', 'chante', 'couplet', 'musique', 'rythme', 'voix', 'melodie', 'chanson', 'chant'],
            poeme: ['vers', 'murmure', 'brume', 'lune', 'vent', 'souffle', 'ame', 'silence', 'etoile', 'ode', 'poesie', 'poeme', 'strophe'],
            discours: ['nous', 'vous', 'devons', 'il faut', 'ensemble', 'citoyens', 'avenir', 'action', 'justice', 'freres', 'amis', 'message', 'discours', 'patrie'],
            dialogue: ['dit', 'demanda', 'repondit', 'parla', 'questionna', 'ajouta', 'interrogea', 'conversation', 'dialogue'],
            lettre: ['cher', 'bonjour', 'salut', 'merci', 'lettre', 'adresse', 'message', 'signature', 'correspondance'],
            monologue: ['je', 'moi', 'je pense', 'je veux', 'je me sens', 'alors', 'j ai', 'je me dis']
        }
    };

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

    function scoreLexicon(text, dictionary) {
        const normalized = normalizeText(text || '');
        if (!normalized) return { key: 'libre', score: 0 };

        let bestKey = 'libre';
        let bestScore = 0;

        Object.entries(dictionary).forEach(([key, values]) => {
            let score = 0;

            values.forEach((value) => {
                const cleanValue = normalizeText(value);
                if (!cleanValue) return;

                if (normalized.includes(cleanValue)) {
                    score += 2;
                }

                const tokens = tokenizeWords(cleanValue);
                if (tokens.length === 1 && normalized.split(/\s+/).includes(cleanValue)) {
                    score += 1;
                }
            });

            if (score > bestScore) {
                bestScore = score;
                bestKey = key;
            }
        });

        return { key: bestKey, score: bestScore };
    }

    function detectWritingStyle(text) {
        const cleaned = normalizeText(text);
        if (!cleaned) {
            return { tone: 'neutre', style: 'neutre', confidence: 0 };
        }

        const lexicalStyle = scoreLexicon(text, LITERARY_DICTIONARY.styles);
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
        if (lexicalStyle.score > 0 && lexicalStyle.key !== 'libre') {
            score[lexicalStyle.key] += Math.max(2, lexicalStyle.score);
        }
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

        const fantasySignal = /(magie|mage|dragon|sort|ombre|lune|porte|murmure|secret|fantome|royaume|sorcier|crystal|mythique|eternel|mystere|fée|elfe|ancêtre)/.test(lower);
        const policeSignal = /(enquete|suspect|indice|crime|affaire|preuve|alibi|detective|mystere|cadavre|meurtre|secret|lieu|empreinte)/.test(lower);
        const romanceSignal = /(amour|coeur|tendre|romance|promesse|rendez|sentiment|desir|flirt|baiser|confession|rencontre|douceur)/.test(lower);
        const aventureSignal = /(voyage|foret|montagne|quete|pirate|temple|route|explorer|danger|aventure|tresor|frontiere|campement)/.test(lower);
        const sciFiSignal = /(vaisseau|planete|robot|galaxie|futur|univers|simulation|technologie|station|ordinateur|signal|interface|cyber)/.test(lower);
        const horrorSignal = /(effroi|peur|fantome|sombre|hallucination|silence|gouffre|nocturne|hant|ombres|gris|sang)/.test(lower);
        const historiqueSignal = /(royaume|cour|chevalier|empire|ancien|epoque|medieval|guerre|armure|monarque|chronique|chateau|bataille)/.test(lower);
        const thrillerSignal = /(traque|menace|survie|alarme|piège|poursuite|suspense|danger|intrusion)/.test(lower);
        const dystopieSignal = /(cité|censeur|prison|mur|controle|surveillance|etat|fuite|systeme|soumission)/.test(lower);
        const westernSignal = /(prairie|cheval|saloon|pistolet|cowboy|frontiere|gare|colline|poudre)/.test(lower);
        const steampunkSignal = /(machine|vapeur|mecanique|roue|engin|atelier|metallique|industrie)/.test(lower);

        if (fantasySignal && !policeSignal && !romanceSignal && !aventureSignal && !sciFiSignal && !horrorSignal && !historiqueSignal) {
            return 'fantastique';
        }

        const genreScores = {};
        Object.entries(LITERARY_DICTIONARY.genres).forEach(([genre, words]) => {
            let score = 0;
            words.forEach((word) => {
                const cleanWord = normalizeText(word);
                if (!cleanWord) return;
                if (lower.includes(cleanWord)) {
                    score += 2;
                }
                if (new RegExp(`\\b${cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower)) {
                    score += 1;
                }
            });
            genreScores[genre] = score;
        });

        const extraBoost = {
            fantastique: fantasySignal ? 6 : 0,
            policier: policeSignal ? 6 : 0,
            romance: romanceSignal ? 6 : 0,
            aventure: aventureSignal ? 5 : 0,
            'sciencefiction': sciFiSignal ? 6 : 0,
            horreur: horrorSignal ? 6 : 0,
            historique: historiqueSignal ? 5 : 0,
            realiste: /(?:rue|quartier|bureau|maison|famille|voisin|travail|marche|ecole|arrondissement|enfant|emploi|service|banlieue)/.test(lower) ? 3 : 0,
            poetique: /(?:vent|mer|lune|reve|silence|souffle|brume|ame|etoile|murmure|poesie|pluie|horizon)/.test(lower) ? 3 : 0,
            thriller: thrillerSignal ? 5 : 0,
            epique: /(?:heros|destin|bataille|trone|legende|royaume|champion|guerre|mythe|armée)/.test(lower) ? 5 : 0,
            dystopique: dystopieSignal ? 5 : 0,
            mystere: /(?:secret|indice|intrigue|archive|message|ombre|inconnu|disparu|verite)/.test(lower) ? 5 : 0,
            comique: /(?:rire|blague|gag|malentendu|bazar|sarcasme|farce|ridicule|drole)/.test(lower) ? 4 : 0,
            tragique: /(?:deuil|destin|perte|malheur|souffrance|fatal|ruine|adieu|mourir)/.test(lower) ? 4 : 0,
            western: westernSignal ? 5 : 0,
            steampunk: steampunkSignal ? 5 : 0
        };

        Object.entries(extraBoost).forEach(([genre, bonus]) => {
            if (bonus) genreScores[genre] = (genreScores[genre] || 0) + bonus;
        });

        const bestGenre = Object.entries(genreScores).sort((a, b) => b[1] - a[1])[0];
        return bestGenre && bestGenre[1] > 0 ? bestGenre[0] : 'libre';
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

        const lexiconTypeScore = scoreLexicon(rawText, LITERARY_DICTIONARY.types);
        const bulletCount = lines.filter((line) => /^(?:[-*•]|\d+[.)])\s+/.test(line)).length;
        const shoppingWords = /\b(oeufs|fromage|lait|pain|pommes|tomates|riz|beurre|yaourt|poisson|viande|cafe|sucre|sel|huile|bananes|legumes|fruits)\b/i;
        const listSignals = /\b(acheter|ajouter|besoin|liste|course|courses|panier|magasins?)\b/i;
        const narrativeSignals = /\b(il|elle|ils|elles|alors|puis|quand|soudain|au bout|ce soir|ce matin|dans la maison|sur le chemin|dans la foret|a travers|continua|entendit|decida|georges|porte)\b/i;
        const dialogSignals = /\b(dit|demanda|repondit|parla|ajouta|interrogea|s’exclama|s’exclama|questionna)\b/i;
        const letterSignals = /\b(chere|cher|bonjour|salut|merci|lettre|adresse|signature|cordialement|sinceres)\b/i;
        const monologueSignals = /\b(je pense|je veux|je me sens|je me dis|je crois|je me rappelle)\b/i;

        if (lexiconTypeScore.key === 'liste' || (lines.length > 1 && (bulletCount >= Math.max(2, Math.ceil(lines.length / 2)) || listSignals.test(lower))) || shoppingWords.test(lower)) {
            return {
                type: 'liste',
                label: 'liste de course',
                genre: detectGenre(rawText) === 'course' ? 'course' : 'liste',
                confidence: 0.94
            };
        }

        const songSignals = /\b(oh|refrain|chorus|coeur|amour|la la|je chante|dans ma tete|sur mon chemin|viens avec moi)\b/i;
        const lineBreaks = rawText.split(/\r?\n/).filter(Boolean).length;
        if (lexiconTypeScore.key === 'chanson' || (lineBreaks >= 2 && songSignals.test(lower)) || /\b(accord|couplet|chorus|refrain)\b/i.test(lower)) {
            return {
                type: 'chanson',
                label: 'chanson',
                genre: detectGenre(rawText) === 'romance' ? 'romance' : 'lyrique',
                confidence: 0.9
            };
        }

        if (letterSignals.test(lower) || lexiconTypeScore.key === 'lettre') {
            return {
                type: 'lettre',
                label: 'lettre',
                genre: detectGenre(rawText) || 'romance',
                confidence: 0.88
            };
        }

        const speechSignals = /\b(nous devons|il faut|je vous demande|citoyens|amis|freres|concitoyens|ensemble|devons agir|nous avons choisi)\b/i;
        if (lexiconTypeScore.key === 'discours' || speechSignals.test(lower) || (/\b(nous|vous)\b/i.test(lower) && /\b(doit|devons|faut|ensemble|action|avenir|patrie|gouvernement)\b/i.test(lower))) {
            return {
                type: 'discours',
                label: 'discours',
                genre: 'argumentatif',
                confidence: 0.88
            };
        }

        if (monologueSignals.test(lower) || lexiconTypeScore.key === 'monologue') {
            return {
                type: 'monologue',
                label: 'monologue',
                genre: detectGenre(rawText),
                confidence: 0.87
            };
        }

        const isVerseLike = lines.length >= 2 && lines.every((line) => line.split(/\s+/).length <= 12) && /\b(oh|je|tu|nous|coeur|vent|lune|silence|reve|amour|mer|brume|souffle|ombre|murmure)\b/i.test(lower);
        if (dialogSignals.test(lower) || lexiconTypeScore.key === 'dialogue') {
            return {
                type: 'dialogue',
                label: 'dialogue',
                genre: detectGenre(rawText),
                confidence: 0.85
            };
        }

        if (narrativeSignals.test(lower) && !isVerseLike) {
            return {
                type: 'recit',
                label: 'récit',
                genre: detectGenre(rawText),
                confidence: 0.9
            };
        }

        if (lexiconTypeScore.key === 'poeme' || isVerseLike) {
            return {
                type: 'poeme',
                label: 'poème',
                genre: detectGenre(rawText) === 'libre' ? 'poetique' : detectGenre(rawText),
                confidence: 0.9
            };
        }

        if (lexiconTypeScore.key === 'recit' || /\b(personnage|scene|histoire|chapitre|events?)\b/i.test(lower)) {
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
        const genre = detectGenre(context.text) || (textType && textType.genre) || 'libre';
        const style = context.style && context.style.style ? context.style.style : 'narratif';
        const type = textType && textType.type ? textType.type : 'recit';
        const { keywords, theme } = context;
        const firstKeyword = keywords[0] || (webIdeas[0] && webIdeas[0].title) || theme || 'mystere';
        const secondKeyword = keywords[1] || (webIdeas[1] && webIdeas[1].title) || 'nuit';

        const replacements = {
            theme: capitalizeFirst(firstKeyword.replace(/_/g, ' ')),
            detail: capitalizeFirst(secondKeyword.replace(/_/g, ' ')),
            second: capitalizeFirst(secondKeyword.replace(/_/g, ' ')),
            person: capitalizeFirst((keywords[0] || 'personnage').replace(/_/g, ' '))
        };

        const candidatePool = [
            ...(SENTENCE_LIBRARY[genre] || []),
            ...(SENTENCE_LIBRARY[style] || []),
            ...(SENTENCE_LIBRARY[type] || []),
            ...(SENTENCE_LIBRARY.default || [])
        ];

        const scored = candidatePool
            .map((template) => ({
                text: fillSentenceTemplate(template, replacements),
                score: scoreSentenceTemplate(template, genre, style, type, context)
            }))
            .sort((a, b) => b.score - a.score || a.text.length - b.text.length)
            .filter((item) => item.text && item.text.trim().length > 12);

        const unique = [];
        const seen = new Set();
        scored.forEach((item) => {
            const key = normalizeText(item.text);
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item.text);
            }
            if (unique.length >= 8) return;
        });

        return unique.length ? unique : (SENTENCE_LIBRARY.default || []).slice(0, 4).map((sentence) => fillSentenceTemplate(sentence, replacements));
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
