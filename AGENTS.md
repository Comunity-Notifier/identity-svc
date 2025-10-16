# AGENTS.md

Este repositorio está preparado para que agentes automáticos colaboren en su mantenimiento. Ten en cuenta las siguientes pautas antes de realizar cambios:

## Contexto funcional

- El servicio sigue un enfoque DDD. El agregado `User` vive en `src/domain/aggregates/User.ts` y almacena la contraseña principal (`passwordHash`) y las cuentas externas enlazadas en `src/domain/entities/Account.ts`.
- La implementación actual del repositorio usa Prisma y se encuentra en `src/infrastructure/persistence/prisma/PrismaUserRepository.ts`.
- Las pruebas de integración relevantes están en `__tests__/integration/prismaUserRepository.spec.ts`.

## Migraciones

- El archivo `prisma/schema.prisma` ya refleja los cambios recientes (campos `image`, `updatedAt`, enum `AuthProvider` sin la opción `credential`).
- Genera tus propias migraciones ejecutando, desde la raíz del proyecto:

  ```bash
  npm prisma migrate dev -- <nombre_de_migracion>
  ```

## Estructura de carpetas y creación de archivos

- **Dominio (`src/domain/`)**
  - `aggregates/`: agrega nuevos agregados aquí (usa `PascalCase.ts`). Ej.: `src/domain/aggregates/NewAggregate.ts`.
  - `entities/`: entidades de dominio (nombres en `PascalCase.ts`).
  - `value-objects/`: value objects (subcarpetas por tipo si aplica).
  - `repositories/`: interfaces (`PascalCaseRepository.ts`).
- **Infraestructura (`src/infrastructure/`)**
  - `persistence/prisma/`: implementaciones que usan Prisma (nombres `PrismaXRepository.ts`). Crea carpetas adicionales por tecnología si agregas otro adaptador (`mongo`, `redis`, etc.).
  - Si necesitas mappers reutilizables, colócalos en `src/infrastructure/persistence/mappers/` con nombres descriptivos (`xMapper.ts`).
- **Tests (`__tests__/`)**
  - Sigue la misma estructura de carpetas que `src/` (p. ej. `__tests__/domain/entities/`, `__tests__/integration/`).
  - Nombra los archivos `PascalCase.spec.ts`.
- **Raíz del proyecto**
  - Documentación como `AGENTS.md`, `README.md`. Crea otros archivos de guía o configuración aquí según sea necesario.

Para crear archivos desde la raíz usando el shell, recuerda usar rutas relativas claras, por ejemplo:

```bash
cat <<'EOF' > src/domain/value-objects/NewValueObject.ts
// contenido
EOF
```

## Buenas prácticas para agentes

- Si necesitas añadir nuevos proveedores externos, actualiza el enum `AuthProvider` y asegúrate de crear la migración correspondiente.
- Asegúrate de ejecutar `npm run build` y `npm run lint` tras tus modificaciones.
- Usa los tests existentes como guía y añade nuevos casos cuando trabajes en reglas de dominio sensibles.
