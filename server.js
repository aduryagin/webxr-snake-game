const http = require('http');
const path = require('path');
const fs = require('fs');

const server = http.createServer((request, response) => {
  let filePath = `.${request.url}`;

  if (filePath === './') filePath = './index.html';

  const extname = path.extname(filePath);
  let contentType = 'text/html';

  switch (extname) {
    case '.mjs':
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    default:
      contentType = 'text/html';
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('File not found', 'utf-8');
      } else {
        response.writeHead(500);
        response.end(error.code);
        response.end();
      }
    } else {
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(content, 'utf-8');
    }
  });
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});

server.listen(process.env.PORT || 3000);
console.log('Server is listening...');