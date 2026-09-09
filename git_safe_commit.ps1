# ============================================================
# PowerShell - Git Safe Commit Tool
# 実行方法  .\git_safe_commit.ps1
# ============================================================

function Write-Section {
    param([string]$text)

    Write-Host ""
    Write-Host "--------------------------------------" -ForegroundColor DarkGray
    Write-Host $text -ForegroundColor Cyan
    Write-Host "--------------------------------------" -ForegroundColor DarkGray
}

function Stop-OnError {
    param([string]$message)

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "ERROR: $message" -ForegroundColor Red
        exit
    }
}

function Confirm-Step {
    param([string]$message)

    $ans = Read-Host "$message (y/n)"

    if ($ans -ne "y") {
        Write-Host "処理を中止しました"
        exit
    }
}

function Check-GitRepo {

    if (!(Test-Path ".git")) {
        Write-Host "ERROR: Git Repositoryではありません" -ForegroundColor Red
        exit
    }
}

function Show-Branch {

    Write-Section "現在のBranch"

    $branch = git branch --show-current
    Write-Host "Branch: $branch" -ForegroundColor Yellow
}

function Show-Remote {

    Write-Section "Remote"

    git remote -v
}

function Show-Status {

    Write-Section "変更ファイル"

    git status
}

function Show-Diff {

    Write-Section "変更内容 (diff)"

    git --no-pager diff
}

function Git-Add {

    Write-Section "git add"

    git add .

    Stop-OnError "git add 失敗"
}

function Git-Commit {
    param([string]$msg)

    Write-Section "git commit"

    git commit -m "$msg"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "コミットされませんでした (変更なしの可能性)" -ForegroundColor Yellow
        exit
    }
}

function Git-Push {

    Write-Section "git push"

    git push

    Stop-OnError "push失敗"
}

function Show-Log {

    Write-Section "最新コミット"

    git log -5 --oneline
}

# ============================================================
# メイン処理
# ============================================================

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " Git Safe Commit Tool  (Complete)"
Write-Host "======================================" -ForegroundColor Green

# ------------------------------------------------------------
# Git Repo確認
# ------------------------------------------------------------

Check-GitRepo

# ------------------------------------------------------------
# Branch確認
# ------------------------------------------------------------

Show-Branch

# ------------------------------------------------------------
# Remote確認
# ------------------------------------------------------------

Show-Remote

# ------------------------------------------------------------
# Status確認
# ------------------------------------------------------------

Show-Status

Confirm-Step "add へ進みますか？"

# ------------------------------------------------------------
# diff表示
# ------------------------------------------------------------

Show-Diff

Confirm-Step "git add 実行しますか？"

# ------------------------------------------------------------
# add
# ------------------------------------------------------------

Git-Add

# ------------------------------------------------------------
# commit message
# ------------------------------------------------------------

Write-Section "Commit Message"

$msg = Read-Host "コミットメッセージ入力"

if ([string]::IsNullOrWhiteSpace($msg)) {

    Write-Host "ERROR: メッセージが空です" -ForegroundColor Red
    exit
}

Confirm-Step "commit実行しますか？"

# ------------------------------------------------------------
# commit
# ------------------------------------------------------------

Git-Commit $msg

# ------------------------------------------------------------
# push確認
# ------------------------------------------------------------

Confirm-Step "pushしますか？"

# ------------------------------------------------------------
# push
# ------------------------------------------------------------

Git-Push

# ------------------------------------------------------------
# log表示
# ------------------------------------------------------------

Show-Log

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " 完了"
Write-Host "======================================" -ForegroundColor Green

Write-Host ""
Read-Host "Enterキーで終了"