# Fix the handleDownloadDocuments function string interpolation issues

$filePath = "c:\proyectosConvertia\RH\src\pages\admin\Candidates.tsx"
$content = Get-Content $filePath -Raw

# Fix line 221: storagePath construction
$content = $content -replace "const storagePath = `/`;", "const storagePath = `"`${doc.candidate_id}/`${storageFileName}`";"

# Fix line 238: candidateName construction  
$content = $content -replace "const candidateName = doc\.candidates \? ` ` : 'Candidato';", "const candidateName = doc.candidates ? ```"`${doc.candidates.first_name} `${doc.candidates.last_name}`"`` : 'Candidato';"

# Fix line 242: document name construction
$content = $content -replace "name: ` - `,", "name: ```"`${candidateName} - `${doc.document_type}`"``,""

# Fix line 259: API URL
$content = $content -replace "const response = await fetch\(`/functions/v1/merge-documents`,", "const response = await fetch(```"`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-documents`"``,""

# Fix line 262: Authorization header
$content = $content -replace "'Authorization': `Bearer `,", "'Authorization': ```"Bearer `${session?.access_token}`"``,""

# Fix line 269: Error message
$content = $content -replace "throw new Error\(`Error del servidor: `\);", "throw new Error(```"Error del servidor: `${response.statusText}`"``);"

# Fix line 276: Download filename
$content = $content -replace "a\.download = `Candidatos_Documentos_\.pdf`;", "a.download = ```"Candidatos_Documentos_`${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`"``;"

# Write back to file
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Successfully fixed handleDownloadDocuments function!" -ForegroundColor Green
Write-Host "Fixed issues:" -ForegroundColor Cyan
Write-Host "  1. storagePath construction (line 221)" -ForegroundColor Green
Write-Host "  2. candidateName construction (line 238)" -ForegroundColor Green
Write-Host "  3. Document name construction (line 242)" -ForegroundColor Green
Write-Host "  4. API URL (line 259)" -ForegroundColor Green
Write-Host "  5. Authorization header (line 262)" -ForegroundColor Green
Write-Host "  6. Error message (line 269)" -ForegroundColor Green
Write-Host "  7. Download filename (line 276)" -ForegroundColor Green
