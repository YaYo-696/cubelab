# Publicación en GitHub Pages

GitHub Pages sirve el build estático por HTTPS en un repositorio público de GitHub Free. Puede publicar desde el mismo workflow que corre las pruebas y usa los permisos de GitHub Actions. Las rutas de preview y release tienen alcances de service worker y espacios de datos separados. [Documentación oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Publicar el preview

1. En GitHub, crea el repositorio público `cubelab` en tu cuenta mediante **New repository**. Créalo vacío, sin README, licencia ni .gitignore generados por GitHub.
2. Desde la carpeta local, ejecuta lo siguiente después del commit de la fase:

   ```powershell
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/cubelab.git
   git push -u origin main
   ```

   Sustituye `TU_USUARIO` por tu cuenta. Si `git remote -v` ya muestra `origin`, usa `git remote set-url origin https://github.com/TU_USUARIO/cubelab.git` en lugar de `remote add`.
3. En el repositorio de GitHub, entra a **Settings → Pages → Build and deployment → Source** y elige **GitHub Actions**.
4. En **Settings → Secrets and variables → Actions → Variables**, crea `CUBELAB_PAGES_ENABLED` con el valor `true`. Deja `CUBELAB_RELEASE_REF` sin definir.
5. Abre **Actions → CubeLab CI and Pages → Run workflow**, selecciona `main` y ejecútalo. El historial de Actions muestra los resultados. Al finalizar, abre `https://TU_USUARIO.github.io/cubelab/preview/` y comprueba la etiqueta DEV.
6. A partir de entonces, cada push a `main` publica el preview si pasan las pruebas. El workflow también ejecuta las pruebas en los pushes a otras referencias.

## Activar release el día de lanzamiento

Mantén los interruptores encendidos en `main` para conservar el preview. En PC, parte de un `main` actualizado y crea una rama para preparar la versión:

```powershell
git switch main
git pull --ff-only
git switch -c release/1.0.0
```

1. Apaga todos los `DEV-FLAG` en `src/config/devFlags.ts`. Ejecuta `npm.cmd run release:check` y `tools\diagnostico.ps1 -ConE2E`.
2. Cuando pasen, etiqueta el commit que contiene esa configuración:

   ```powershell
   git add src/config/devFlags.ts
   git commit -m "chore(release): desactiva los DEV-FLAG"
   git tag -a v1.0.0 -m "CubeLab 1.0.0"
   git push origin v1.0.0
   git switch main
   ```

3. En **Settings → Secrets and variables → Actions → Variables**, crea `CUBELAB_RELEASE_REF` con el valor `v1.0.0`. Ejecuta el workflow otra vez en `main`.
4. El workflow reconstruye el tag, exige que `release:check` y las pruebas pasen, y solo entonces publica `https://TU_USUARIO.github.io/cubelab/release/`. Si la verificación de esa referencia falla, Pages conserva el último artefacto publicado.
5. Comprueba la instalación y el modo avión desde la URL de release. Un respaldo JSON permite mover voluntariamente datos del preview al release.
