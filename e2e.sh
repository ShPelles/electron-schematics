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
SCHEMATICS_VERSION=$(node -p "require('./package.json').version")
npm pack

cd ../build-electron
BUILDER_VERSION=$(node -p "require('./package.json').version")
npm pack

npm i @angular/cli@7.3.9 -g


# goto e2e directory
cd ../../e2e$3
echo 'tested version is in ' $PWD

# install packages & generate electron project
npm i "../packages/schematics/electron-schematics-schematics-${SCHEMATICS_VERSION}.tgz"
ng g @electron-schematics/schematics:electron
npm i "../packages/build-electron/electron-schematics-build-electron-${BUILDER_VERSION}.tgz"


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
    cd dist
    ls
    echo 'Not finding the file:' $1
    exit 1
fi


# read -p "Press enter to continue"
