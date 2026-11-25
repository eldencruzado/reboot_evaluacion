# Flujo Git para la evaluación

## Regla principal

- `main` representa producción y debe mantenerse funcional.
- `develop` es la única rama donde se desarrolla y se integran cambios.
- Publicar ambas ramas en GitHub.
- `develop` debe contener al menos tres commits descriptivos.

## 1. Crear repositorio local y primer main funcional

Desde la carpeta `REBOOT`:

```bash
git init
git branch -M main
git add .
git commit -m "chore: crear esqueleto inicial funcional de REBOOT"
```

Crear un repositorio vacío en GitHub (sin README, .gitignore ni licencia, porque ya existen localmente) y asociarlo:

```bash
git remote add origin https://github.com/USUARIO/REBOOT.git
git push -u origin main
```

## 2. Crear develop

```bash
git switch -c develop
git push -u origin develop
```

Desde este momento, los cuatro integrantes trabajan en `develop`, no en `main`.

## 3. Tres commits mínimos en develop

Dividan el trabajo en entregas pequeñas. Ejemplo de secuencia:

```bash
# Después de integrar dashboard y navegación
git add .
git commit -m "feat: implementar dashboard y navegación bilingüe"
git push origin develop

# Después de integrar diagnóstico
git add .
git commit -m "feat: desarrollar motor de diagnóstico por reglas"
git push origin develop

# Después de integrar historial y soluciones
git add .
git commit -m "feat: agregar centro de soluciones e historial local"
git push origin develop
```

Estos son ejemplos de mensajes; cada commit debe corresponder a cambios reales. Comprueben el historial:

```bash
git switch develop
git log --oneline
```

## 4. Trabajo de cuatro integrantes

Como el requisito pide que el desarrollo se haga en `develop`, acuerden horarios y archivos para evitar sobrescribir cambios. Antes de comenzar:

```bash
git switch develop
git pull origin develop
```

Después de modificar:

```bash
git add .
git commit -m "feat: explicar claramente la funcionalidad agregada"
git push origin develop
```

Si varias personas trabajan simultáneamente, una persona puede coordinar las integraciones. No hagan `push --force`.

## 5. Publicar producción

Cuando `develop` esté probado:

```bash
git switch develop
git pull origin develop
# Ejecutar pruebas y revisar la aplicación

git switch main
git pull origin main
git merge --no-ff develop -m "merge: publicar versión estable de REBOOT"
git push origin main
```

La rama `develop` también debe seguir publicada:

```bash
git push origin develop
```

## 6. Comprobación final de clonación

Clonen en otra carpeta para comprobar que el repositorio remoto funciona:

```bash
git clone https://github.com/USUARIO/REBOOT.git REBOOT-prueba
cd REBOOT-prueba
git branch -a
npm install
npm start
```

Por defecto, el clon debe quedar en `main`. Abran `http://localhost:3000` y comprueben que funciona sin necesitar el archivo `.env`. La IA es opcional; el motor local debe funcionar.

## Evidencias para presentar

- Captura de GitHub mostrando `main` y `develop`.
- Captura del historial de `develop` con al menos tres commits descriptivos.
- Captura del README visible en GitHub.
- Captura de la aplicación ejecutándose desde un clon limpio de `main`.
- Si realizan un merge o resuelven un conflicto, documenten el proceso real; no fabriquen evidencias.
