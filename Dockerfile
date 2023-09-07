FROM node:18-alpine AS base
RUN ["apk", "add", "--no-cache", "libc6-compat"]
#
RUN ["npm", "i", "-g", "pnpm"]
#
RUN ["addgroup", "--system", "--gid", "1001", "nodejs"]
RUN ["adduser" , "--system", "--uid", "1001", "nextjs"]

FROM base AS dependencies
WORKDIR /app
#
COPY package.json pnpm-lock.yaml ./
# COPY prisma/*.prisma ./
RUN ["pnpm", "install"]

FROM base AS build
WORKDIR /app
#
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
#
ENV SKIP_ENV_VALIDATION 1
RUN ["pnpm", "build"]

FROM base AS runner
WORKDIR /app
#
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/dist /dist
#
USER nextjs
#
ENV NODE_ENV production
ENV PORT     3000
#
EXPOSE 3000
#
ENTRYPOINT ["pnpm", "start"]
