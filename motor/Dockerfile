# O motor de transmissão (motor/motor.ts) empacotado com o ffmpeg.
# Contexto de build: a raiz do repositório (o motor importa src/server/).
#   docker build -f motor/Dockerfile -t pwstreamer-motor .

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts: o pacote supabase baixaria o CLI; o esbuild traz o binário
# como dependência opcional e não precisa do script
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src/server ./src/server
COPY motor ./motor
RUN npx esbuild motor/motor.ts --bundle --platform=node --target=node22 --format=cjs --outfile=/out/motor.cjs

FROM node:22-alpine
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/motor.cjs ./motor.cjs
USER node
EXPOSE 8080
CMD ["node", "motor.cjs"]
