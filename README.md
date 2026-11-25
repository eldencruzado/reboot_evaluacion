
# REBOOT — El médico de tu computador

REBOOT es una aplicación web bilingüe (español/inglés) que ayuda a los usuarios a comprender y solucionar problemas frecuentes de sus computadores de escritorio mediante un diagnóstico guiado, recomendaciones educativas y un motor local basado en reglas.

**Alcance:** REBOOT es un proyecto educativo. No realiza pruebas físicas certificadas ni accede libremente a los sensores internos del equipo. Sus resultados son orientativos y no sustituyen la revisión de un técnico calificado.

## Funcionalidades

- Panel principal con resumen del historial de diagnósticos.
- Apartado Mi PC para registrar la marca y el modelo del computador.
- Diagnóstico guiado para lentitud, problemas de red, inicio, almacenamiento, temperatura y otros síntomas.
- Motor local de reglas que identifica posibles causas y recomienda pasos seguros.
- Centro de soluciones con buscador de problemas y recomendaciones.
- Historial local de diagnósticos.
- Interfaz bilingüe: español e inglés.
- Sección educativa de componentes: CPU, RAM, almacenamiento y GPU.
- Diseño adaptable a distintos tamaños de pantalla.

## Tecnologías

- HTML5.
- CSS3.
- JavaScript.
- Node.js.
- Express.
- LocalStorage para guardar el historial y los datos del equipo.

## Requisitos

- Node.js 18 o superior.
- npm.
- Navegador web moderno.

## Instalación y ejecución

1. Clona el repositorio:

   ```bash
   git clone URL_DEL_REPOSITORIO
   ```

2. Entra en la carpeta del proyecto:

   ```bash
   cd REBOOT
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

4. Inicia el servidor:

   ```bash
   npm start
   ```

5. Abre en el navegador:

   http://localhost:3000

## Uso del sistema

1. Ingresa al panel principal.
2. Accede a Mi PC y registra la marca y el modelo de tu computador.
3. Entra al Diagnóstico guiado.
4. Selecciona el problema que presenta tu equipo.
5. Responde las preguntas para obtener posibles causas.
6. Revisa las recomendaciones y soluciones.
7. Consulta el historial para revisar diagnósticos anteriores.
8. Utiliza el Centro de soluciones para buscar información adicional.

## Seguridad y privacidad

- El diagnóstico utiliza reglas locales y no ejecuta comandos en el computador.
- El historial y los datos del equipo se guardan en LocalStorage del navegador.
- La aplicación no necesita una clave API ni servicios externos de inteligencia artificial.
- No ingreses contraseñas ni información personal en los diagnósticos.
- Ante problemas eléctricos, daños físicos o temperaturas anormales, solicita ayuda a un técnico calificado.

## Estructura del proyecto

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
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## Flujo Git de la evaluación

- `main`: rama con la versión estable del proyecto.
- `develop`: rama destinada al desarrollo y las modificaciones.
- Los cambios se realizan y prueban en `develop`.
- La rama `develop` debe tener al menos tres commits descriptivos y estar publicada en GitHub.
- Al finalizar, se integra `develop` en `main` y se comprueba su funcionamiento.

## Equipo

Proyecto académico grupal de Infraestructura TI.

Integrantes:

- Elder Cruzado
- Vicente Quiroz
- Pascal Diaz
- Cesar Ramirez

**Curso:** 3ro TP  
**Fecha de entrega:** 25-11-2026
