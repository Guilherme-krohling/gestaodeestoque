export function renderErrorPage(): string {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Erro Interno do Servidor</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 1rem;
        }
        .container {
          max-width: 28rem;
          text-align: center;
          background-color: white;
          padding: 2rem;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        p {
          font-size: 0.875rem;
          color: #64748b;
          margin-bottom: 1.5rem;
        }
        button {
          background-color: #0284c7;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover {
          background-color: #0369a1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Erro no carregamento da página</h1>
        <p>Ocorreu um problema ao processar esta página no servidor. Por favor, tente novamente.</p>
        <button onclick="window.location.reload()">Recarregar Página</button>
      </div>
    </body>
    </html>
  `;
}
