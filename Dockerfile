# Hosted Streamable HTTP transport (Render / Smithery). The stdio entry is
# published separately via npm; this image serves the remote endpoint.
FROM node:22-alpine

WORKDIR /app

# Install production deps against the committed lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY bin ./bin
COPY src ./src
COPY server.json README.md ./

ENV NODE_ENV=production
# Render/Smithery set PORT; default matches the local server.
ENV PORT=8787
EXPOSE 8787

CMD ["node", "src/http-server.js"]
