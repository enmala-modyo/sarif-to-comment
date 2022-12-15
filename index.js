const { inspect } = require("util");
const core = require("@actions/core");
const github = require("@actions/github");
const fs = require('fs');

const originMeta = {
  commentFrom: 'Generate comments from sarif file',
}

async function run() {
  try {
    const inputs = {
      token: core.getInput('token') || core.getInput('github_token') || process.env.GITHUB_TOKEN,
      path: core.getInput("sarif_file"),
      title: core.getInput("title"),
    };

    if(!inputs.token) {
      core.setFailed('❌ A token is required to execute this action')
      return
    }

    const {
      payload: { pull_request: pullRequest, repository }
    } = github.context;

    if (!pullRequest) {
      core.error("This action only works on pull_request events");
      return;
    }

    const { number: issueNumber } = pullRequest;
    const { full_name: repoFullName } = repository;
    const [owner, repo] = repoFullName.split("/");

    const octokit = new github.getOctokit(inputs.token);

    const data = fs.readFileSync(`${process.env.GITHUB_WORKSPACE}/${inputs.path}`, 'utf8');
    const json = JSON.parse(data);

    let levels = new Map();
    json.runs[0].results.forEach(result => {
        const level = result.level != undefined ? result.level : 'undefined'
        const count = levels.has(level) ? levels.get(level) : 0;
        levels.set(level,count+1);
    });

    let resume = `<!--json:${JSON.stringify(originMeta)}-->
|${inputs.title.padEnd(30)}|          |
|------------------------------|----------|
|${"Total".padEnd(30)}|${json.runs[0].results.length.toString().padStart(10)}|
`;
    for (const key of levels.keys()) {
        resume += `|${key.padEnd(30)}|${levels.get(key).toString().padStart(10)}|
`
    };

    await deletePreviousComments({
      issueNumber,
      octokit,
      owner,
      repo,
    });

    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: issueNumber,
      body: resume,
    });
  } catch (error) {
    core.debug(inspect(error));
    core.setFailed(error.message);
  }
}

async function deletePreviousComments({ owner, repo, octokit, issueNumber }) {
  const onlyPreviousSarifComments = (comment) => {
    const regexMarker = /^<!--json:{.*?}-->/;
    const extractMetaFromMarker = (body) => JSON.parse(body.replace(/^<!--json:|-->(.|\n|\r)*$/g, ''));

    if (comment.user.type !== 'Bot') return false;
    if (!regexMarker.test(comment.body)) return false;

    const meta = extractMetaFromMarker(comment.body);

    return meta.commentFrom === originMeta.commentFrom;
  }

  const asyncDeleteComment = (comment) => {
    return octokit.issues.deleteComment({ owner, repo, comment_id: comment.id });
  }

  const commentList = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
  }).then(response => response.data);

  await Promise.all(
    commentList
    .filter(onlyPreviousSarifComments)
    .map(asyncDeleteComment)
  );
}

run();
