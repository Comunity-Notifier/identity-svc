# Identity Service

## Bounded Context

`Identity` es el bounded context responsable de autenticar usuarios y emitir tokens de acceso. En este contexto gestionamos credenciales locales, identidades federadas (OAuth) y los invariantes asociados a los usuarios y sus cuentas vinculadas.

### Lenguaje ubicuo

- **User**: Agregado raíz que representa a la persona autenticada en el sistema.
- **Account**: Entidad que modela la vinculación con un proveedor de identidad externo.
- **Provider**: Valor enumerado que identifica al origen de autenticación (`google`, `github`, `local`).
- **ProviderUserId**: Identificador proporcionado por el proveedor externo.
- **Email**: Valor normalizado y validado que identifica de forma única a un usuario dentro del bounded context.
- **PasswordHash**: Hash Argon2 de la contraseña para credenciales locales.
- **Token / AccessToken**: Token JWT emitido tras autenticar al usuario (stateless).

La documentación detallada de dominio, aplicación e infraestructura se mantiene sincronizada con `tasks.md`.

## Infraestructura implementada

- **Prisma + PostgreSQL** con migración inicial (`000_init`) que cubre `User`, `Account` y `OAuthState`.
- **Repositorios Prisma** para usuarios, cuentas vinculadas y estados OAuth con pruebas de integración (Testcontainers cuando hay runtime disponible).
- **Crypto**: `Argon2PasswordHasher` y `TokenServiceJose` (EdDSA) con JWKS expuesto mediante `getPublicJwks` y pruebas unitarias que validan firma, expiración e issuer/audience.
- **HTTP**: Express con `helmet`, `cors`, `cookie-parser`, validación con Zod, manejo de errores de dominio y endpoints `/identity/*` + JWKS; pruebas de contrato con Supertest (se saltan si el entorno no permite abrir sockets).
- **OAuth**: Adaptadores para Google y GitHub con PKCE, intercambio de tokens y obtención de perfil/email primario, cubiertos por pruebas unitarias con `fetch` mockeado.
