# Organización del equipo (4 integrantes)

La rama compartida de desarrollo es `develop`, tal como exige la pauta. No crear ramas de trabajo adicionales si el profesor exige que todo cambio se realice directamente en `develop`.

| Integrante | Área principal | Archivos sugeridos |
|---|---|---|
| 1 | Dashboard, navegación e idioma | `index.html`, `css/styles.css`, `js/translations.js` |
| 2 | Motor de diagnóstico | `js/diagnostics.js`, sección wizard de `index.html` |
| 3 | Centro de soluciones e historial | `js/app.js`, contenido de soluciones |
| 4 | Backend IA, pruebas e integración | `server/server.js`, `package.json`, `README.md` |

## Acuerdos

1. Una persona coordina los cambios en `develop` para reducir conflictos.
2. Antes de editar, cada integrante comunica qué archivos tocará.
3. Antes de hacer commit, ejecutar la aplicación y probar el cambio.
4. Hacer commits pequeños, reales y descriptivos.
5. No subir `.env`, claves API, contraseñas ni datos personales.
6. Revisar en conjunto cada integración.
7. Todos deben poder explicar el flujo de Git y su contribución.
