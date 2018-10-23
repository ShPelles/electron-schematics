# set -e
set -v

npm run build
# read -p "Press enter to continue"

cd packages/build-electron
npm version 0.0.1 -git-tag-version false
npm pack
# read -p "Press enter to continue"

cd ../../e2e
npm i ../packages/schematics
ng g @electron-schematics/schematics:electron
mv -force 'main.ts' 'projects/electron/main.ts'
read -p "Press enter to continue"

npm i ../packages/build-electron/electron-schematics-build-electron-0.0.1.tgz
ng serve electron

read -p "Press enter to continue"