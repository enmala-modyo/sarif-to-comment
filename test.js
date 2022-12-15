const fs = require('fs');
const { setFlagsFromString } = require('v8');

const originMeta = {
    commentFrom: 'Generate comments from sarif file',
  }

const path = 'test/_stubs/trivy-sarif.json';
const title = 'Reporte de Seguridad';
const data = fs.readFileSync(`${path}`, 'utf8');
const json = JSON.parse(data);

let levels = new Map();
json.runs[0].results.forEach(result => {
    const level = result.level != undefined ? result.level : 'undefined'
    const count = levels.has(level) ? levels.get(level) : 0;
    levels.set(level,count+1);
});

let resume = `<!--json:${JSON.stringify(originMeta)}-->
|${title.padEnd(30)}|          |
|------------------------------|----------|
|${"Total".padEnd(30)}|${json.runs[0].results.length.toString().padStart(10)}|
`;
for (const key of levels.keys()) {
    resume += `|${key.padEnd(30)}|${levels.get(key).toString().padStart(10)}|
`
};

console.info(resume);