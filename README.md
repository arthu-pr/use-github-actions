# useGitHubActions

GitHub Actions are limited to 2,000 minutes/month for private repositories

I initially created this repository as a workaround to not be limited by this quota.

It then became a playground to explore GitHub Actions capabilities and share re-usable workflows.

## Small Database

### Encryption and Decryption

Store [data](https://github.com/arthu-pr/use-github-actions/tree/main/data/encrypted), encrypted with PGP if sensitive

- Use [Github Actions](https://github.com/arthu-pr/use-github-actions/blob/main/.github/workflows/decrypt_data.yml) to decrypt and send the data to a private repository

_How it works:_

- Data are encrypted with a public PGP key
- They are stored in the repository through a git commit in a specific branch using a private API or custom script
- This repository contains the private PGP key to decrypt the data
- Using this [workflow](https://github.com/arthu-pr/use-github-actions/blob/main/.github/workflows/decrypt_data.yml) , data can be decrypted and sent to a private repository

### Public Data

- Store public [data](https://github.com/arthu-pr/use-github-actions/tree/main/data/public) that can be consumed as an API
- See [README](https://github.com/arthu-pr/use-github-actions/blob/main/data/public/README.md)

## Re-usable Workflows

- Re-usable workflows that can be called from other repositories
- Used mostly by small apps, to avoid re-writing the same workflows in each repository
- To recognize re-usable workflows, look for the `workflow_call` trigger in the workflow file, and the file name
