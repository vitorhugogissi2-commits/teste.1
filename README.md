# Nexus Dash & Store

Plataforma de **e-commerce + gestao de servicos** com atualizacao **em tempo real**
(sem recarregar a pagina). Quando o administrador muda o preco, o stock ou o estado de
um pedido, o cliente ve a mudanca no mesmo instante — via `onSnapshot` do Firestore.

## Stack

| Camada         | Tecnologia                        |
| -------------- | --------------------------------- |
| Frontend       | React 18 + Vite + CSS3            |
| Base de dados  | Firebase Firestore (NoSQL)        |
| Autenticacao   | Firebase Auth (e-mail/senha + Google) |
| Armazenamento  | Firebase Storage (imagens do catalogo) |
| Graficos       | Recharts                          |
| Alojamento     | Vercel                            |
| Versionamento  | Git + GitHub                      |

## Arrancar no VS Code

```powershell
npm install
Copy-Item .env.example .env.local   # preenche as chaves do teu projeto Firebase
npm run dev
```

> Sem o `.env.local` preenchido a aplicacao arranca com um aviso no topo — as chamadas ao
> Firestore falham ate configurares o projeto.

## Configurar o Firebase

1. Cria um projeto em <https://console.firebase.google.com>.
2. **Authentication** → ativa `E-mail/Password` e `Google`. Para 2FA, ativa
   *Multi-factor authentication* nas definicoes de autenticacao.
3. **Firestore Database** → cria a base em modo producao.
4. **Storage** → ativa o bucket para as imagens dos produtos.
5. Console → Configuracoes do projeto → *As tuas apps* → **Web** (`</>`) → copia o objeto
   `firebaseConfig` para o `.env.local`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_ADMIN_EMAILS=admin@nexusdash.com
```

6. Publica as regras de seguranca (as que estao neste repositorio):

```powershell
npm i -g firebase-tools
firebase login
firebase use --add            # escolhe o teu projeto
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Definir um administrador

Ha duas formas — usa as duas para seguranca:

**a) Via `.env.local` (rapido, para desenvolvimento)**
Coloca o e-mail em `VITE_ADMIN_EMAILS`. No registo/login, o documento em `users` recebe
`role: "admin"` e a rota `/admin` fica acessivel.

**b) Via custom claim (recomendado em producao)**
As regras do Firestore verificam `request.auth.token.role == 'admin'`:

```powershell
# Console Firebase > Configuracoes > Contas de servico > Gerar nova chave privada
# Guarda o ficheiro como serviceAccount.json na raiz do projeto
npm i firebase-admin --no-save
node scripts/setAdmin.mjs admin@nexusdash.com
```

Faz logout/login para o token ser renovado.

## Fluxo em tempo real (como funciona na pratica)

1. O cliente faz o pedido em `/checkout` → grava em `orders` e baixa o stock em batch.
2. `/admin/pedidos` esta a escutar `orders` com `onSnapshot`: aparece um **alerta visual**
   (cartao destacado) e sonoro (Web Audio).
3. O administrador clica em *Avancar para ...* ou escolhe o estado na lista.
4. O cliente ve a barra de progresso mudar em `/minha-conta` e `/pedido/:id` no mesmo
   instante — **zero refresh**.

Estados: `Aguardando Pagamento → Pago → Em Preparacao → Pronto/Expedido → Concluido`
(e `Cancelado`).

## Estrutura do projeto

```
src/
  components/          Componentes reutilizaveis (layout, cards, status bar)
  context/             AuthContext (sessao/perfil) e CartContext (carrinho)
  hooks/               useRealtimeCollection / useRealtimeDoc (onSnapshot)
  lib/
    firebase.js        Init do Firebase (Auth, Firestore c/ cache offline, Storage)
    constants.js       Estados, pagamentos, frete, formatacao e calculo de totais
    seed.js            Dados de demonstracao do catalogo
  pages/
    store/             Catalogo, detalhe, checkout, comprovativo, dashboard do cliente
    admin/             Pedidos (feed ao vivo), catalogo (CRUD), metricas, clientes
    auth/              Login / registo (e-mail + Google)
  services/            Escritas no Firestore/Storage (pedidos, produtos)
firestore.rules        Regras de seguranca do Firestore
storage.rules          Regras de seguranca do Storage
firestore.indexes.json Indices compostos
scripts/setAdmin.mjs   Atribui a custom claim role=admin
```

## Funcionalidades

**Loja**
- Catalogo com categorias dinamicas, pesquisa e ordenacao (atualiza sozinho).
- Carrinho persistente (localStorage) com calculo imediato de frete, desconto e total.
- Checkout com Pix (-5%) ou Cartao de Credito e comprovativo com codigo do pedido.
- Dashboard do cliente com historico e barra de estado em tempo real.

**Admin**
- Monitor de pedidos ao vivo com alerta visual + sonoro de novos pedidos.
- CRUD completo do catalogo: formulario, upload de imagens para o Storage, ativar/desativar.
- Alertas de stock critico (≤ 5 unidades).
- Metricas: faturacao, ticket medio, graficos de vendas por dia e produtos mais vendidos.
- Gestao de clientes com historico individual (drawer lateral).
- Botao "Carregar dados de exemplo" quando o catalogo esta vazio.

## Deploy na Vercel

1. Faz `git init` e envia para o GitHub.
2. Em <https://vercel.com> → *Add New Project* → importa o repositorio.
3. Framework detetado: **Vite** (`vercel.json` ja define build e rewrites de SPA).
4. Em *Environment Variables*, adiciona as mesmas chaves do `.env.local`.
5. Deploy. Cada `git push` gera um novo deploy automatico.

## Notas de seguranca

- As regras permitem leitura publica do catalogo e escrita apenas a administradores.
- Um cliente so le/escreve os seus proprios pedidos e perfil.
- O upload de imagens aceita apenas `image/*` ate 5 MB e exige `role=admin`.
- Antes de ir a producao, ativa o 2FA no Firebase Authentication para as contas de admin.
