# SCANIX BODY — Performance Intelligence Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

> Plataforma de gestão de performance esportiva e saúde pessoal para atletas de alta performance.

---

## O que é o SCANIX BODY

**SCANIX BODY** é uma aplicação web dark/tech/atlética que centraliza gestão de treinos, nutrição, composição corporal, bioimpedância, exames laboratoriais, medicamentos e análise inteligente em uma única plataforma. Toda a arquitetura foi pensada para escalar para app mobile consumindo as mesmas APIs e regras de negócio.

---

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Treinos** | Criação de dias de treino, exercícios, séries, cargas e importação por arquivo |
| **Registrar Treino** | Log de sessões com detecção automática de PR (Personal Record) |
| **Progresso** | Estatísticas, gráficos de evolução por exercício e volume total |
| **Histórico** | Sessões registradas com detalhamento e exclusão |
| **Dieta** | Cadastro manual, análise por IA e importação de plano alimentar |
| **Corpo & Objetivo** | Composição corporal completa com cálculos (IMC, TMB, TDEE, segmentar) |
| **Bioimpedância** | Upload de PDF InBody com extração automática via IA |
| **Medicamentos** | Cadastro de hormônios, peptídeos, suplementos e medicamentos |
| **Exames** | Importação de laudos com extração de marcadores laboratoriais |
| **Cardio** | Perfil de cardio (tipo, intensidade, duração, frequência) |
| **Análise IA** | Score por eixo + recomendações + ajustes de macros e hidratação |
| **Admin** | CRUD de usuários, perfis, permissões e logs de auditoria |

---

## Stack

| Tecnologia | Propósito | Versão |
|-----------|-----------|--------|
| Next.js (App Router) | Framework full-stack com SSR/SSG e API Routes | 14 |
| TypeScript | Tipagem estática de ponta a ponta | 5.x |
| Tailwind CSS | Estilização com design tokens | 3.x |
| Supabase | Banco Postgres, Auth, Storage, RLS | latest |
| Zustand | Estado global leve e escalável | 4.x |
| React Hook Form + Zod | Validação de formulários type-safe | latest |
| Recharts | Gráficos de progresso | 2.x |
| Lucide React | Ícones | latest |
| date-fns | Manipulação de datas (pt-BR) | 3.x |

---

## Arquitetura

```
Browser
  │
  ├─ Next.js App Router (Server Components / Client Components)
  │     ├─ (auth)/     → login, primeiro-acesso, recuperar-senha
  │     └─ (app)/      → todos os módulos + admin
  │
  ├─ API Routes /api/v1/
  │     ├─ treinos, sessoes, corpo, dieta
  │     ├─ medicamentos, exames, cardio
  │     ├─ analise-ia, uploads, ai/extract
  │     └─ admin/usuarios, admin/logs
  │
  ├─ Domain Layer (pure TypeScript functions)
  │     ├─ body-calculations.ts   → IMC, TMB, TDEE, peso ideal
  │     ├─ workout-calculations.ts → volume, PR detection, progresso
  │     ├─ nutrition-calculations.ts → macros, metas nutricionais
  │     └─ ai-scoring.ts          → scores por eixo (0-100)
  │
  ├─ Service Layer
  │     ├─ auth, treinos, corpo, dieta, medicamentos
  │     ├─ exames, admin, audit, import, ai
  │
  └─ Supabase
        ├─ PostgreSQL (18 tables + RLS)
        ├─ Auth (magic link + email/password)
        └─ Storage (bioimpedance, exams, workouts, etc.)
```

---

## Estrutura de Pastas

