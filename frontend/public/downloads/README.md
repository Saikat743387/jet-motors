# JET MOTORS Android APK download

Place the real, signed `jet-motors.apk` in this directory.

- The Home page download icon links to `/downloads/jet-motors.apk`.
- `vercel.json` serves everything under `/downloads/` as
  `application/vnd.android.package-archive` with `Content-Disposition: attachment`,
  so Chrome downloads it and Android offers installation.
- Do NOT commit a fake file (renamed zip/html/png). Only a genuine
  signed APK built from the Android wrapper belongs here.
