FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NEXT_PUBLIC_SUPABASE_URL=https://lhypodcttwhonuvumwod.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoeXBvZGN0dHdob251dnVtd29kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTg0MDMsImV4cCI6MjA4OTUzNDQwM30.vWLmen49lOCc3ltFa95ARiTk1WkmwlKCZU-LtFCVVxs
ENV NEXT_PUBLIC_API_URL=https://reefos-api.onrender.com

RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=10000
ENV HOSTNAME=0.0.0.0
EXPOSE 10000

CMD ["node", "server.js"]
