# Petspond API — monorepo build for Railway
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile --filter @petspond/api...
COPY packages/types packages/types
COPY apps/api apps/api
RUN pnpm --filter @petspond/types build
# Generate Prisma client before Nest build
RUN pnpm --filter @petspond/api exec prisma generate
RUN pnpm --filter @petspond/api build
# Bundle production deps + workspace packages into a portable directory
RUN pnpm deploy --filter @petspond/api --prod /deploy
# Prisma schema + migrations needed at runtime for migrate deploy
COPY apps/api/prisma /deploy/prisma
# Regenerate the Prisma client inside /deploy so the generated .prisma/client
# output ships with the production node_modules used at runtime
RUN cd /deploy && pnpm exec prisma generate

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /deploy ./
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/main.js"]
