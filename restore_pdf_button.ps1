# Script to restore the missing 'Descargar PDF' button in Candidates.tsx

$filePath = "c:\proyectosConvertia\RH\src\pages\admin\Candidates.tsx"
$content = Get-Content $filePath -Raw

# 1. Add FileText to imports (line 7)
$content = $content -replace "import \{ Plus, Filter, Loader2, Mail, Phone, MapPin, RefreshCw, Ellipsis, Columns3, EyeOff, Grid2x2X, Trash2, Ban, SquareArrowRight, Eye, Search, Download \} from 'lucide-react';", "import { Plus, Filter, Loader2, Mail, Phone, MapPin, RefreshCw, Ellipsis, Columns3, EyeOff, Grid2x2X, Trash2, Ban, SquareArrowRight, Eye, Search, Download, FileText } from 'lucide-react';"

# 2. Add isDownloadingDocuments state after searchParams
$content = $content -replace "(\s+const \[searchParams\] = useSearchParams\(\);)", "`$1`r`n  const [isDownloadingDocuments, setIsDownloadingDocuments] = useState(false);"

# 3. Add handleDownloadDocuments function after isDownloadingDocuments state
$handleDownloadDocumentsFunction = @"

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

$content = $content -replace "(\s+const \[isDownloadingDocuments, setIsDownloadingDocuments\] = useState\(false\);)", "`$1$handleDownloadDocumentsFunction"

# 4. Add the Descargar PDF button after the Actualizar button
$pdfButton = @"
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={``h-4 w-4 ${refreshing ? 'animate-spin' : ''}``} />
            Actualizar
          </Button>

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

$content = $content -replace "(\s+<Button\r?\n\s+variant=`"outline`"\r?\n\s+onClick=\{handleRefresh\}\r?\n\s+disabled=\{refreshing\}\r?\n\s+className=`"flex items-center gap-1`"\r?\n\s+>\r?\n\s+<RefreshCw className=\{`"h-4 w-4 \$\{refreshing \? 'animate-spin' : ''\}`"\} />\r?\n\s+Actualizar\r?\n\s+</Button>)", $pdfButton

# Write the modified content back
Set-Content -Path $filePath -Value $content -NoNewline

Write-Host "Successfully restored the 'Descargar PDF' button!" -ForegroundColor Green
