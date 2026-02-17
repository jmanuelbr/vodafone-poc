export async function render(context) {
  const { content } = context;

  // Fallbacks if pipeline didn't set html/title
  const body = content.html || '<p>No content</p>';
  const title = content.title || 'Vodafone Modernization Agent';

  return {
    headers: {
      'content-type': 'text/html; charset=utf-8',
    },
    body: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
</head>
<body>
${body}
</body>
</html>`
  };
}
