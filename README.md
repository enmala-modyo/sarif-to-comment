# Comment Test Coverage

A GitHub action to comment on a PR on GitHub from the content of a safir file.

## Workflow example

```yml
name: run-dependency-check

on:
  pull_request:
    types:
      - opened
      - synchronize
      - reopened

jobs:
  analyze:
    runs-on: ubuntu-latest
    if: github.event.pull_request.draft == false
    - uses: actions/checkout@v2
      with:
        fetch-depth: 0  # Shallow clones should be disabled for a better relevancy of analysis
    - name: Run Grype vulnerability scanner
      uses: anchore/scan-action@v3
      id: scan
      with:
        path: "."
        fail-build: false
        severity-cutoff: critical

    - name: Comment Scan Output
      uses: enmala-modyo/sarif-to-comment@0.0.1
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        sarif_file: ${{ steps.scan.outputs.sarif }}
        title: Dependency Vulnerability Report
```


## Parameters

- `token` (**required**) - The GitHub authentication token (workflows automatically set this for you, nothing needed here)
- `sarif_file` (**required**) - Path to your safir .json file
- `title` (**optional**) - Title of comment in PR (defaults to "Test Coverage")


## License
[MIT](LICENSE)
from the work of Vinícius Hoyer, https://github.com/vhoyer/comment-test-coverage