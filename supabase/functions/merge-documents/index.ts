
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { documents } = await req.json();

    if (!documents || !Array.isArray(documents)) {
      throw new Error('No documents provided');
    }

    console.log(`Processing ${documents.length} documents...`);

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();
    const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);

    for (const doc of documents) {
      try {
        console.log(`Processing document: ${doc.name} (${doc.type})`);

        // Fetch document content
        const response = await fetch(doc.url);
        if (!response.ok) {
          console.error(`Failed to fetch document ${doc.name}: ${response.statusText}`);
          continue;
        }

        const arrayBuffer = await response.arrayBuffer();

        if (doc.type === 'pdf') {
          // Merge PDF
          try {
            const pdfToMerge = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
          } catch (e) {
            console.error(`Error merging PDF ${doc.name}:`, e);
            addErrorPage(mergedPdf, doc.name, "Error al procesar este archivo PDF. Puede estar dañado o protegido.", helveticaFont);
          }
        } else if (['jpg', 'jpeg', 'png'].includes(doc.type)) {
          // Merge Image
          try {
            let image;
            if (doc.type === 'png') {
              image = await mergedPdf.embedPng(arrayBuffer);
            } else {
              image = await mergedPdf.embedJpg(arrayBuffer);
            }

            const page = mergedPdf.addPage();
            const { width, height } = page.getSize();

            // Scale image to fit page while maintaining aspect ratio
            const imgDims = image.scaleToFit(width - 50, height - 50);

            page.drawImage(image, {
              x: (width - imgDims.width) / 2,
              y: (height - imgDims.height) / 2,
              width: imgDims.width,
              height: imgDims.height,
            });
          } catch (e) {
            console.error(`Error merging Image ${doc.name}:`, e);
            addErrorPage(mergedPdf, doc.name, "Error al procesar esta imagen.", helveticaFont);
          }
        } else {
          // Unsupported format (Word, Excel, etc.) -> Add placeholder page
          addErrorPage(mergedPdf, doc.name, "Este documento no se pudo convertir automáticamente (Formato no soportado). Por favor descárguelo individualmente.", helveticaFont);
        }

      } catch (error) {
        console.error(`Error processing document ${doc.name}:`, error);
        addErrorPage(mergedPdf, doc.name, "Error general al procesar este documento.", helveticaFont);
      }
    }

    const pdfBytes = await mergedPdf.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="documentos_unificados.pdf"',
      },
    });

  } catch (error) {
    console.error('Error in merge-documents:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function addErrorPage(pdfDoc: PDFDocument, docName: string, message: string, font: any) {
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;

  page.drawText(`Documento: ${docName}`, {
    x: 50,
    y: height - 100,
    size: 18,
    font: font,
    color: rgb(0, 0, 0),
  });

  page.drawText(message, {
    x: 50,
    y: height - 130,
    size: fontSize,
    font: font,
    color: rgb(1, 0, 0), // Red color
  });
}
