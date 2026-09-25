const http = require('http');
const { URL } = require('url');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generateSuggestions, detectTextType, generateLocalSuggestions } = require('./suggestions.js');

const PORT = Number(process.env.PORT || 3001);
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

async function fetchSupabaseDictionary() {
  if (!supabase) {
    return { themes: [], words: [], phraseTemplates: [], available: false };
  }

  try {
    const [{ data: themes = [], error: themesError }, { data: words = [], error: wordsError }, { data: phraseTemplates = [], error: templatesError }] = await Promise.all([
      supabase.from('themes').select('*').order('name'),
      supabase.from('words').select('*').order('weight', { ascending: false }),
      supabase.from('phrase_templates').select('*').order('weight', { ascending: false })
    ]);

    if (themesError || wordsError || templatesError) {
      console.warn('Supabase read issue:', { themesError, wordsError, templatesError });
      return { themes: [], words: [], phraseTemplates: [], available: false };
    }

    return {
      themes: themes || [],
      words: words || [],
      phraseTemplates: phraseTemplates || [],
      available: true
    };
  } catch (error) {
    console.warn('Supabase connection unavailable:', error.message || error);
    return { themes: [], words: [], phraseTemplates: [], available: false };
  }
}

function scoreSupabaseMatch(text, item) {
  const source = String(text || '').toLowerCase();
  const pieces = [item.word, item.lemma, item.theme_name, item.genre, item.tone, item.emotional_tag, item.style, item.text].filter(Boolean).join(' ').toLowerCase();

  let score = Number(item.weight || 1);
  const normalized = source.trim();

  if (!normalized) return score;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  tokens.forEach((token) => {
    if (pieces.includes(token.toLowerCase())) score += 1.5;
  });

  if (source.includes((item.word || '').toLowerCase())) score += 3;
  if (item.theme_name && source.includes(String(item.theme_name).toLowerCase())) score += 2;

  return score;
}

async function buildSupabaseSuggestions(text) {
  const dictionary = await fetchSupabaseDictionary();
  if (!dictionary.available) {
    return {
      enabled: false,
      source: 'local-only',
      suggestions: [],
      themes: [],
      words: [],
      templates: []
    };
  }

  const normalized = String(text || '').trim();
  const themeMatches = dictionary.themes
    .filter((theme) => {
      if (!normalized) return true;
      return String(theme.name || '').toLowerCase().includes(normalized.toLowerCase()) || String(theme.description || '').toLowerCase().includes(normalized.toLowerCase());
    })
    .map((theme) => theme.name);

  const words = (dictionary.words || [])
    .map((word) => ({ ...word, theme_name: dictionary.themes.find((theme) => theme.id === word.theme_id)?.name || null }))
    .filter((word) => {
      if (!normalized) return true;
      const matchTheme = themeMatches.length === 0 || themeMatches.includes(word.theme_name);
      const textMatch = [word.word, word.lemma, word.genre, word.tone, word.emotional_tag, word.style].join(' ').toLowerCase().includes(normalized.toLowerCase());
      return matchTheme || textMatch;
    })
    .map((word) => ({ ...word, score: scoreSupabaseMatch(normalized, word) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  const templates = (dictionary.phraseTemplates || [])
    .map((template) => ({ ...template, theme_name: dictionary.themes.find((theme) => theme.id === template.theme_id)?.name || null }))
    .filter((template) => {
      if (!normalized) return true;
      const matchTheme = themeMatches.length === 0 || themeMatches.includes(template.theme_name);
      const textMatch = String(template.text || '').toLowerCase().includes(normalized.toLowerCase());
      return matchTheme || textMatch;
    })
    .map((template) => ({ ...template, score: scoreSupabaseMatch(normalized, { ...template, word: String(template.text || '').slice(0, 40), theme_name: template.theme_name, weight: template.weight }) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    enabled: true,
    source: 'supabase',
    suggestions: [
      ...words.map((item) => ({ type: 'word', value: item.word, score: item.score, theme: item.theme_name })),
      ...templates.map((item) => ({ type: 'phrase', value: item.text, score: item.score, theme: item.theme_name }))
    ].sort((a, b) => b.score - a.score).slice(0, 10),
    themes: dictionary.themes,
    words,
    templates
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      service: 'textplaystore-backend',
      environment: process.env.NODE_ENV || 'development',
      supabase: Boolean(supabase),
      endpoints: ['/api/health', '/api/suggestions', '/api/text-type', '/api/local-suggestions']
    }));
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (url.pathname === '/api/health') {
    const dictionary = await fetchSupabaseDictionary();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: true,
      service: 'textplaystore-backend',
      timestamp: new Date().toISOString(),
      supabaseConnected: Boolean(supabase) && dictionary.available,
      port: PORT,
      database: dictionary.available ? 'supabase-connected' : 'local-fallback'
    }));
    return;
  }

  if (url.pathname === '/api/themes') {
    const dictionary = await fetchSupabaseDictionary();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      enabled: dictionary.available,
      themes: dictionary.themes || []
    }));
    return;
  }

  if (url.pathname === '/api/dictionaries') {
    const dictionary = await fetchSupabaseDictionary();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      enabled: dictionary.available,
      themes: dictionary.themes || [],
      words: dictionary.words || [],
      phraseTemplates: dictionary.phraseTemplates || [],
      warning: dictionary.available ? null : 'Supabase not configured yet'
    }));
    return;
  }

  if (url.pathname === '/api/suggestions') {
    const text = url.searchParams.get('text') || '';
    const includeWebIdeas = url.searchParams.get('includeWebIdeas') === 'true';

    try {
      const supabaseSuggestions = await buildSupabaseSuggestions(text);
      const localSuggestions = await generateSuggestions(text, { includeWebIdeas });

      const payload = supabaseSuggestions.enabled
        ? {
            ...localSuggestions,
            source: 'supabase-plus-local',
            supabase: supabaseSuggestions,
            suggestions: [...(supabaseSuggestions.suggestions || []), ...(localSuggestions.suggestions || [])]
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .slice(0, 10)
          }
        : {
            ...localSuggestions,
            source: 'local',
            supabase: { enabled: false }
          };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    } catch (error) {
      console.error('Suggestion generation failed:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Suggestion generation failed' }));
      return;
    }
  }

  if (url.pathname === '/api/text-type') {
    const text = url.searchParams.get('text') || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(detectTextType(text)));
    return;
  }

  if (url.pathname === '/api/local-suggestions') {
    const text = url.searchParams.get('text') || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(generateLocalSuggestions(text)));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
  console.log('Supabase configured:', Boolean(supabase));
});

module.exports = { server, PORT };
