#!/usr/bin/env sh

set -e

npm run build

cd dist

git add -A
git commit -m ':)'

cd ..

git subtree push --prefix dist origin master:gh-pages

cd - 