// Curated Unsplash produce photo IDs. All were HTTP-verified 200.
// getProduceImage(name, category) returns a URL: first tries a keyword match
// (English or Arabic transliteration), then falls back to a category default.

const U = (id, w = 400) => `https://images.unsplash.com/${id}?w=${w}&q=80&auto=format&fit=crop`;

// Category defaults (rotated) so a page of unmatched items doesn't repeat.
const CATEGORY_FALLBACKS = {
  FRUITS: [
    'photo-1610832958506-aa56368176cf',
    'photo-1567306226416-28f0efdc88ce',
    'photo-1590779033100-9f60a05a013d',
    'photo-1502741338009-cac2772e18bc',
  ],
  VEGETABLES: [
    'photo-1590779033100-9f60a05a013d',
    'photo-1466637574441-749b8f19452f',
    'photo-1543168256-418811576931',
    'photo-1573246123716-6b1782bfc499',
    'photo-1560493676-04071c5f467b',
  ],
  HERBS: [
    'photo-1587049352846-4a222e784d38',
    'photo-1524593689594-aae2f26b75ab',
  ],
  DEFAULT: ['photo-1488459716781-31db52582fe9'],
};

// Specific product → photo ID.
// Keys are lowercase English keywords found in the seeded product names.
const KEYWORDS = [
  // Fruits — citrus / stone / core
  ['orange',       'photo-1580052614034-c55d20bfee3b'],
  ['lemon',        'photo-1580052614034-c55d20bfee3b'],
  ['lime',         'photo-1580052614034-c55d20bfee3b'],
  ['grapefruit',   'photo-1580052614034-c55d20bfee3b'],
  ['pomelo',       'photo-1580052614034-c55d20bfee3b'],
  ['clemantine',   'photo-1580052614034-c55d20bfee3b'],
  ['apple',        'photo-1567306226416-28f0efdc88ce'],
  ['pear',         'photo-1567306226416-28f0efdc88ce'],
  ['ijaas',        'photo-1567306226416-28f0efdc88ce'],
  ['banana',       'photo-1571771894821-ce9b6c11b08e'],
  ['pineapple',    'photo-1550258987-190a2d41a8ba'],
  ['pinapple',     'photo-1550258987-190a2d41a8ba'],
  ['avocado',      'photo-1523049673857-eb18f1d7b578'],
  ['avogado',      'photo-1523049673857-eb18f1d7b578'],
  ['mango',        'photo-1553279768-865429fa0078'],
  ['kiwi',         'photo-1585059895524-72359e06133a'],
  ['coconut',      'photo-1502741338009-cac2772e18bc'],
  ['dragon',       'photo-1601493700631-2b16ec4b4716'],
  ['persimmon',    'photo-1567306226416-28f0efdc88ce'],
  ['askadnia',     'photo-1567306226416-28f0efdc88ce'],
  ['plum',         'photo-1610832958506-aa56368176cf'],
  ['peach',        'photo-1502741338009-cac2772e18bc'],
  ['nactarine',    'photo-1502741338009-cac2772e18bc'],
  ['nectarine',    'photo-1502741338009-cac2772e18bc'],
  ['apricot',      'photo-1502741338009-cac2772e18bc'],
  ['pomegranate',  'photo-1571680322279-a226e6a4cc2a'],
  ['cherry',       'photo-1518635017498-87f514b751ba'],
  ['leeche',       'photo-1502741338009-cac2772e18bc'],
  // Berries
  ['strawberry',   'photo-1518635017498-87f514b751ba'],
  ['raspberry',    'photo-1518635017498-87f514b751ba'],
  ['blackberry',   'photo-1596363505729-4190a9506133'],
  ['blueberry',    'photo-1596363505729-4190a9506133'],
  // Melons / grapes
  ['watermelon',   'photo-1587049352851-8d4e89133924'],
  ['water melon',  'photo-1587049352851-8d4e89133924'],
  ['melon',        'photo-1587049352851-8d4e89133924'],
  ['grape',        'photo-1596363505729-4190a9506133'],

  // Vegetables
  ['tomato',       'photo-1524593689594-aae2f26b75ab'],
  ['onion',        'photo-1587049352846-4a222e784d38'],
  ['shallot',      'photo-1587049352846-4a222e784d38'],
  ['garlic',       'photo-1587049352846-4a222e784d38'],
  ['potato',       'photo-1518977676601-b53f82aba655'],
  ['sweet potato', 'photo-1518977676601-b53f82aba655'],
  ['carrot',       'photo-1447175008436-054170c2e979'],
  ['cucumber',     'photo-1449300079323-02e209d9d3a6'],
  ['pepper',       'photo-1567620832903-9fc6debc209f'],
  ['peper',        'photo-1567620832903-9fc6debc209f'],
  ['broccoli',     'photo-1459411552884-841db9b3cc2a'],
  ['cauliflower',  'photo-1568702846914-96b305d2aaeb'],
  ['cabagge',      'photo-1568702846914-96b305d2aaeb'],
  ['cabbage',      'photo-1568702846914-96b305d2aaeb'],
  ['zucchini',     'photo-1590779033100-9f60a05a013d'],
  ['eggplant',     'photo-1590779033100-9f60a05a013d'],
  ['pumpkin',      'photo-1466637574441-749b8f19452f'],
  ['bean',         'photo-1543168256-418811576931'],
  ['peas',         'photo-1543168256-418811576931'],
  ['artichoke',    'photo-1466637574441-749b8f19452f'],
  ['corn',         'photo-1466637574441-749b8f19452f'],
  ['mushroom',     'photo-1552825897-bb5efa86eab1'],
  ['ginger',       'photo-1447175008436-054170c2e979'],
  ['beetroot',     'photo-1447175008436-054170c2e979'],
  ['leeks',        'photo-1587049352846-4a222e784d38'],
  ['celery',       'photo-1524593689594-aae2f26b75ab'],
  ['radish',       'photo-1524593689594-aae2f26b75ab'],
  ['fennel',       'photo-1524593689594-aae2f26b75ab'],
  ['asparagus',    'photo-1524593689594-aae2f26b75ab'],
  ['aspergillus',  'photo-1524593689594-aae2f26b75ab'],

  // Greens & herbs
  ['lettuce',      'photo-1524593689594-aae2f26b75ab'],
  ['iceberg',      'photo-1524593689594-aae2f26b75ab'],
  ['romain',       'photo-1524593689594-aae2f26b75ab'],
  ['romaine',      'photo-1524593689594-aae2f26b75ab'],
  ['kale',         'photo-1524593689594-aae2f26b75ab'],
  ['rosso',        'photo-1524593689594-aae2f26b75ab'],
  ['verde',        'photo-1524593689594-aae2f26b75ab'],
  ['freeze',       'photo-1524593689594-aae2f26b75ab'],
  ['andive',       'photo-1524593689594-aae2f26b75ab'],
  ['sucrine',      'photo-1524593689594-aae2f26b75ab'],
  ['spanish',      'photo-1587049352846-4a222e784d38'],
  ['spinach',      'photo-1587049352846-4a222e784d38'],
  ['seleek',       'photo-1587049352846-4a222e784d38'],
  ['roka',         'photo-1587049352846-4a222e784d38'],
  ['roca',         'photo-1587049352846-4a222e784d38'],
  ['rocket',       'photo-1587049352846-4a222e784d38'],
  ['arugula',      'photo-1587049352846-4a222e784d38'],
  ['misclane',     'photo-1587049352846-4a222e784d38'],
  ['micro',        'photo-1587049352846-4a222e784d38'],
  ['purslane',     'photo-1587049352846-4a222e784d38'],
  ['baby spanish', 'photo-1587049352846-4a222e784d38'],
  ['jute mallow',  'photo-1587049352846-4a222e784d38'],
  ['bamboo',       'photo-1587049352846-4a222e784d38'],
  ['beetroot leaves', 'photo-1587049352846-4a222e784d38'],

  ['parsley',      'photo-1524593689594-aae2f26b75ab'],
  ['mint',         'photo-1524593689594-aae2f26b75ab'],
  ['basil',        'photo-1524593689594-aae2f26b75ab'],
  ['thyme',        'photo-1524593689594-aae2f26b75ab'],
  ['rosmary',      'photo-1524593689594-aae2f26b75ab'],
  ['rosemary',     'photo-1524593689594-aae2f26b75ab'],
  ['sage',         'photo-1524593689594-aae2f26b75ab'],
  ['coriander',    'photo-1524593689594-aae2f26b75ab'],
  ['cilantro',     'photo-1524593689594-aae2f26b75ab'],
  ['chives',       'photo-1524593689594-aae2f26b75ab'],
  ['ciboulette',   'photo-1524593689594-aae2f26b75ab'],
  ['dill',         'photo-1524593689594-aae2f26b75ab'],
  ['cymbopogon',   'photo-1524593689594-aae2f26b75ab'],
];

