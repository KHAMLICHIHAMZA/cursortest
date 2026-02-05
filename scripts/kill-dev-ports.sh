#!/usr/bin/env sh
# Libère les ports utilisés par le stack (backend, frontends, proxy)
for port in 3000 3001 3080 5173 8080; do
  pid=$(lsof -ti :$port 2>/dev/null)
  [ -n "$pid" ] && kill -9 $pid 2>/dev/null && echo "Port $port libéré (PID $pid)"
done
echo "Prêt. Lancez: npm run dev"
