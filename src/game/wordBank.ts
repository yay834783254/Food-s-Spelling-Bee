export type DifficultyTier = 'easy' | 'medium' | 'hard' | 'verylong';
export type GameModeTier = DifficultyTier | 'progressive';

export interface SpellingWord {
  id: string;
  word: string;
  difficulty: DifficultyTier;
  syllables: string;
  phonetic: string;
  partOfSpeech: string;
  origin: string;
  definition: string;
  sentence: string;
  category: string;
}

export const DIFFICULTY_META: Record<
  GameModeTier,
  { label: string; rangeLabel: string; multiplier: number; description: string }
> = {
  easy: {
    label: 'Easy',
    rangeLabel: '4–6 Letters',
    multiplier: 1.0,
    description: 'Essential kitchen, pantry, and foundational bee vocabulary.'
  },
  medium: {
    label: 'Medium',
    rangeLabel: '7–10 Letters',
    multiplier: 1.5,
    description: 'Artisanal ingredients, culinary techniques, and regional classics.'
  },
  hard: {
    label: 'Hard',
    rangeLabel: '11–15 Letters',
    multiplier: 2.2,
    description: 'Championship gastronomy, French & Italian loanwords, and food science.'
  },
  verylong: {
    label: 'Very Long',
    rangeLabel: '16–45 Letters',
    multiplier: 3.5,
    description: 'Grandmaster marathon words, biochemical compounds, and lexical titans.'
  },
  progressive: {
    label: 'Progressive Bee',
    rangeLabel: '4 to 45 Letters',
    multiplier: 2.5,
    description: 'Escalates from Easy pantry staples to Very Long championship words.'
  }
};

