set -e
set -v


# insall dependencies & build (unnecessary on the CI, after the build pipeline)
# npm install
# cd packages/build-electron
# npm install
# cd ../schematics
# npm install
# cd ../..
# npm run build


# pack the packages
cd packages/schematics
npm version 0.0.1 -git-tag-version false
npm pack

cd ../build-electron
npm version 0.0.1 -git-tag-version false
npm pack

npm i @angular/cli -g


# goto e2e directory
cd ../../e2e$3
echo 'tested version is in ' $PWD

# install packages & generate electron project
npm i ../packages/schematics/electron-schematics-schematics-0.0.1.tgz
ng g @electron-schematics/schematics:electron
npm i ../packages/build-electron/electron-schematics-build-electron-0.0.1.tgz


# run the app with auto exit & check the log
cp 'main.ts' 'projects/electron/main.ts'    
LOG=$(ng serve electron --port 4242);
echo $LOG

if [[ ! $2 == "ubuntu"* ]] ; then
    if [[ ! $LOG == *"Angualr say: on init"* ]] ; then
        exit 1
    fi

fi


# try to build the app
rm -r ./dist
ng build electron

# check if electron app exists
if [[ ! -f $1 ]] ; then
    exit 1
fi


# read -p "Press enter to continue"
