# Petspond API — monorepo build for Railway
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
RUN pnpm install --frozen-lockfile --filter @petspond/api...
COPY packages/types packages/types
COPY apps/api apps/api
RUN pnpm --filter @petspond/types build
RUN pnpm --filter @petspond/api build

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/types/package.json ./packages/types/
COPY --from=build /app/packages/types/dist ./packages/types/dist
COPY --from=build /app/node_modules ./node_modules
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
