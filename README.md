# SPACE MISSION MVP

Videojuego web 3D modular con frontend **TypeScript + Vite + Babylon.js + Rapier** y backend **Flask + SQLAlchemy + Flask-Migrate**.

## Estructura

- `/frontend`: cliente web del juego
- `/backend`: API Flask y persistencia (SQLite por ahora)

## Configuración

1. Copia `.env.example` a `.env` y ajusta valores.
2. Backend:
   - `cd backend`
   - `python -m venv .venv && source .venv/bin/activate`
   - `pip install -r requirements.txt`
   - `python run.py`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

## MVP incluido

- Pantalla inicial con `GAME_TITLE`, `GAME_SUBTITLE`, `GAME_VERSION`
- Login (Google/Apple/GitHub) vía endpoints backend
- Creación de username único con validación backend
- Menú principal
- Carrusel de misiones con bloqueo (M2/M3 bloqueadas hasta progresión)
- Mission 1 jugable con entorno 3D, astronauta y cohete procedurales
- Cuenta regresiva, lanzamiento, recursos, resultado y guardado de progreso

## Base de datos

Por el momento se usa SQLite (`DATABASE_URL=sqlite:///space_mission.db`).
La arquitectura está preparada para migrar a PostgreSQL cambiando `DATABASE_URL`.
