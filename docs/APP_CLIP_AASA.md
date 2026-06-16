# App Clip: publicar o AASA no GitHub Pages

O arquivo que o iOS usa para Universal Links e App Clips fica em:

```
public/.well-known/apple-app-site-association
```

No build de produção (`next build` com `output: export`), o Next.js copia `public/` para `out/`. O deploy do GitHub Actions publica `./out` no Pages.

URL final:

```
https://yo-self.com/.well-known/apple-app-site-association
```

## Como subir

1. Commit e push na branch `main` do repositório `yo-self.github.io` (pasta local: `Develop/web-version`).
2. O workflow `.github/workflows/nextjs.yml` faz build + deploy automaticamente.
3. Após o deploy, valide:

```bash
curl -i https://yo-self.com/.well-known/apple-app-site-association
```

Esperado: `HTTP/2 200` e JSON com `applinks` + `appclips`.

## Arquivos relacionados

| Arquivo | Função |
|---------|--------|
| `public/.well-known/apple-app-site-association` | Configuração Apple (sem extensão) |
| `public/.nojekyll` | Evita que o Jekyll ignore `.well-known` |
| `public/CNAME` | Domínio customizado `yo-self.com` no Pages |
| `scripts/verify-aasa.js` | Falha o build se o AASA não estiver em `out/` |

## Rotas cobertas

- `/restaurant/*` — cardápio na mesa
- `/restaurante/*` — alias em português
- `/delivery/*` — pedidos delivery

## App Store Connect

Crie o App Clip Experience apontando para `yo-self.com` com as mesmas rotas acima.