```
scanixbody/
├─ src/
│   ├─ app/
│   │   ├─ (auth)/                   # Páginas de autenticação
│   │   │   ├─ login/
│   │   │   ├─ primeiro-acesso/
│   │   │   └─ recuperar-senha/
│   │   ├─ (app)/                    # Páginas protegidas
│   │   │   ├─ dashboard/
│   │   │   ├─ treinos/
│   │   │   ├─ registrar-treino/
│   │   │   ├─ progresso/
│   │   │   ├─ historico/
│   │   │   ├─ dieta/
│   │   │   ├─ corpo/
│   │   │   ├─ bioimpedancia/
│   │   │   ├─ medicamentos/
│   │   │   ├─ exames/
│   │   │   ├─ cardio/
│   │   │   ├─ analise-ia/
│   │   │   ├─ perfil/
│   │   │   ├─ configuracoes/
│   │   │   └─ admin/
│   │   │       ├─ usuarios/
│   │   │       ├─ perfis/
│   │   │       └─ logs/
│   │   └─ api/v1/                   # API Routes
│   │       ├─ treinos/, sessoes/
│   │       ├─ corpo/, dieta/
│   │       ├─ medicamentos/, exames/
│   │       ├─ cardio/, analise-ia/
│   │       ├─ uploads/, ai/extract/
│   │       └─ admin/usuarios/, admin/logs/
│   ├─ components/
│   │   ├─ ui/                       # Componentes base reutilizáveis
│   │   │   ├─ Button, Input, Card, Badge, Modal
│   │   │   ├─ Select, Textarea, Spinner, EmptyState
│   │   │   ├─ StatCard, ProgressBar, ScoreRing
│   │   │   ├─ FileUpload, Tabs, Table, Toast
│   │   │   └─ ConfirmDialog
│   │   ├─ layout/                   # AppLayout, Sidebar, Header
│   │   └─ providers/                # AppProviders (client wrappers)
│   ├─ domain/                       # Regras de negócio puras
│   │   ├─ body-calculations.ts
│   │   ├─ workout-calculations.ts
│   │   ├─ nutrition-calculations.ts
│   │   └─ ai-scoring.ts
│   ├─ services/                     # Camada de serviço (Supabase)
│   │   ├─ auth, treinos, corpo, dieta
│   │   ├─ medicamentos, exames, admin
│   │   ├─ audit, import, ai
│   ├─ hooks/                        # React hooks reutilizáveis
│   ├─ stores/                       # Zustand global state
│   ├─ types/                        # Types TypeScript
│   │   ├─ database.types.ts         # Tipos gerados do Supabase
│   │   └─ domain.types.ts           # DTOs, enums, tipos de domínio
│   ├─ validators/                   # Schemas Zod
│   ├─ lib/
│   │   ├─ supabase/                 # client, server, middleware
│   │   ├─ utils.ts
│   │   ├─ constants.ts
│   │   └─ api-helpers.ts
│   └─ styles/globals.css
├─ supabase/
│   ├─ migrations/
│   │   ├─ 001_initial_schema.sql
│   │   ├─ 002_row_level_security.sql
│   │   └─ 003_functions_and_triggers.sql
│   └─ seed.sql
├─ .env.example
├─ package.json
├─ tailwind.config.ts
├─ next.config.ts
└─ tsconfig.json
```

---

## Segurança

### Row Level Security (RLS)
Todas as 18 tabelas têm RLS ativo. Os usuários só acessam seus próprios dados.

### Controle de Acesso por Papel

| Papel | Acesso |
|-------|--------|
| `super_admin` | Acesso total ao sistema, incluindo outros admins |
| `admin` | Gerencia usuários, vê logs de auditoria, acessa dados de todos |
| `coach` | Acessa dados de seus alunos vinculados |
| `operador` | Acesso limitado a operações específicas |
| `usuario_final` | Apenas seus próprios dados |

### Outras medidas
- Validação de payload no servidor (Zod) em todas as rotas
- Sanitização de uploads (tipo e tamanho)
- Logs de auditoria para ações críticas (login, criação, exclusão)
- Primeiro acesso com troca de senha obrigatória
- Nunca expõe `SUPABASE_SERVICE_ROLE_KEY` no cliente

---

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com) (gratuita)
- Git

---

## Instalação Local

```bash
# 1. Clonar o repositório
git clone https://github.com/rafaelmonteiro2803/scanixbody.git
cd scanixbody

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase
```

---

## Configuração do Supabase

### 1. Criar projeto

