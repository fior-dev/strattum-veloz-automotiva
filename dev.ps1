# Sobe backend (FastAPI, porta 8000) e frontend (Vite, porta 5173), cada um na sua janela.
# Uso: powershell -ExecutionPolicy Bypass -File .\dev.ps1
$raiz = $PSScriptRoot
Start-Process powershell -WorkingDirectory "$raiz\backend" -ArgumentList '-NoExit', '-Command', 'uv sync; uv run uvicorn presentation.api:app --reload --port 8000'
Start-Process powershell -WorkingDirectory "$raiz\frontend" -ArgumentList '-NoExit', '-Command', 'npm install; npm run dev'
Write-Host "Backend: http://127.0.0.1:8000/docs | Frontend: http://localhost:5173"
