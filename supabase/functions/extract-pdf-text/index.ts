
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Define CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log('Iniciando función extract-pdf-text');
    
    // Parse the request body
    const requestData = await req.text();
    let requestBody;
    try {
      requestBody = JSON.parse(requestData);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError, 'Raw data:', requestData);
      throw new Error('Error al parsear la solicitud: formato JSON inválido');
    }

    const { extractedText, jobDetails, documentUrl, isWordDocument } = requestBody;

    let textToAnalyze = extractedText;

    // If it's a Word document, we need to extract text from it first
    if (isWordDocument && documentUrl) {
      console.log('Procesando documento Word desde URL:', documentUrl);
      console.log('Procesando documento Word:', documentUrl);

      try {
        // Fetch the Word document
        const docResponse = await fetch(documentUrl);
        if (!docResponse.ok) {
          throw new Error(`No se pudo descargar el documento: ${docResponse.status}`);
        }

        const docBuffer = await docResponse.arrayBuffer();

        // For Word documents, we'll use a simple text extraction approach
        // Convert the buffer to string and extract readable text
        const docText = new TextDecoder('utf-8').decode(docBuffer);
        const docTextLatin1 = new TextDecoder('latin1').decode(docBuffer);

        // Try to extract text from Word document structure
        // This is a basic approach - Word documents contain readable text mixed with binary data
        let extractedDocText = '';

        // Look for readable text patterns in the document
        const textMatches = docText.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ\s\d\.,;:!?()[\]{}@#$%&*+-=<>|\/\\]+/g);
        if (textMatches) {
          extractedDocText = textMatches.join(' ').replace(/\s+/g, ' ').trim();
        }

        // If UTF-8 didn't work well, try Latin1
        if (!extractedDocText || extractedDocText.length < 50) {
          const latinMatches = docTextLatin1.match(/[a-zA-ZáéíóúñÁÉÍÓÚÑ\s\d\.,;:!?()[\]{}@#$%&*+-=<>|\/\\]+/g);
          if (latinMatches) {
            extractedDocText = latinMatches.join(' ').replace(/\s+/g, ' ').trim();
          }
        }

        // Clean up the extracted text
        extractedDocText = extractedDocText
          .replace(/[^\w\sáéíóúñÁÉÍÓÚÑ\d\.,;:!?()[\]{}@#$%&*+-=<>|\/\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (extractedDocText.length < 50) {
          throw new Error('No se pudo extraer suficiente texto legible del documento Word');
        }

        textToAnalyze = extractedDocText;
        console.log('Texto extraído del documento Word:', textToAnalyze.substring(0, 200) + '...');

      } catch (docError) {
        console.error('Error procesando documento Word:', docError);
        throw new Error(`Error al procesar documento Word: ${docError.message}`);
      }
    }

    if (!textToAnalyze) {
      console.error('No text provided for analysis');
      throw new Error('No se proporcionó texto para análisis');
    }
    
    console.log('Recibido texto para análisis:', textToAnalyze.substring(0, 100) + '...');
    console.log('Texto completo longitud:', textToAnalyze.length);
    console.log('Enviando texto extraído para análisis estructurado...');
    
    // OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY') || Deno.env.get('OPENAI');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('Clave de API de OpenAI no configurada');
    }
    
    // Prepare system prompt based on whether job details are provided
    let systemPrompt = `Analiza el siguiente texto extraído de un currículum vitae y devuelve un análisis detallado en formato JSON.
    -En el elemento de "habilidades", usa palabras puntuales y especificas para describir cada habilidad, no uses más de 3 palabras.
    -Para cada elemento en "experienciaLaboral", llena el campo "duracion" SOLO SI LA EXPERIENCIA TIENE RELACIÓN CON LA VACANTE, calcula la duración total en años y meses y colócala en el campo "duracion" con el formato "X años y Y meses".

    Tu respuesta debe ser un objeto JSON con la siguiente estructura:
    {
      "datosPersonales": {
        "nombre": "",
        "telefono": "",
        "email": "",
        "ubicacion": "",
        "disponibilidad": "",
        "linkedin": ""
      },
      "perfilProfesional": "",
      "experienciaLaboral": [
        {
          "empresa": "",
          "cargo": "",
          "fechas": "",
          "duracion":,
          "responsabilidades": [""]
        }
      ],
      "educacion": [
        {
          "institucion": "",
          "carrera": "",
          "fechas": ""
        }
      ],
      "habilidades": [""],
      "certificaciones": [""],
      "idiomas": [""],
      "fortalezas": [""],
      "areasAMejorar": [""]`;
    
    // If job details provided, add compatibility analysis
    if (jobDetails) {
      systemPrompt += `,
      "compatibilidad": {
        "porcentaje": 0,
        "fortalezas": [""],
        "debilidades": [""],
        "recomendacion": ""
      }
      
      Para la sección "compatibilidad", evalúa qué tan bien se ajusta el candidato a la vacante proporcionada:
      - Asigna un porcentaje entre 0 y 100 basado en cómo las habilidades, experiencia y conocimientos del candidato coinciden con los requisitos de la vacante
      - Identifica las fortalezas clave del candidato para esta posición
      - Identifica áreas donde el candidato podría no cumplir con los requisitos
      - Proporciona una recomendación profesional sobre si seguir con este candidato
      
      Detalles de la vacante:
      Título: ${jobDetails?.title || 'No proporcionado'}
      Descripción: ${jobDetails?.description || 'No proporcionada'}
      Requisitos: ${jobDetails?.requirements || 'No proporcionados'}
      Responsabilidades: ${jobDetails?.responsibilities || 'No proporcionadas'}`;
    }
    
    // Close JSON structure 
    systemPrompt += `
    }
    
    IMPORTANTE: Asegúrate de que tu respuesta sea un objeto JSON válido y bien formateado. No incluyas markdown, comentarios ni información adicional fuera del objeto JSON.`;
    
    console.log('Iniciando análisis del texto extraído con OpenAI');
    
    try {
      // Analyze CV with OpenAI - Add timeout options and better error handling
      const openaiStartTime = Date.now();
      
      // Check openAI API key validity
      if (!openaiApiKey || openaiApiKey.length < 20) {
        throw new Error('API key de OpenAI no es válida');
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Aquí está el texto extraído del CV para analizar: ${textToAnalyze}` }
          ],
          temperature: 0.5,
          max_tokens: 2000
        }),
      });
      
      console.log(`OpenAI response time: ${Date.now() - openaiStartTime}ms, Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: errorText }};
        }
        console.error('Error response from OpenAI:', errorData);
        throw new Error(`Error en la API de OpenAI: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response format from OpenAI:', data);
        throw new Error('Respuesta inválida de OpenAI');
      }
      
      const analysisResult = data.choices[0].message.content;
      
      // Validate that the result is valid JSON
      try {
        const parsed = JSON.parse(analysisResult);
        console.log('Análisis estructurado completado correctamente');
        console.log('Resultado: ', JSON.stringify(parsed).substring(0, 200) + '...');
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            analysis: analysisResult 
          }),
          { 
            headers: corsHeaders
          }
        );
      } catch (e) {
        console.error('Error: El resultado no es un JSON válido:', e);
        console.error('Resultado que causó error:', analysisResult);
        throw new Error('El análisis no devolvió un formato JSON válido');
      }
    } catch (openAiError) {
      console.error('Error al comunicarse con OpenAI:', openAiError);
      throw new Error(`Error al comunicarse con OpenAI: ${openAiError.message}`);
    }
    
  } catch (error) {
    console.error('Error en extract-pdf-text function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Error procesando el documento' 
      }),
      { 
        status: 400, 
        headers: corsHeaders
      }
    );
  }
});
