# MCP Server — Streaming Customers

Servidor MCP (Model Context Protocol) para consulta de dados de clientes, filmes e wishlists de um serviço de streaming. Utiliza banco de dados SQLite local e se comunica via transporte stdio, podendo ser integrado diretamente ao Cursor ou ao Claude Desktop.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- npm

---

## Instalação

```bash
npm install
```

---

## Configuração do banco de dados

O projeto usa três bancos SQLite (`customers.db`, `movies.db`, `logs.db`) armazenados na pasta `data/`. Para criá-los e populá-los com dados de exemplo, execute:

```bash
npm run seed
```

Isso gera:
- **50 clientes** com nome, e-mail, documento e histórico de login
- **15 filmes** em 3 categorias (Ação, Comédia, Drama)
- **20 itens** de wishlist distribuídos entre os clientes

---

## Build

Compile o TypeScript para JavaScript antes de usar o servidor:

```bash
npm run build
```

Os arquivos compilados ficam em `build/`.

---

## Integrando ao Cursor (MCP)

Adicione o servidor na configuração MCP do Cursor (`~/.cursor/mcp.json` ou nas configurações do projeto):

```json
{
  "mcpServers": {
    "customers": {
      "command": "node",
      "args": ["caminho/absoluto/para/build/index.js"]
    }
  }
}
```

Após salvar, o Cursor detectará automaticamente as ferramentas disponíveis.

---

## Ferramentas disponíveis

### `listCustomers`
Lista clientes com filtros opcionais.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `filters.customerIdList` | `number[]` | Lista de IDs de clientes |
| `filters.name` | `string` | Busca parcial por nome |
| `filters.email` | `string` | Busca parcial por e-mail |
| `filters.document` | `string` | Busca parcial por documento |
| `filters.lastLoginMin` | `date` | Data mínima do último login |
| `filters.lastLoginMax` | `date` | Data máxima do último login |
| `fields` | `string[]` | Campos a retornar: `id`, `name`, `email`, `document`, `lastLogin` |

---

### `listMovies`
Lista filmes com filtros opcionais.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `filters.movieId` | `number` | ID do filme |
| `filters.categoryId` | `number` | ID da categoria |
| `filters.name` | `string` | Nome do filme |
| `filters.slug` | `string` | Slug do filme |
| `filters.description` | `string` | Trecho da descrição |
| `filters.categoryName` | `string` | Nome da categoria |
| `fields` | `string[]` | Campos a retornar: `id`, `name`, `slug`, `description`, `categoryId`, `categoryName` |

---

### `getCustomerMovieWishlist`
Lista os filmes na wishlist de um ou mais clientes.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `customerId` | `number` | ID do cliente |
| `movieId` | `number` | ID do filme |
| `movieName` | `string` | Nome do filme |

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Compila o TypeScript para `build/` |
| `npm run seed` | Cria e popula os bancos SQLite |
| `npm run debug:customers` | Faz build e executa o script de debug de clientes |

---

## Estrutura do projeto

```
├── src/
│   ├── index.ts          # Ponto de entrada do servidor MCP
│   ├── customers.ts      # Queries de clientes
│   ├── movies.ts         # Queries de filmes e wishlists
│   ├── database.ts       # Helpers de conexão SQLite
│   └── logs.ts           # Registro de logs
├── scripts/
│   └── seed-databases.mjs  # Script de seed dos bancos
├── build/                # Arquivos compilados (gerado pelo build)
├── data/                 # Bancos SQLite (gerado pelo seed)
└── package.json
```