let fallbackCursor = 0;

export function getProduceImage(name, category, width = 400) {
  if (name) {
    const lower = String(name).toLowerCase();
    for (const [kw, id] of KEYWORDS) {
      if (lower.includes(kw)) return U(id, width);
    }
  }
  const cat = (category || '').toUpperCase();
  let bucket = CATEGORY_FALLBACKS[cat];
  if (!bucket) {
    // Some seeded rows use "WEEDS" (herbs/greens) — map to HERBS.
    if (cat === 'WEEDS') bucket = CATEGORY_FALLBACKS.HERBS;
    else bucket = CATEGORY_FALLBACKS.DEFAULT;
  }
  const idx = fallbackCursor++ % bucket.length;
  return U(bucket[idx], width);
}

// Stable fallback (doesn't advance the rotation cursor) — use in maps.
export function stableProduceImage(name, category, width = 400) {
  if (name) {
    const lower = String(name).toLowerCase();
    for (const [kw, id] of KEYWORDS) {
      if (lower.includes(kw)) return U(id, width);
    }
  }
  const cat = (category || '').toUpperCase();
  let bucket = CATEGORY_FALLBACKS[cat] ||
               (cat === 'WEEDS' ? CATEGORY_FALLBACKS.HERBS : CATEGORY_FALLBACKS.DEFAULT);
  // Deterministic pick: hash name into an index so the same product
  // always gets the same fallback image.
  const seed = (name || cat || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return U(bucket[seed % bucket.length], width);
}

export default { getProduceImage, stableProduceImage };
