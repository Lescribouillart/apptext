const http = require('http');
const { URL } = require('url');
const { generateSuggestions, detectTextType, generateLocalSuggestions } = require('./suggestions.js');

const PORT = process.env.PORT || 3001;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'textplaystore-backend' }));
    return;
  }

  if (url.pathname === '/api/suggestions') {
    const text = url.searchParams.get('text') || '';
    const includeWebIdeas = url.searchParams.get('includeWebIdeas') === 'true';

    try {
      const result = await generateSuggestions(text, { includeWebIdeas });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
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
});
