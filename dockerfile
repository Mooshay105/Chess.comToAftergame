FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY src ./src
COPY tsconfig.json ./
COPY config.json ./
CMD ["bun", "run", "src/index.ts"]