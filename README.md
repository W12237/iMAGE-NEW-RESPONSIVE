# Image Developments Website

This project can run on a Windows computer with one double-click. You do not need to know how to code.

## First-time setup

1. Install **Node.js (LTS)** from [nodejs.org](https://nodejs.org/).
2. Keep this whole project folder together. Do not move or delete individual files inside it.
3. Double-click **`RUN_PROJECT.bat`** in this folder.
4. The first start can take a few minutes while the project installs what it needs and prepares its local database.
5. Your web browser should open automatically at [http://localhost:3000](http://localhost:3000).

If Windows displays a security warning, choose **More info**, then **Run anyway** only if you received this project folder from a trusted source.

## Every time after that

Double-click **`RUN_PROJECT.bat`** and leave the black command window open while using the website.

To stop the website, return to that window and press **Ctrl + C**, then type **Y** if Windows asks for confirmation. Closing the window also stops the local website.

## Website addresses

- Website: [http://localhost:3000](http://localhost:3000)
- Admin area: [http://localhost:3000/admin](http://localhost:3000/admin)

The local admin email and password are stored in the `.env` file. Ask the project owner for them. Do not share that file or use its local password on a public website.

## Important files and folders

- `.env` contains the local database setting and admin login. It is already included in the delivered project folder. If it is missing, `RUN_PROJECT.bat` creates it from `.env.example`.
- `prisma/dev.db` is the local website database. Back up this file to keep content changes.
- `public/uploads` contains images and videos uploaded through the admin area. Back up this folder too.

## If the project does not open

1. Confirm that Node.js is installed by reopening `RUN_PROJECT.bat`. It will show a clear message if Node.js is missing.
2. Make sure no other program is already using port `3000`.
3. Keep the command window open and read the last error shown.
4. If dependencies appear damaged, delete only the `node_modules` folder, then run `RUN_PROJECT.bat` again. Do not delete `prisma/dev.db` or `public/uploads`.

## Optional: run from a terminal

For a developer using PowerShell:

```powershell
npm install
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
