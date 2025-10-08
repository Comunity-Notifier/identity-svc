# US-001 — Identity (stateless JWT) con DDD

## A) Capa **Dominio**

- [x] **A1. Lenguaje ubicuo y límites**
  - [x] Definir **Bounded Context**: _Identity_.
  - [x] Glosario: _User, Account, Provider, ProviderUserId, Email, PasswordHash, Token (AccessToken)_.

- [x] **A2. Modelo de dominio (Aggregates + VOs)**
  - [x] **Aggregate `User`** (AR): `id`, `name`, `email`, `accounts: Account[]`, invariantes: `email` requerido/valido; `Account` no duplicada por `(provider, providerUserId)`.
  - [x] **Entity `Account`**: `provider`, `providerUserId`, `email?`.
  - [x] **Value Objects**: `Email`, `Provider` (`google|github|local`), `ProviderUserId`, `PasswordHash`, `Name`.
  - [x] **Errores de dominio** tipados: `EmailAlreadyTaken`, `AccountAlreadyLinked`, `InvalidCredentials`, etc.
  - [x] **Tests dominio**: invariantes del agregado, VO (normalización/validación), reglas de vinculación.

## B) Capa **Aplicación** (Casos de uso + Puertos)

- [x] **B1. Puertos (interfaces)**
  - [x] `UserRepository` (byId, byEmail, save, update).
  - [x] `AccountRepository` (byProviderId, linkToUser).
  - [x] `OAuthStateStore` (save/get/consume con TTL).
  - [x] `PasswordHasher` (hash/verify).
  - [x] `TokenService` (sign/verify, exposeJWKS).
  - [x] `OAuthProvider` (obtener perfil con `code`/PKCE).

- [x] **B2. Casos de uso**
  - [x] `RegisterUserLocal` (name,email,password) → crea `User` → **Token**.
  - [x] `LoginUserLocal` (email,password) → valida → **Token**.
  - [x] `StartOAuth` (provider, redirectUri) → `state + codeVerifier (+nonce)` → persiste en `OAuthStateStore`.
  - [x] `HandleOAuthCallback` (provider, code, state) → valida `state/PKCE` → **crear o vincular** `Account` → **Token**.
  - [x] `GetMe` (sub del token) → carga `User`.
  - [x] `Logout` → (stateless) solo instrucción de **clear cookie**.

- [x] **Tests aplicación**: mocks de puertos; paths feliz/error; unicidad por email y `(provider, providerUserId)`.

## C) **Infraestructura** (adaptadores/ORM/cripto)

- [x] **C1. Persistencia (PostgreSQL)**
  - [x] Migraciones:
    - `users(id uuid pk, email unique not null, name not null, password_hash text null, created_at timestamptz)`
    - `accounts(id uuid pk, user_id uuid fk, provider text not null, provider_user_id text not null, email text null, created_at timestamptz, UNIQUE(provider, provider_user_id))`
    - `oauth_states(state text pk, code_verifier text, nonce text null, provider text, redirect_uri text, created_at timestamptz default now(), expires_at timestamptz)`

  - [x] Implementar **Repos** (`UserRepositoryPrisma`, `AccountRepositoryPrisma`, `OAuthStateStorePrisma`) con mapeo dominio↔DB.
  - [x] **Tests integración**: constraints de unicidad y consumo de `oauth_states`.

- [x] **C2. Cripto/JWT**
  - [x] `TokenServiceJose` (Ed25519/RSA) con `iss/aud/exp/jti/kid`.
  - [x] Endpoint **JWKS** (`GET /.well-known/jwks.json`).
  - [x] **Tests**: firma/verificación, `iss/aud` inválidos, expiración.

- [x] **C3. Seguridad**
  - [x] `Argon2PasswordHasher`.
  - [x] Adaptadores **OAuthProvider**:
    - `GoogleProvider` (perfil: id, email, name, email_verified).
    - `GitHubProvider` (id, email primario, name).

  - [x] **Tests** de adaptadores (mocks/fakes de respuestas).

## D) **Interfaces/Entrega (HTTP Express)**

> Controladores delgados que invocan **casos de uso** (nada de lógica de negocio aquí).

- [x] **D1. Infra HTTP**
  - [x] `helmet`, `cors` (si Bearer), `cookie-parser`, `error-handler`, límites de tamaño/timeout.
  - [x] **Zod** para DTOs; mapeo de errores a 400/401/409.