export const WORD_BANK: SpellingWord[] = [
  // EASY (4-6 letters)
  {
    id: 'word_bistro',
    word: 'bistro',
    difficulty: 'easy',
    syllables: 'bis-tro',
    phonetic: 'BEE-stroh',
    partOfSpeech: 'noun',
    origin: 'French',
    definition: 'A small, unpretentious restaurant serving regionally inspired dishes.',
    sentence: 'The neighborhood [ _____ ] served warm baguette slices before noon.',
    category: 'Dining'
  },
  {
    id: 'word_quiche',
    word: 'quiche',
    difficulty: 'easy',
    syllables: 'quiche',
    phonetic: 'KEESH',
    partOfSpeech: 'noun',
    origin: 'French & German',
    definition: 'A savory open tart consisting of pastry crust filled with egg and cream custard.',
    sentence: 'She baked a spinach and gruyere [ _____ ] for the Sunday brunch table.',
    category: 'Pastry'
  },
  {
    id: 'word_nectar',
    word: 'nectar',
    difficulty: 'easy',
    syllables: 'nec-tar',
    phonetic: 'NEK-ter',
    partOfSpeech: 'noun',
    origin: 'Classical Greek',
    definition: 'A sugary fluid secreted by plants to encourage pollination by honeybees.',
    sentence: 'Foraging bees gather floral [ _____ ] throughout the warm orchard morning.',
    category: 'Apiary'
  },
  {
    id: 'word_sorbet',
    word: 'sorbet',
    difficulty: 'easy',
    syllables: 'sor-bet',
    phonetic: 'sor-BAY',
    partOfSpeech: 'noun',
    origin: 'French & Arabic',
    definition: 'A frozen dessert made from sweetened water and fruit purée without dairy.',
    sentence: 'A spoonful of blood orange [ _____ ] cleansed the palate between courses.',
    category: 'Confections'
  },
  {
    id: 'word_simmer',
    word: 'simmer',
    difficulty: 'easy',
    syllables: 'sim-mer',
    phonetic: 'SIM-er',
    partOfSpeech: 'verb',
    origin: 'Middle English',
    definition: 'To cook liquid ingredients gently just below the boiling point.',
    sentence: 'Let the tomato reduction [ _____ ] uncovered for forty minutes.',
    category: 'Technique'
  },
  {
    id: 'word_morsel',
    word: 'morsel',
    difficulty: 'easy',
    syllables: 'mor-sel',
    phonetic: 'MOR-sel',
    partOfSpeech: 'noun',
    origin: 'Old French',
    definition: 'A small, delicate piece or bite-sized portion of food.',
    sentence: 'Not a single [ _____ ] of thehoneycomb pastry remained on the platter.',
    category: 'Dining'
  },
  {
    id: 'word_pastry',
    word: 'pastry',
    difficulty: 'easy',
    syllables: 'pas-try',
    phonetic: 'PAY-stree',
    partOfSpeech: 'noun',
    origin: 'Middle English',
    definition: 'Baked dough crafted from flour, laminated butter, and cold water.',
    sentence: 'Laminated [ _____ ] requires precise temperature control so the butter does not melt.',
    category: 'Baking'
  },
  {
    id: 'word_citrus',
    word: 'citrus',
    difficulty: 'easy',
    syllables: 'cit-rus',
    phonetic: 'SIT-rus',
    partOfSpeech: 'noun',
    origin: 'Latin',
    definition: 'Aromatic fruit trees including bergamot, yuzu, lemon, and citron.',
    sentence: 'Fresh [ _____ ] zest brightens heavy winter stews right before serving.',
    category: 'Produce'
  },
  {
    id: 'word_almond',
    word: 'almond',
    difficulty: 'easy',
    syllables: 'al-mond',
    phonetic: 'AH-mund',
    partOfSpeech: 'noun',
    origin: 'Old French & Greek',
    definition: 'The edible oval nutlike seed of a blossom tree prized in marzipan and financiers.',
    sentence: 'Toasted [ _____ ] slivers added crunch to the poached pear tart.',
    category: 'Nuts & Seeds'
  },
  {
    id: 'word_savory',
    word: 'savory',
    difficulty: 'easy',
    syllables: 'sa-vor-y',
    phonetic: 'SAY-vuh-ree',
    partOfSpeech: 'adjective',
    origin: 'Old French',
    definition: 'Pungent, salty, or umami-rich in flavor rather than sweet.',
    sentence: 'The baker specialized in [ _____ ] galettes filled with roasted leeks and thyme.',
    category: 'Flavor'
  },

  // MEDIUM (7-10 letters)
  {
    id: 'word_saffron',
    word: 'saffron',
    difficulty: 'medium',
    syllables: 'saf-fron',
    phonetic: 'SAF-run',
    partOfSpeech: 'noun',
    origin: 'Arabic & Old French',
    definition: 'Crimson stigmas of the autumn crocus flower, prized as the world’s costliest spice.',
    sentence: 'Three threads of steeped [ _____ ] turned the risotto a luminous gold.',
    category: 'Spices'
  },
  {
    id: 'word_croissant',
    word: 'croissant',
    difficulty: 'medium',
    syllables: 'crois-sant',
    phonetic: 'krwah-SAHN',
    partOfSpeech: 'noun',
    origin: 'French',
    definition: 'A crescent-shaped viennoiserie roll made of yeast-leavened laminated dough.',
    sentence: 'Shattering honeycomb layers are the hallmark of a masterfully baked [ _____ ].',
    category: 'Baking'
  },
  {
    id: 'word_cardamom',
    word: 'cardamom',
    difficulty: 'medium',
    syllables: 'car-da-mom',
    phonetic: 'KAR-duh-mum',
    partOfSpeech: 'noun',
    origin: 'Greek & Sanskrit',
    definition: 'Aromatic seed pods of the ginger family used in Scandinavian buns and masala chai.',
    sentence: 'Freshly ground green [ _____ ] perfumed the entire bakery before dawn.',
    category: 'Spices'
  },
  {
    id: 'word_artichoke',
    word: 'artichoke',
    difficulty: 'medium',
    syllables: 'ar-ti-choke',
    phonetic: 'AR-tih-chohk',
    partOfSpeech: 'noun',
    origin: 'Northern Italian & Arabic',
    definition: 'An edible flower bud of a cultivated thistle, prized for its tender heart.',
    sentence: 'Charred Roman [ _____ ] hearts were dressed with mint and lemon oil.',
    category: 'Produce'
  },
  {
    id: 'word_marzipan',
    word: 'marzipan',
    difficulty: 'medium',
    syllables: 'mar-zi-pan',
    phonetic: 'MAR-zih-pan',
    partOfSpeech: 'noun',
    origin: 'German & Italian',
    definition: 'A smooth confection of blanched ground almonds, sugar, and rosewater.',
    sentence: 'The confectioner sculpted miniature orchard fruits out of tinted [ _____ ].',
    category: 'Confections'
  },
  {
    id: 'word_prosciutto',
    word: 'prosciutto',
    difficulty: 'medium',
    syllables: 'pro-sciut-to',
    phonetic: 'proh-SHOO-toh',
    partOfSpeech: 'noun',
    origin: 'Italian',
    definition: 'Dry-cured spiced Italian ham aged for months and sliced paper-thin.',
    sentence: 'Ribbons of aged [ _____ ] were draped over ripe cantaloupe wedges.',
    category: 'Charcuterie'
  },
  {
    id: 'word_persimmon',
    word: 'persimmon',
    difficulty: 'medium',
    syllables: 'per-sim-mon',
    phonetic: 'per-SIM-un',
    partOfSpeech: 'noun',
    origin: 'Algonquian',
    definition: 'An autumn tree fruit with glossy orange skin and honey-sweet flesh when ripe.',
    sentence: 'Dried Hoshigaki [ _____ ] develops a natural dusting of crystallized fruit sugar.',
    category: 'Produce'
  },
  {
    id: 'word_gastronomy',
    word: 'gastronomy',
    difficulty: 'medium',
    syllables: 'gas-tron-o-my',
    phonetic: 'gas-TRON-uh-mee',
    partOfSpeech: 'noun',
    origin: 'Ancient Greek',
    definition: 'The art, historical study, and science of delicate eating and food preparation.',
    sentence: 'Modern [ _____ ] bridges traditional regional farming with precise kitchen physics.',
    category: 'Culinary Arts'
  },
  {
    id: 'word_coriander',
    word: 'coriander',
    difficulty: 'medium',
    syllables: 'co-ri-an-der',
    phonetic: 'KOR-ee-an-der',
    partOfSpeech: 'noun',
    origin: 'Latin & Greek',
    definition: 'Citrus-scented dried seeds of the cilantro plant used in pickling and spice blends.',
    sentence: 'Cracked [ _____ ] seeds gave the artisan rye loaf a warm floral aroma.',
    category: 'Spices'
  },
  {
    id: 'word_macadamia',
    word: 'macadamia',
    difficulty: 'medium',
    syllables: 'mac-a-da-mi-a',
    phonetic: 'mak-uh-DAY-mee-uh',
    partOfSpeech: 'noun',
    origin: 'Modern Latin',
    definition: 'A rich, buttery round kernel native to Australian subtropical rainforest trees.',
    sentence: 'Roasted [ _____ ] nuts were folded into the brown-butter white chocolate brittle.',
    category: 'Nuts & Seeds'
  },

  // HARD (11-15 letters)
  {
    id: 'word_bouillabaisse',
    word: 'bouillabaisse',
    difficulty: 'hard',
    syllables: 'bouil-la-baisse',
    phonetic: 'BOO-yuh-bays',
    partOfSpeech: 'noun',
    origin: 'Provençal French',
    definition: 'A classic Provençal fish stew infused with saffron, fennel, and orange peel.',
    sentence: 'Every port tavern in Marseille guards its own recipe for saffron [ _____ ].',
    category: 'Gastronomy'
  },
  {
    id: 'word_charcuterie',
    word: 'charcuterie',
    difficulty: 'hard',
    syllables: 'char-cu-te-rie',
    phonetic: 'shar-KOO-tuh-ree',
    partOfSpeech: 'noun',
    origin: 'French',
    definition: 'The culinary branch devoted to prepared meat products such as terrines and rillettes.',
    sentence: 'The wooden board featured house-cured [ _____ ], pickled cornichons, and grain mustard.',
    category: 'Culinary Arts'
  },
  {
    id: 'word_worcestershire',
    word: 'worcestershire',
    difficulty: 'hard',
    syllables: 'worces-ter-shire',
    phonetic: 'WUSS-ter-sheer',
    partOfSpeech: 'noun',
    origin: 'Old English',
    definition: 'A fermented condiment of anchovies, tamarind, molasses, and aged malt vinegar.',
    sentence: 'A dash of [ _____ ] sauce deepened the umami profile of the Welsh rarebit.',
    category: 'Condiments'
  },
  {
    id: 'word_pomegranate',
    word: 'pomegranate',
    difficulty: 'hard',
    syllables: 'pome-gran-ate',
    phonetic: 'POM-uh-gran-it',
    partOfSpeech: 'noun',
    origin: 'Old French & Medieval Latin',
    definition: 'A thick-skinned orchard fruit packed with ruby-red jewel-like arils.',
    sentence: 'Tart [ _____ ] molasses glazed the roasted eggplant and walnut dish.',
    category: 'Produce'
  },
  {
    id: 'word_caramelization',
    word: 'caramelization',
    difficulty: 'hard',
    syllables: 'car-a-mel-i-za-tion',
    phonetic: 'kar-uh-mel-ih-ZAY-shun',
    partOfSpeech: 'noun',
    origin: 'French & Spanish',
    definition: 'Non-enzymatic browning of sugars under heat that yields nutty, complex flavor compounds.',
    sentence: 'Slow [ _____ ] of sweet Vidalia onions takes nearly an hour over low heat.',
    category: 'Food Science'
  },
  {
    id: 'word_confectionery',
    word: 'confectionery',
    difficulty: 'hard',
    syllables: 'con-fec-tion-er-y',
    phonetic: 'kun-FEK-shuh-ner-ee',
    partOfSpeech: 'noun',
    origin: 'Latin',
    definition: 'Sweets, chocolates, pralines, and sugar-work considered collectively as an art.',
    sentence: 'The Viennese [ _____ ] window sparkled with spun sugar and pistachio nougat.',
    category: 'Confections'
  },
  {
    id: 'word_pasteurization',
    word: 'pasteurization',
    difficulty: 'hard',
    syllables: 'pas-teur-i-za-tion',
    phonetic: 'pas-chur-ih-ZAY-shun',
    partOfSpeech: 'noun',
    origin: 'French Eponym',
    definition: 'Controlled mild heat treatment of milk, wine, or juice to eliminate pathogens.',
    sentence: 'Louis Pasteur developed [ _____ ] originally to prevent spoilage in French wine.',
    category: 'Food Science'
  },
  {
    id: 'word_sarsaparilla',
    word: 'sarsaparilla',
    difficulty: 'hard',
    syllables: 'sar-sa-pa-ril-la',
    phonetic: 'sas-puh-RIL-uh',
    partOfSpeech: 'noun',
    origin: 'Spanish',
    definition: 'A carbonated tonic beverage flavored with the aromatic roots of tropical smilax vines.',
    sentence: 'Frosty mugs of house-brewed [ _____ ] were poured from oak barrels.',
    category: 'Beverages'
  },
  {
    id: 'word_fermentation',
    word: 'fermentation',
    difficulty: 'hard',
    syllables: 'fer-men-ta-tion',
    phonetic: 'fer-men-TAY-shun',
    partOfSpeech: 'noun',
    origin: 'Late Latin',
    definition: 'Metabolic conversion of sugars into organic acids, gases, or alcohol by microbes.',
    sentence: 'Wild sourdough [ _____ ] relies on symbiotic lactobacilli and native yeasts.',
    category: 'Food Science'
  },
  {
    id: 'word_anthocyanin',
    word: 'anthocyanin',
    difficulty: 'hard',
    syllables: 'an-tho-cy-a-nin',
    phonetic: 'an-thoh-SY-uh-nin',
    partOfSpeech: 'noun',
    origin: 'New Latin & Greek',
    definition: 'Water-soluble flavonoid pigment giving blueberries, purple corn, and blackberries their hue.',
    sentence: 'Acidic lemon juice shifts [ _____ ] pigments in red cabbage toward vivid magenta.',
    category: 'Biochemistry'
  },

  // VERY LONG (16-45 letters)
  {
    id: 'word_pneumoencephalography',
    word: 'pneumoencephalography',
    difficulty: 'verylong',
    syllables: 'pneu-mo-en-ceph-a-log-ra-phy',
    phonetic: 'noo-moh-en-sef-uh-LOG-ruh-fee',
    partOfSpeech: 'noun',
    origin: 'Medical Greek',
    definition: 'Historical radiographic imaging of the fluid-filled ventricles of the brain.',
    sentence: 'Modern neuroimaging replaced [ _____ ] in clinical neurological diagnostics.',
    category: 'Neuroscience'
  },
  {
    id: 'word_chargoggagoggmanchauggagoggchaubunagungamaugg',
    word: 'chargoggagoggmanchauggagoggchaubunagungamaugg',
    difficulty: 'verylong',
    syllables: 'char-gogg-a-gogg-man-chaugg-a-gogg-chau-bun-a-gung-a-maugg',
    phonetic: 'char-gogg-uh-gogg-man-chaugg-uh-gogg-chau-bun-uh-gung-uh-maugg',
    partOfSpeech: 'proper noun',
    origin: 'Nipmuc Algonquian',
    definition: 'The forty-five-letter traditional Indigenous name for Webster Lake in Massachusetts, meaning fishing place at the boundaries.',
    sentence: 'Spelling all forty-five letters of Lake [ _____ ] is a legendary endurance feat.',
    category: 'Geographic Monument'
  },
  {
    id: 'word_pneumonoultramicroscopicsilicovolcanoconiosis',
    word: 'pneumonoultramicroscopicsilicovolcanoconiosis',
    difficulty: 'verylong',
    syllables: 'pneu-mo-no-ul-tra-mi-cro-scop-ic-sil-i-co-vol-ca-no-co-ni-o-sis',
    phonetic: 'noo-muh-noh-ul-truh-my-kruh-skop-ik-sil-ih-koh-vol-kay-noh-koh-nee-OH-sis',
    partOfSpeech: 'noun',
    origin: 'Classical Latin & Greek Coinage',
    definition: 'A forty-five-letter lung condition caused by inhaling fine ash and siliceous volcanic dust.',
    sentence: 'The longest word in major English dictionaries is [ _____ ].',
    category: 'Grandmaster Crown'
  },
  {
    id: 'word_antixerophthalmic',
    word: 'antixerophthalmic',
    difficulty: 'verylong',
    syllables: 'an-ti-xe-roph-thal-mic',
    phonetic: 'an-tee-zeer-off-THAL-mik',
    partOfSpeech: 'adjective',
    origin: 'Greek',
    definition: 'Counteracting or preventing dry-eye vitamin A deficiency through nutrient-rich foods.',
    sentence: 'Carotenoid-rich sweet potatoes and leafy greens provide [ _____ ] nutritional benefits.',
    category: 'Nutritional Science'
  },
  {
    id: 'word_micropachycephalosaurus',
    word: 'micropachycephalosaurus',
    difficulty: 'verylong',
    syllables: 'mi-cro-pach-y-ceph-a-lo-sau-rus',
    phonetic: 'my-kroh-pak-ee-sef-uh-loh-SOR-us',
    partOfSpeech: 'noun',
    origin: 'Paleontological Greek',
    definition: 'A diminutive herbivorous dinosaur genus bearing the longest twenty-three-letter generic name in paleontology.',
    sentence: 'Despite its tiny stature, [ _____ ] holds the record for the longest dinosaur genus name.',
    category: 'Paleontology'
  },
  {
    id: 'word_polyphiloprogenitive',
    word: 'polyphiloprogenitive',
    difficulty: 'verylong',
    syllables: 'pol-y-phil-o-pro-gen-i-tive',
    phonetic: 'pol-ee-fil-oh-proh-JEN-ih-tiv',
    partOfSpeech: 'adjective',
    origin: 'Greek & Latin',
    definition: 'Extremely prolific, fertile, or producing abundant offspring and botanical yields.',
    sentence: 'Heirloom cherry tomato vines are famously [ _____ ] throughout late summer.',
    category: 'Botany & Lexicon'
  },
  {
    id: 'word_pseudorhombicuboctahedron',
    word: 'pseudorhombicuboctahedron',
    difficulty: 'verylong',
    syllables: 'pseu-do-rhom-bi-cu-boc-ta-he-dron',
    phonetic: 'soo-doh-rom-bih-kyoo-bok-tuh-HEE-drun',
    partOfSpeech: 'noun',
    origin: 'Geometric Greek',
    definition: 'A twenty-six-faced convex polyhedron formed by rotating one square cupola of a rhombicuboctahedron.',
    sentence: 'Crystal lattices and geometric sugar sculptures can model an elongated [ _____ ].',
    category: 'Geometry'
  },
  {
    id: 'word_stereoelectroencephalography',
    word: 'stereoelectroencephalography',
    difficulty: 'verylong',
    syllables: 'ster-e-o-e-lec-tro-en-ceph-a-log-ra-phy',
    phonetic: 'ster-ee-oh-ih-lek-troh-en-sef-uh-LOG-ruh-fee',
    partOfSpeech: 'noun',
    origin: 'New Latin & Greek',
    definition: 'Minimally invasive three-dimensional recording of deep brain electrical signals.',
    sentence: 'Neurologists mapped deep gustatory cortex activity using [ _____ ].',
    category: 'Neuroscience'
  },
  {
    id: 'word_immunoelectrochemiluminescence',
    word: 'immunoelectrochemiluminescence',
    difficulty: 'verylong',
    syllables: 'im-mu-no-e-lec-tro-chem-i-lu-mi-nes-cence',
    phonetic: 'im-yuh-noh-ih-lek-troh-kem-ee-loo-mih-NES-ens',
    partOfSpeech: 'noun',
    origin: 'Scientific Latin & Greek',
    definition: 'Ultra-sensitive analytical assay combining antibody binding with electrochemically triggered light emission.',
    sentence: 'Trace food allergens and vitamin B12 levels are detected via [ _____ ].',
    category: 'Analytical Chemistry'
  },
  {
    id: 'word_corynebacteriumpseudotuberculosis',
    word: 'corynebacteriumpseudotuberculosis',
    difficulty: 'verylong',
    syllables: 'co-ry-ne-bac-te-ri-um-pseu-do-tu-ber-cu-lo-sis',
    phonetic: 'kor-ih-nee-bak-TEER-ee-um-soo-doh-too-ber-kyuh-LOH-sis',
    partOfSpeech: 'noun',
    origin: 'Microbiological Latin & Greek',
    definition: 'A club-shaped Gram-positive bacterium studied in veterinary and agricultural microbiology.',
    sentence: 'Agricultural microbiologists sequenced [ _____ ] to protect pasture livestock.',
    category: 'Microbiology'
  },
  {
    id: 'word_subacutesclerosingpanencephalitis',
    word: 'subacutesclerosingpanencephalitis',
    difficulty: 'verylong',
    syllables: 'sub-a-cute-scle-ros-ing-pan-en-ceph-a-li-tis',
    phonetic: 'sub-uh-kyoot-skluh-ROH-sing-pan-en-sef-uh-LY-tis',
    partOfSpeech: 'noun',
    origin: 'Medical Latin & Greek',
    definition: 'A rare, progressive thirty-three-letter neurological inflammation studied in medical virology.',
    sentence: 'Medical spelling bee finalists practiced [ _____ ] for the grand championship.',
    category: 'Medical Lexicon'
  },
  {
    id: 'word_sulfoquinovosyldiacylglycerol',
    word: 'sulfoquinovosyldiacylglycerol',
    difficulty: 'verylong',
    syllables: 'sul-fo-qui-no-vo-syl-di-a-cyl-glyc-er-ol',
    phonetic: 'sul-foh-kwin-oh-voh-sil-dy-uh-sil-GLIS-er-ol',
    partOfSpeech: 'noun',
    origin: 'Biochemical Latin & Greek',
    definition: 'A sulfur-containing glycolipid abundant in the photosynthetic thylakoid membranes of spinach and leafy greens.',
    sentence: 'Dark green spinach leaves are naturally rich in photosynthetic [ _____ ].',
    category: 'Plant Biochemistry'
  },
  {
    id: 'word_canaliculodacryocystorhinostomy',
    word: 'canaliculodacryocystorhinostomy',
    difficulty: 'verylong',
    syllables: 'can-a-lic-u-lo-dac-ry-o-cys-to-rhi-nos-to-my',
    phonetic: 'kan-uh-lik-yuh-loh-dak-ree-oh-sis-toh-ry-NOS-tuh-mee',
    partOfSpeech: 'noun',
    origin: 'Surgical Greek & Latin',
    definition: 'Microsurgical reconstruction of tear drainage pathways connecting the lacrimal canaliculi to the nasal cavity.',
    sentence: 'Ophthalmic surgeons performed a delicate [ _____ ] under magnification.',
    category: 'Medical Lexicon'
  },
  {
    id: 'word_zoanthroprosopometamorphopsia',
    word: 'zoanthroprosopometamorphopsia',
    difficulty: 'verylong',
    syllables: 'zo-an-thro-pro-so-po-met-a-mor-phop-si-a',
    phonetic: 'zoh-an-throh-proh-soh-poh-met-uh-mor-FOP-see-uh',
    partOfSpeech: 'noun',
    origin: 'Classical Greek',
    definition: 'A rare perceptual distortion in which human faces appear transformed into animal features.',
    sentence: 'Visual neuroscientists documented a rare perceptual case of [ _____ ].',
    category: 'Neuroscience'
  },
  {
    id: 'word_xanthogranulomatouspyelonephritis',
    word: 'xanthogranulomatouspyelonephritis',
    difficulty: 'verylong',
    syllables: 'xan-tho-gran-u-lom-a-tous-py-e-lo-ne-phri-tis',
    phonetic: 'zan-thoh-gran-yuh-LOM-uh-tus-py-uh-loh-neh-FRY-tis',
    partOfSpeech: 'noun',
    origin: 'Medical Greek & Latin',
    definition: 'A chronic thirty-three-letter inflammatory condition characterized by lipid-laden macrophages.',
    sentence: 'Pathology boards frequently test the spelling of [ _____ ].',
    category: 'Medical Lexicon'
  },
  {
    id: 'word_bourgeoisification',
    word: 'bourgeoisification',
    difficulty: 'verylong',
    syllables: 'bour-geoi-si-fi-ca-tion',
    phonetic: 'boor-zhwah-zih-fih-KAY-shun',
    partOfSpeech: 'noun',
    origin: 'French & Latin',
    definition: 'The sociological transformation of humble working-class street foods or neighborhoods into luxury middle-class fare.',
    sentence: 'Culinary historians wrote about the [ _____ ] of rustic peasant stews into haute cuisine.',
    category: 'Culinary Sociology'
  },
  {
    id: 'word_deoxyribonucleic',
    word: 'deoxyribonucleic',
    difficulty: 'verylong',
    syllables: 'de-ox-y-ri-bo-nu-cle-ic',
    phonetic: 'dee-OK-see-ry-boh-noo-KLAY-ik',
    partOfSpeech: 'adjective',
    origin: 'Scientific Latin',
    definition: 'Relating to the double-helix nucleic acid molecule carrying genetic instructions in all living crops.',
    sentence: 'Botanists sequenced the heirloom grain’s [ _____ ] acid to trace its ancient lineage.',
    category: 'Genomics'
  },
  {
    id: 'word_microencapsulation',
    word: 'microencapsulation',
    difficulty: 'verylong',
    syllables: 'mi-cro-en-cap-su-la-tion',
    phonetic: 'my-kroh-en-kap-suh-LAY-shun',
    partOfSpeech: 'noun',
    origin: 'Latin & Greek',
    definition: 'Food engineering technique enveloping volatile essential oils in microscopic protective shells.',
    sentence: 'Flavor chemists use [ _____ ] to keep citrus aromatics stable inside dry baking mixes.',
    category: 'Food Science'
  },
  {
    id: 'word_compartmentalization',
    word: 'compartmentalization',
    difficulty: 'verylong',
    syllables: 'com-part-men-tal-i-za-tion',
    phonetic: 'kum-part-men-tuh-lih-ZAY-shun',
    partOfSpeech: 'noun',
    origin: 'French & Latin',
    definition: 'Division of cellular or culinary storage spaces into distinct, isolated chambers.',
    sentence: 'Strict cold-storage [ _____ ] prevents aromatic truffles from perfuming neighboring dairy.',
    category: 'Architecture'
  },
  {
    id: 'word_uncharacteristically',
    word: 'uncharacteristically',
    difficulty: 'verylong',
    syllables: 'un-char-ac-ter-is-ti-cal-ly',
    phonetic: 'un-kar-ik-ter-IS-tik-lee',
    partOfSpeech: 'adverb',
    origin: 'Greek & English',
    definition: 'In a manner that is atypical or contrary to usual culinary or personal traits.',
    sentence: 'The notoriously fiery chili cultivar tasted [ _____ ] mild after the rainy harvest.',
    category: 'Lexicon'
  },
  {
    id: 'word_electroencephalograph',
    word: 'electroencephalograph',
    difficulty: 'verylong',
    syllables: 'e-lec-tro-en-ceph-a-lo-graph',
    phonetic: 'ih-lek-troh-en-SEF-uh-loh-graf',
    partOfSpeech: 'noun',
    origin: 'New Latin & Greek',
    definition: 'An instrument that measures electrical activity in the brain during sensory taste trials.',
    sentence: 'Sensory researchers used an [ _____ ] to map neural responses to umami broths.',
    category: 'Neuroscience'
  },
  {
    id: 'word_otorhinolaryngological',
    word: 'otorhinolaryngological',
    difficulty: 'verylong',
    syllables: 'o-to-rhi-no-lar-yn-go-log-i-cal',
    phonetic: 'oh-toh-ry-noh-lar-ing-goh-LOJ-ih-kul',
    partOfSpeech: 'adjective',
    origin: 'Ancient Greek',
    definition: 'Pertaining to the medical study of the ear, nose, and throat—central to retronasal aroma perception.',
    sentence: 'Retronasal olfaction relies on [ _____ ] pathways connecting the palate and nasal cavity.',
    category: 'Sensory Science'
  },
  {
    id: 'word_immunoelectrophoretically',
    word: 'immunoelectrophoretically',
    difficulty: 'verylong',
    syllables: 'im-mu-no-e-lec-tro-pho-ret-i-cal-ly',
    phonetic: 'im-yuh-noh-ih-lek-troh-fuh-RET-ik-lee',
    partOfSpeech: 'adverb',
    origin: 'Latin & Greek',
    definition: 'By means of separating and characterizing food proteins based on electrical charge and immunology.',
    sentence: 'Allergen researchers analyzed the legume proteins [ _____ ] in the laboratory.',
    category: 'Biochemistry'
  },
  {
    id: 'word_spectrophotofluorometrically',
    word: 'spectrophotofluorometrically',
    difficulty: 'verylong',
    syllables: 'spec-tro-pho-to-flu-o-ro-met-ri-cal-ly',
    phonetic: 'spek-troh-foh-toh-floor-oh-MET-rik-lee',
    partOfSpeech: 'adverb',
    origin: 'Latin & Greek',
    definition: 'Using an optical instrument to measure riboflavin and antioxidant fluorescence across wavelengths.',
    sentence: 'Vitamin concentrations in the cold-pressed olive oil were quantified [ _____ ].',
    category: 'Analytical Chemistry'
  },
  {
    id: 'word_antidisestablishmentarianism',
    word: 'antidisestablishmentarianism',
    difficulty: 'verylong',
    syllables: 'an-ti-dis-es-tab-lish-men-tar-i-an-ism',
    phonetic: 'an-tee-dis-es-tab-lish-men-TAIR-ee-uh-niz-um',
    partOfSpeech: 'noun',
    origin: '19th-Century English',
    definition: 'A classic twenty-eight-letter spelling bee monument denoting opposition to state church withdrawal.',
    sentence: 'In the final championship round, she spelled [ _____ ] at blistering speed.',
    category: 'Championship Monument'
  },
  {
    id: 'word_floccinaucinihilipilification',
    word: 'floccinaucinihilipilification',
    difficulty: 'verylong',
    syllables: 'floc-ci-nau-ci-ni-hil-i-pil-i-fi-ca-tion',
    phonetic: 'flok-sih-naw-sih-ny-hil-ih-pil-ih-fih-KAY-shun',
    partOfSpeech: 'noun',
    origin: 'Latin',
    definition: 'The action or habit of estimating something as worthless—a legendary twenty-nine-letter bee test.',
    sentence: 'True artisans never treat humble fermentation with [ _____ ].',
    category: 'Championship Monument'
  },
  {
    id: 'word_pseudopseudohypoparathyroidism',
    word: 'pseudopseudohypoparathyroidism',
    difficulty: 'verylong',
    syllables: 'pseu-do-pseu-do-hy-po-par-a-thy-roid-ism',
    phonetic: 'soo-doh-soo-doh-hy-poh-par-uh-THY-roy-diz-um',
    partOfSpeech: 'noun',
    origin: 'Medical Greek',
    definition: 'An inherited thirty-letter endocrine condition mimicking calcium-metabolism hormone resistance.',
    sentence: 'Conquering [ _____ ] without a single typo earned the Grandmaster Bee trophy.',
    category: 'Medical Lexicon'
  },
  {
    id: 'word_supercalifragilisticexpialidocious',
    word: 'supercalifragilisticexpialidocious',
    difficulty: 'verylong',
    syllables: 'su-per-cal-i-frag-i-lis-tic-ex-pi-al-i-do-cious',
    phonetic: 'soo-per-kal-ih-fraj-ih-lis-tik-eks-pee-al-ih-DOH-shus',
    partOfSpeech: 'adjective',
    origin: '20th-Century Coinage',
    definition: 'Extraordinarily wonderful or stupendous—the thirty-four-letter endurance crown of Food’s Spelling Bee.',
    sentence: 'Typing all thirty-four letters of [ _____ ] in under four seconds demands extraordinary dexterity.',
    category: 'Grandmaster Crown'
  }
];
