$r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/create-your-demo/society" -UseBasicParsing -TimeoutSec 20
$c = $r.Content
Write-Output "status=$($r.StatusCode)"
Write-Output "len=$($c.Length)"
Write-Output "dashboard=$($c -match 'Dashboard')"
Write-Output "openingStuck=$($c -match 'Opening Society Demo')"
Write-Output "retryNow=$($c -match 'Retry now')"
Write-Output "modules=$($c -match 'Loading shared demo modules')"
