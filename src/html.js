export async function render(context) {
  const { content } = context;

  // If there's markdown, convert it to HTML using the built-in pipeline
  // In Helix 5, the default pipeline exposes `content.html` once transformed
  const body = content.html || '<p>No content</p>';

  return {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${content.title || 'Vodafone Modernization Agent'}</title>
</head>
<body>
${body}
</body>
</html>`
  };
}