- [x] **D2. Endpoints**
  - [x] `POST /identity/register` → `RegisterUserLocal` → **Set-Cookie access_token** (HttpOnly; Secure; SameSite=Lax) **o** `Authorization: Bearer`.
  - [x] `POST /identity/login` → `LoginUserLocal` → **Token**.
  - [x] `GET /identity/connect/:provider` → `StartOAuth` → 302 a proveedor.
  - [x] `GET /identity/callback/:provider` → `HandleOAuthCallback` → **Token**.
  - [x] `GET /identity/me` → `GetMe` (token en cookie/Bearer).
  - [x] `POST /identity/logout` → `Logout` (clear cookie).
  - [x] `GET /.well-known/jwks.json` → JWKS.

- [x] **D3. Tests de contrato (Supertest)** por endpoint:
  - [x] register (201/400/409 + cookie atributos).
  - [x] login (200/401 + cookie).
  - [x] connect (302 + `state` creado).
  - [x] callback (200/400/302 según caso; linking vs nuevo).
  - [x] me (200/401), logout (204 con cookie limpia).

## E) **Seguridad/Operación**

- [ ] **E1. CSRF** (si entregas token por **cookie**): _double-submit_ para formularios locales (excluir callbacks OAuth).
- [ ] **E2. CORS** (si **Bearer**) con allowlist de frontends.
- [ ] **E3. Cabeceras**: HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- [ ] **E4. Rate-limit** (Cloud Armor) en `/identity/connect/*` y `/identity/callback/*`.
- [ ] **E5. CI/CD (GCF 2ª gen)**: workflow `lint→test→build→migrate→deploy`, envs (`DATABASE_URL`, `JWT_PRIVATE_KEY`/KMS, `JWT_ISSUER`, `JWT_AUDIENCE`, `COOKIE_DOMAIN`, `GOOGLE_*`, `GITHUB_*`), **smoke** `/health`.

---

## Vista por **capacidad** (cada una con DDD adentro)

### T-REG — Registro local

- **Dominio**: VO `Email/Name/PasswordHash`; método `User.createLocal`.
- **Aplicación**: `RegisterUserLocal`.
- **Infra**: `UserRepositoryPg`, `Argon2PasswordHasher`, `TokenServiceJose`.
- **HTTP**: `POST /identity/register` (+ Zod).
- **Tests**: dominio (invariantes), aplicación (mocks), contrato (201/400/409 + cookie).

### T-LOG — Login local

- **Dominio**: error `InvalidCredentials`.
- **Aplicación**: `LoginUserLocal`.
- **Infra**: hasher + token.
- **HTTP**: `POST /identity/login`.
- **Tests**: unit + contrato (200/401).

### T-OAUTH-CONNECT

- **Dominio**: VO `Provider`.
- **Aplicación**: `StartOAuth`.
- **Infra**: `OAuthStateStorePg`.
- **HTTP**: `GET /identity/connect/:provider`.
- **Tests**: unit + contrato (302, `state` guardado).

### T-OAUTH-CALLBACK

- **Dominio**: `User.linkAccount(provider, providerUserId)` (regla: sin duplicados).
- **Aplicación**: `HandleOAuthCallback`.
- **Infra**: `OAuthProvider` (Google/GitHub), repos.
- **HTTP**: `GET /identity/callback/:provider`.
- **Tests**: unit (nuevo/existente/ya logueado, errores state) + contrato (200/400/302).

### T-ME / T-LOGOUT

- **Aplicación**: `GetMe`, `Logout`.
- **HTTP**: `GET /identity/me`, `POST /identity/logout`.
- **Tests**: contrato (200/401 y 204 + clear cookie).

---

### Estructura sugerida (resumen)

```
apps/identity-fn/src/
  domain/identity/ { user.ts, account.ts, value-objects/*, errors.ts }
  application/ { use-cases/*, ports/*, dto/* }
  infrastructure/
    persistence/prisma/ { user.repository.prisma.ts, account.repository.prisma.ts, oauth-state.store.prisma.ts }
    crypto/ { tokenServiceJose.ts, passwordHasherArgon2.ts, jwks.router.ts }
    oauth/ { google.provider.ts, github.provider.ts }
  interfaces/http/ { routes.ts, controllers/*, validators/*, middleware/* }
tests/
  domain/**  application/**  contracts/**
```
