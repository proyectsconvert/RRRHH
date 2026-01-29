# Final approach: Line-by-line insertion for restoring the Descargar PDF button

$filePath = "c:\proyectosConvertia\RH\src\pages\admin\Candidates.tsx"
$lines = Get-Content $filePath

# 1. Add FileText to imports (line 7, index 6)
$lines[6] = $lines[6] -replace 'Download \}', 'Download, FileText }'

# 2. Add isDownloadingDocuments state after searchParams (after line 177, index 176)
$newState = "  const [isDownloadingDocuments, setIsDownloadingDocuments] = useState(false);"
$lines = $lines[0..176] + $newState + $lines[177..($lines.Length-1)]

# 3. Add handleDownloadDocuments function after the new state line (after line 178, index 177)
$functionLines = @"

  const handleDownloadDocuments = async () => {
    if (selectedCandidates.length === 0) return;

    try {
      setIsDownloadingDocuments(true);
      toast({
        title: "Generando PDF unificado",
        description: ``Procesando documentos de `${selectedCandidates.length} candidatos...``,
      });

      const { data: documents, error } = await supabase
        .from('candidate_documents')
        .select(``
          candidate_id, 
          document_type, 
          file_url, 
          file_name,
          candidates (
            first_name,
            last_name
          )
        ``)
        .in('candidate_id', selectedCandidates);

      if (error) throw error;

      if (!documents || documents.length === 0) {
        toast({
          title: "No hay documentos",
          description: "Los candidatos seleccionados no tienen documentos subidos.",
          variant: "destructive"
        });
        return;
      }

      const docsToMerge = [];

      for (const doc of documents) {
        if (doc.file_url) {
          const urlParts = doc.file_url.split('/');
          const storageFileName = urlParts[urlParts.length - 1].split('?')[0];
          const storagePath = ``${doc.candidate_id}/${storageFileName}``;

          const { data: signedData, error: signedError } = await supabase.storage
            .from('candidate-documents')
            .createSignedUrl(storagePath, 3600);

          if (signedData?.signedUrl) {
            let type = 'unknown';
            if (doc.file_name) {
              const ext = doc.file_name.split('.').pop()?.toLowerCase();
              if (ext) type = ext;
            } else if (storagePath) {
              const ext = storagePath.split('.').pop()?.toLowerCase();
              if (ext) type = ext;
            }
            if (type === 'jpeg') type = 'jpg';

            const candidateName = doc.candidates ? ``${doc.candidates.first_name} ${doc.candidates.last_name}`` : 'Candidato';

            docsToMerge.push({
              url: signedData.signedUrl,
              name: ``${candidateName} - ${doc.document_type}``,
              type: type
            });
          }
        }
      }

      if (docsToMerge.length === 0) {
        toast({
          title: "Error",
          description: "No se pudieron generar enlaces para los documentos.",
          variant: "destructive"
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(``${import.meta.env.VITE_SUPABASE_URL}/functions/v1/merge-documents``, {
        method: 'POST',
        headers: {
          'Authorization': ``Bearer ${session?.access_token}``,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documents: docsToMerge })
      });

      if (!response.ok) {
        throw new Error(``Error del servidor: ${response.statusText}``);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = ``Candidatos_Documentos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf``;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Descarga completada",
        description: "El PDF unificado se ha descargado correctamente.",
      });

    } catch (error: any) {
      console.error('Error downloading documents:', error);
      toast({
        title: "Error en la descarga",
        description: error.message || "No se pudo generar el PDF unificado.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingDocuments(false);
    }
  };
"@

$lines = $lines[0..177] + ($functionLines -split "`r?`n") + $lines[178..($lines.Length-1)]

# 4. Find and add the button after the Actualizar button (around line 1721 + offset from previous insertions)
# We added 1 line for state + ~120 lines for function = ~121 lines offset
$searchStartIndex = 1700 + 121
for ($i = $searchStartIndex; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\s+Actualizar\s*$') {
        # Found "Actualizar", now find the closing </Button>
        for ($j = $i; $j -lt $lines.Length; $j++) {
            if ($lines[$j] -match '^\s+</Button>\s*$') {
                # Insert the new button after this line
                $buttonLines = @"

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadDocuments}
            disabled={selectedCandidates.length === 0 || isDownloadingDocuments}
          >
            {isDownloadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Descargar PDF
          </Button>
"@
                $lines = $lines[0..$j] + ($buttonLines -split "`r?`n") + $lines[($j+1)..($lines.Length-1)]
                break
            }
        }
        break
    }
}

# Write back to file
$lines | Set-Content -Path $filePath

Write-Host "Successfully restored the 'Descargar PDF' button!" -ForegroundColor Green
Write-Host "Changes made:" -ForegroundColor Cyan
Write-Host "  1. Added FileText to lucide-react imports" -ForegroundColor Green
Write-Host "  2. Added isDownloadingDocuments state" -ForegroundColor Green
Write-Host "  3. Added handleDownloadDocuments function" -ForegroundColor Green
Write-Host "  4. Added Descargar PDF button to UI" -ForegroundColor Green