Acesse [app.supabase.com](https://app.supabase.com), crie um projeto e anote:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY` (apenas servidor)

### 2. Executar migrations

**Via Supabase CLI:**
```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Aplicar migrations
supabase db push
```

**Via Dashboard SQL Editor:**
Execute os arquivos na ordem:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_row_level_security.sql`
3. `supabase/migrations/003_functions_and_triggers.sql`
4. `supabase/seed.sql` (opcional — cria usuário admin de teste)

### 3. Configurar Storage

No dashboard Supabase → Storage, crie os buckets:
- `bioimpedance` (privado)
- `exams` (privado)
- `workouts` (privado)
- `diets` (privado)
- `medications` (privado)
- `avatars` (público)

### 4. Configurar Auth

Em Authentication → Settings:
- **Site URL:** `http://localhost:3000` (dev) ou sua URL de produção
- **Redirect URLs:** adicionar `http://localhost:3000/auth/callback`
- Email templates: personalize como desejar

---

## Rodando Localmente

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

**Usuário admin de teste** (após rodar o seed):
- Email: `admin@scanixbody.com`
- Senha: Ver `supabase/seed.sql` (troque após primeiro login)

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública anônima |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave de serviço (apenas servidor) |
| `NEXT_PUBLIC_APP_URL` | Sim | URL base da aplicação |
| `OPENAI_API_KEY` | Não | Habilita extração real com IA (sem esta chave, usa dados mock) |

---

## Deploy no Render

### 1. Preparar repositório

```bash
git add .
git commit -m "feat: initial production build"
git push origin main
```

### 2. Criar Web Service no Render

1. Acesse [render.com](https://render.com) → New → Web Service
2. Conecte seu repositório GitHub
3. Configure:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Node Version:** 18

### 3. Variáveis de ambiente

Em Environment Variables do Render, adicione todas as variáveis do `.env.example`.

### 4. Deploy automático

Após a configuração, todo push na `main` fará deploy automático.

---

## Regras de Negócio Implementadas

### Cálculos Corporais (`domain/body-calculations.ts`)
- **IMC** = peso(kg) / altura(m)²  com 6 faixas de classificação
- **TMB** = fórmula revisada de Harris-Benedict (Roza & Shizgal 1984) separada por sexo
- **TDEE** = TMB × multiplicador de atividade (1.2 a 1.9)
- **Peso ideal** = fórmula de Devine por sexo
- **Água diária** = peso × 35 ml
- **Relação cintura-quadril** com classificação por sexo

### Treinos (`domain/workout-calculations.ts`)
- **Volume** = soma de (peso × reps) por série
- **PR Detection** = comparação com melhor carga histórica (peso-first, reps como tiebreaker)
- **Progressão** = histórico ordenado por data para gráfico

### Nutrição (`domain/nutrition-calculations.ts`)
- **Metas de macros** por objetivo (perda, ganho, manutenção)
- **Validação nutricional** com tolerância ±15% e piso de 40g gordura

### Scores IA (`domain/ai-scoring.ts`)
- 6 scores (0-100) com deduções graduais (não binárias)
- Score geral ponderado: treino 30%, dieta 30%, sono 20%, hidratação 10%, cardio 10%
- Checklist por módulo com priorização

---

## Evolução para App Mobile

A arquitetura já foi construída para suportar app mobile nativo:

### 1. O que é reaproveitável
- Toda camada de domínio (`src/domain/`) — TypeScript puro, zero dependências web
- Todos os tipos (`src/types/`) — compartilháveis via pacote npm
- Toda a API (`/api/v1/`) — REST padrão, consumível por qualquer cliente
- Auth Supabase — funciona identicamente no mobile

### 2. Roadmap mobile
```
1. Criar projeto Expo/React Native
   npx create-expo-app scanixbody-mobile --template

2. Instalar Supabase
   npm install @supabase/supabase-js

3. Apontar para o mesmo projeto Supabase
   (mesmo SUPABASE_URL e ANON_KEY)

4. Criar pacote shared para os tipos
   packages/shared/src/types/
   packages/shared/src/domain/

5. Consumir mesma /api/v1 ou direto via Supabase client
```

### 3. Considerações
- **Storage:** Usar `supabase.storage` com signed URLs no mobile
- **Auth:** `supabase.auth.signInWithPassword()` funciona igual
- **Deep links:** Configurar redirects para o app mobile no Supabase Auth

---

## Desenvolvimento

### Scripts disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Iniciar build de produção
npm run lint         # ESLint
npm run type-check   # TypeScript check sem emitir
```

### Convenções de branch

- `feature/nome-da-feature`
- `fix/descricao-do-bug`
- `chore/tarefa-de-manutencao`

### Código

- Prettier + ESLint pré-configurados
- TypeScript strict mode
- Toda regra de negócio em `src/domain/` — nunca na view
- Toda comunicação com banco via `src/services/`
- Validação Zod em todos os formulários e rotas API

---

## Licença

MIT — veja [LICENSE](LICENSE)

---

*SCANIX BODY — Feito para quem leva performance a sério.*
