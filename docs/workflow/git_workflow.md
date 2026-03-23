# Git Workflows

Follow this workflow to contribute efficiently and keep the repository clean and organized.

## Table of Contents

0. [sync main](#0-sync-main)
1. [create feature branch](#1-create-feature-branch)
2. [work & commit](#2-work--commit)
3. [push changes](#3-push-changes)
4. [pull request & code review](#4-pull-request--code-review)
5. [integration (once approved)](#5-integration-once-approved)
6. [push](#6-push)
7. [cleanup (after merge)](#7-cleanup-after-merge)

## 0) sync main

```bash
git switch main
git pull --ff-only --prune
```

## 1) create feature branch

```bash
git switch -c BRANCH_NAME
```

## 2) work & commit

```bash
git add FILES
git commit -m "COMMIT_MSG"
```

_(Optional: fix up past commit)_

```bash
git add FILES
git commit --fixup=COMMIT_SHA
git fetch origin
git rebase -i --autosquash origin/main
```

## 3) push changes

```bash
git fetch origin
git rebase -i origin/main
git push --force-with-lease origin BRANCH_NAME
```

## 4) pull request & code review

1. Open a PR on GitHub
2. Ensure CI passes
3. Request reviews

## 5) integration (once approved)

```bash
git switch main
git pull --ff-only
git merge --ff-only origin/BRANCH_NAME
```

If `--ff-only` refuses:

```bash
git switch BRANCH_NAME
git rebase main
git switch main
git merge --ff-only BRANCH_NAME
```

_(Or use GitHub “Rebase & merge” button.)_

## 6) push

```bash
git push origin main
```

## 7) cleanup (after merge)

```bash
git push origin --delete "BRANCH_NAME"
git branch -d "BRANCH_NAME"
git fetch --prune
```

_(Optional)_

```bash
git gc --prune=now
```
