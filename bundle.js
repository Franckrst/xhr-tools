var fs = require('fs');

const js = fs.readFileSync('./public/build/bundle.js', 'utf8');
const css = fs.readFileSync('./public/build/bundle.css', 'utf8');

const cssInjector = `
const el = document.createElement("style");
el.innerText = "${css.replace(/"/g,'\\"')}";
document.head.appendChild(el);`

fs.writeFileSync('script.js', js + cssInjector);

