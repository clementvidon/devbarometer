# Git Workflow (solo developer)

Simplified workflow when you’re the only committer.

## Table of Contents

0. [sync main](#0-sync-main)
1. [create feature branch](#1-create-feature-branch)
2. [work & commit](#2-work--commit)
3. [backup WIP (optional)](#3-backup-wip-optional)
4. [merge into main](#4-merge-into-main)
5. [push](#5-push)
6. [cleanup (after merge)](#6-cleanup-after-merge)

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
git rebase -i --autosquash COMMIT_SHA^
```

## 3) backup WIP (optional)

```bash
git push --set-upstream origin BRANCH_NAME
```

## 4) merge into main

```bash
git switch main
git pull --ff-only
git merge --ff-only BRANCH_NAME
```

If `--ff-only` refuses:

```bash
git switch BRANCH_NAME
git rebase main
git switch main
git merge --ff-only BRANCH_NAME
```

_(Or use GitHub “Rebase & merge” button.)_

## 5) push

```bash
git push
```

## 6) cleanup (after merge)

```bash
git branch -d BRANCH_NAME
git fetch --prune
```

_(Optional)_

```bash
git gc --prune=now
```
