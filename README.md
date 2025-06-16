# README - semestral-ds9

## Índice

- [📁 Estructura del proyecto](#-estructura-del-proyecto)
- [🏁 Inicio del proyecto](#-inicio-del-proyecto)
- [🚀 Comandos principales](#-comandos-principales)
- [📦 Instalación de librerías específicas por app](#-instalación-de-librerías-específicas-por-app)
- [✨ Desarrollo de funcionalidades](#-desarrollo-de-funcionalidades)
- [💡 Tips importantes](#-tips-importantes)
- [⚙️ Configuración de desarrollo para `api`](#️-configuración-de-desarrollo-para-api)
- [📚 Recursos adicionales](#-recursos-adicionales)

---

## 📁 Estructura del proyecto

```
semestral-ds9/
├── apps/
│   ├── api/            # Backend (Fastify + Node.js)
│   └── web/            # Frontend (React, Next.js, u otro)
├── packages/           # Librerías compartidas (si las hay)
├── node_modules/
├── pnpm-workspace.yaml
├── package.json        # Scripts generales y workspace config
├── turbo.json          # Config para turborepo (si usas)
└── README.md
```

---

## 🏁 Inicio del proyecto

Para comenzar a trabajar en el proyecto:

1. Clona el repositorio:

```bash
git clone https://github.com/username/semestral-ds9.git
cd semestral-ds9
```

2. Instala las dependencias:

```bash
pnpm install
```

3. Configura las variables de entorno:

- Crea un archivo `.env` en `apps/api/` para el backend
- Crea un archivo `.env.local` en `apps/web/` para el frontend

4. Inicia el entorno de desarrollo:

```bash
pnpm dev
```

---

## 🚀 Comandos principales

> Estos comandos se ejecutan desde la raíz del proyecto (`semestral-ds9/`).

| Comando          | Descripción                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm install`   | Instala todas las dependencias de todas las apps y paquetes del monorepo. |
| `pnpm dev`       | Inicia ambas aplicaciones en el entorno de desarollo                      |
| `pnpm build`     | Prepara el builds de ambas aplicaciones para su despliegue                |
| `pnpm start:api` | Ejecuta el backend (`apps/api`). Ejecuta el código compilado en `dist`.   |
| `pnpm dev:api`   | Ejecuta el backend en modo desarrollo con `tsx` (hot reload, TS directo). |
| `pnpm build:api` | Compila el backend TypeScript a JavaScript en `dist/`.                    |
| `pnpm start:web` | Ejecuta el frontend (dependiendo de la configuración, Next.js u otro).    |
| `pnpm dev:web`   | Ejecuta el frontend en modo desarrollo.                                   |
| `pnpm build:web` | Compila el frontend para producción.                                      |

---

## 📦 Instalación de librerías específicas por app

En un monorepo con pnpm, cada app puede tener dependencias específicas.

### Para instalar una dependencia **solo en `api`**:

```bash
pnpm add nombre-paquete --filter ./apps/api
```

Ejemplo:

```bash
pnpm add fastify --filter ./apps/api
```

### Para instalar una dependencia **solo en `web`**:

```bash
pnpm add nombre-paquete --filter ./apps/web
```

Ejemplo:

```bash
pnpm add react --filter ./apps/web
```

### Para instalar una dependencia en **todas las apps y paquetes**:

```bash
pnpm add nombre-paquete -w
```

o

```bash
pnpm add nombre-paquete --workspace-root
```

---

## ✨ Desarrollo de funcionalidades

Seguimos el modelo de Conventional Commits y desarrollo basado en ramas.

### Flujo para crear una nueva funcionalidad:

1. **Crea una nueva rama desde main**:

```bash
git checkout main
git pull
git checkout -b feat/nombre-funcionalidad
```

2. **Desarrolla la funcionalidad**:

- Implementa los cambios necesarios en el código
- Asegúrate de seguir los estándares del proyecto
- Prueba tus cambios localmente

3. **Haz commits siguiendo Conventional Commits**:

```bash
git add .
git commit -m "feat: añade sistema de autenticación"
```

Tipos de commit comunes:

- `feat`: Nueva funcionalidad
- `fix`: Corrección de errores
- `docs`: Cambios en documentación
- `style`: Cambios que no afectan al código (espacios, formato)
- `refactor`: Refactorización del código
- `test`: Añade o corrige tests
- `chore`: Cambios en el proceso de build o herramientas auxiliares

4. **Sube tu rama y crea un Pull Request**:

```bash
git push -u origin feat/nombre-funcionalidad
```

5. **Solicita revisión** de tu PR y responde a los comentarios

6. **Una vez aprobado**, realiza el merge a la rama principal

### Para arreglar un bug:

```bash
git checkout -b fix/nombre-bug
# Realiza los cambios
git commit -m "fix: corrige problema con login en Safari"
git push -u origin fix/nombre-bug
```

### Para actualizar documentación:

```bash
git checkout -b docs/actualiza-readme
# Realiza los cambios
git commit -m "docs: actualiza instrucciones de instalación"
git push -u origin docs/actualiza-readme
```

---

## 💡 Tips importantes

- Ejecuta `pnpm install` en la raíz para mantener todo sincronizado.
- Usa el flag `--filter` para manejar dependencias aisladas por app.
- Cada app tiene su propio `package.json` donde verás las dependencias instaladas específicamente para ella.
- Las dependencias comunes (compartidas) deberían ir en la raíz para evitar duplicados.

---

## ⚙️ Configuración de desarrollo para `api`

- El comando `dev:api` usa `tsx` para permitir ejecutar TypeScript directamente con soporte a `import/export`.
- En producción, el backend se ejecuta desde el código compilado (`dist/`), por eso es importante usar:

```bash
pnpm build:api
pnpm start:api
```

- Recuerda no usar `"type": "module"` en `apps/api/package.json` si tu compilación es CommonJS (por defecto).

---

## 📚 Recursos adicionales

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Fastify Official](https://www.fastify.io/)
- [tsx](https://github.com/esbuild-kit/tsx)
- [Conventional Commits](https://www.conventionalcommits.org/)
