# restore.ps1 - Restore from the newest slot (or a given one)

param (
  [string]$slot = ""
)

if (-not $slot) {
  Write-Host "No slot specified, selecting most recently modified one..."
  $latest = Get-ChildItem -Directory -Path ".\\backups" | 
    Sort-Object LastWriteTime -Descending | 
    Select-Object -First 1

  if ($latest) {
    $slot = $latest.Name
    Write-Host "Using slot: $slot"
  } else {
    Write-Host "❌ No backups found in ./backups"
    exit 1
  }
}

docker-compose exec mongo mongorestore --drop --dir /backup/$slot
