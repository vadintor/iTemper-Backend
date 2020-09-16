# Servers 
1. itemper.vading.lan
2. vs.vading.lan

## itemper
ssh tova@itemper
## vs.vading.lan
vading\administrator

#Pipeline
## New feature
git checkout -b <new branch>
git pull --rebase origin master

## Code changes (locally)
git add .
git status
git commit -m "<message>"

## Push code changes to remote branch on Github
git push --set-upstream origin <branch>
git push -u origin <branch>

## Build docker and deploy
create pull request on github (username: vadintor)
ssh tova@itemper
./bin/runItemper


# Software - manual
# Build and release
Check latest released version in the folder release
Edit version in package.json
npm run build
npm run release

## deploy preparations 
### Deprecated
tar -czvf bin.tar.gz bin
scp bin tova@temper:
ssh tova@itemper
tar -xzf bin.tar.gz
$PATH=/home/tova/bin:$PATH
initDebian.sh
initKeys.sh
initMongodb.sh

## Deploy a back-end release
### Deprecated
scp release/iTemperNode_<version>.tar.gz tova@iTemper:
deploy.sh <version>

