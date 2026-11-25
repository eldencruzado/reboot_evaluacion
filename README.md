# REBOOT — Computer Health Assistant

REBOOT es una aplicación web bilingüe (español/inglés) que ayuda a comprender problemas informáticos frecuentes mediante un diagnóstico guiado, un motor local basado en reglas, recomendaciones educativas e integración opcional con IA generativa.

> **Alcance:** REBOOT es un proyecto educativo. No realiza pruebas físicas certificadas ni accede libremente a sensores internos del equipo. Los resultados son orientativos y no sustituyen a un técnico calificado.

## Funcionalidades

- Dashboard con resumen del historial de diagnósticos.
- Diagnóstico guiado para lentitud, red, inicio, almacenamiento, calentamiento y otros síntomas.
- Motor local de reglas que entrega posibles causas y pasos seguros.
- Integración opcional con IA mediante un servidor Node.js; la clave API nunca se coloca en el frontend.
- Centro de soluciones con búsqueda.
- Historial local con opción de marcar diagnósticos como resueltos y eliminarlos.
- Interfaz bilingüe: español e inglés.
- Monitor educativo de CPU, RAM, almacenamiento y GPU. Explica métricas, sin fingir lecturas en vivo.

## Tecnologías

- HTML5, CSS3 y JavaScript.
- Node.js y Express para el endpoint opcional de IA.
- LocalStorage para el historial y preferencia de idioma.
- API de OpenAI Responses (opcional).

## Requisitos

- Node.js 18 o superior (recomendado).
- npm.
- Navegador moderno.
- Para IA: una clave de API válida configurada en el servidor. La aplicación funciona sin ella usando el motor local.

## Ejecutar en local

1. Clona el repositorio:
   ```bash
   git clone URL_DEL_REPOSITORIO
   cd REBOOT
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```
3. (Opcional) Crea el archivo de variables de entorno:
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux/Git Bash: `cp .env.example .env`
4. Si tienes una clave API, agrégala a `.env`:
   ```env
   OPENAI_API_KEY=tu_clave_api
   OPENAI_MODEL=gpt-4.1-mini
   PORT=3000
   ```
   No compartas este archivo ni lo subas a GitHub. `.env` está ignorado por Git.
5. Inicia la aplicación:
   ```bash
   npm start
   ```
6. Abre `http://localhost:3000`.

### Modo sin servidor / sin IA

Para probar solo la interfaz y el motor local, puedes abrir `index.html` directamente en el navegador. En ese modo, el endpoint de IA no estará disponible. Para probar todas las funciones integradas, utiliza `npm start`.

## Estructura

```text
REBOOT/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── diagnostics.js
│   └── translations.js
├── server/
│   └── server.js
├── docs/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Uso del sistema

1. Entra al Dashboard.
2. Selecciona un problema de inicio rápido o abre Smart Diagnosis.
3. Responde las tres preguntas.
4. Revisa posibles causas y pasos recomendados.
5. Guarda el resultado para agregarlo al historial.
6. Si el servidor tiene IA configurada, solicita una explicación adicional.
7. Consulta Solution Center para explorar guías.

## Seguridad y privacidad

- El motor local no ejecuta comandos en el computador.
- El historial se guarda en LocalStorage del navegador utilizado.
- La clave de IA se guarda únicamente en el archivo `.env` del servidor.
- No ingreses información personal, contraseñas ni datos sensibles en los diagnósticos.
- La IA recibe respuestas de diagnóstico y contexto técnico; no recibe acceso al dispositivo.

## Flujo Git requerido por la evaluación

- `main`: versión estable de producción.
- `develop`: rama de integración y desarrollo. Todo cambio posterior al esqueleto inicial se trabaja aquí.
- La rama `develop` debe tener al menos tres commits descriptivos y estar publicada en GitHub.
- Al finalizar, probar `develop`, fusionarla en `main` y comprobar que `main` funciona después de clonar.

Ejemplos de mensajes descriptivos:

```text
feat: crear dashboard bilingüe y navegación principal
feat: implementar motor de diagnóstico basado en reglas
feat: agregar historial local y centro de soluciones
feat: integrar endpoint opcional de asistencia con IA
docs: documentar instalación, uso y flujo Git
```

Consulta `docs/GIT_WORKFLOW.md` para los comandos sugeridos para el equipo.

## Equipo

Proyecto académico grupal de Infraestructura TI. Completar aquí los nombres de los cuatro integrantes, curso y fecha de entrega.
