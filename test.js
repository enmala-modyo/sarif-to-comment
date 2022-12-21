const fs = require('fs');
const { setFlagsFromString } = require('v8');

const originMeta = {
    commentFrom: 'Generate comments from sarif file',
  }

const path = 'test/_stubs/snyk-sarif.json';
const title = 'Reporte de Seguridad';
const data = fs.readFileSync(`${path}`, 'utf8');
const json = JSON.parse(data);
const levelRegex = /\nSeverity: [A-Z]+/g;

let levels = new Map();
json.runs[0].results.forEach(result => {
    const text = result.message.text;
    const levelText = text.match(levelRegex);
    let level = levelText != null ? levelText.toString().split(' ')[1]: 'UNKNOWN'
    if(level == 'UNKNOWN') {
        level = result.level == undefined ? 'UNKNOWN' : result.level.toString().toUpperCase();
    }
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

    // Now I add a coment for each issue in results
    json.runs[0].results.forEach(result => { 
        resume += `\n**${result.ruleId}**\n> ${result.message.text}\n`
      });

console.info(resume);