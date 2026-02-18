interface EvolutionApiConfig {
  apiUrl: string;
  apiToken: string;
  instanceName: string;
  botNumber: string;
}

export const getEvolutionApiConfig = (): EvolutionApiConfig => {
  const apiUrl = import.meta.env.VITE_EVOLUTION_API_URL;
  const apiToken = import.meta.env.VITE_EVOLUTION_API_TOKEN;
  const instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE || 'TestWPP';
  const botNumber = import.meta.env.VITE_BOT_NUMBER || '3192463493';

  if (!apiUrl || !apiToken) {
    throw new Error('Evolution-API configuration missing. Please check VITE_EVOLUTION_API_URL and VITE_EVOLUTION_API_TOKEN environment variables.');
  }

  return {
    apiUrl,
    apiToken,
    instanceName,
    botNumber
  };
};

export const sendEvolutionMessage = async (
  recipientNumber: string,
  message: string,
  saveToHistory: boolean = false
): Promise<void> => {
  const config = getEvolutionApiConfig();

  // Format phone number for Evolution API (remove + and add @s.whatsapp.net)
  let formattedNumber = recipientNumber;
  if (recipientNumber.startsWith('+')) {
    // Remove the + and add @s.whatsapp.net
    formattedNumber = recipientNumber.substring(1) + '@s.whatsapp.net';
  } else if (!recipientNumber.includes('@s.whatsapp.net')) {
    // If it doesn't already have the suffix, add it
    formattedNumber = recipientNumber + '@s.whatsapp.net';
  }

  console.log('Original number:', recipientNumber, 'Formatted number:', formattedNumber);

  // Send to Evolution-API
  const requestBody = {
    number: formattedNumber,
    text: message.trim(),
  };

  const evolutionResponse = await fetch(`${config.apiUrl}/message/sendText/${config.instanceName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiToken}`,
      'apikey': config.apiToken,
    },
    body: JSON.stringify(requestBody),
  });

  if (!evolutionResponse.ok) {
    let errorMessage = `HTTP ${evolutionResponse.status}: ${evolutionResponse.statusText}`;
    try {
      const errorData = await evolutionResponse.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch (parseError) {
      // Silent error parsing
    }
    throw new Error(`Error sending message to Evolution-API: ${errorMessage}`);
  }

  const responseData = await evolutionResponse.json();
  console.log('Evolution API response:', responseData);

  // Optionally save to historychat table
  if (saveToHistory) {
    const { supabase } = await import('@/integrations/supabase/client');

    const { error } = await (supabase as any)
      .from('historychat')
      .insert({
        hicnumerouser: recipientNumber,
        hicusername: 'Sistema', // Default username for system messages
        hicsendnumbot: config.botNumber,
        hicmessagebot: message.trim(),
        hicmessageuser: null,
      });

    if (error) {
      console.error('Error saving message to history:', error);
      // Don't throw here as the message was sent successfully
    }
  }
};

export const sendWelcomeMessage = async (candidatePhone: string, candidateName: string, documentUrl?: string): Promise<void> => {
  const baseUrl = window.location.origin;
  const defaultDocumentUrl = documentUrl || `${baseUrl}/candidate-documents`;

  const welcomeMessage = `¡Felicidades ${candidateName}! Has avanzado al proceso de contratación en Convertia. Para continuar, por favor sube los documentos requeridos en el siguiente enlace: ${defaultDocumentUrl}`;

  await sendEvolutionMessage(candidatePhone, welcomeMessage, true);
};

export const sendRescheduleMessage = async (
  candidatePhone: string,
  candidateName: string,
  date: Date,
  time: string,
  modality: 'virtual' | 'presencial',
  addressOrLink: string
): Promise<void> => {
  // Format time with AM/PM
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours);
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  const timeFormatted = `${hour12}:${minutes} ${ampm}`;

  const dateTimeStr = `${date.toLocaleDateString('es-ES')} a las ${timeFormatted}`;

  const locationInfo = modality === 'presencial'
    ? `Te esperamos en la siguiente dirección: ${addressOrLink}`
    : `Te puedes conectar mediante el siguiente enlace: ${addressOrLink}`;

  const message = `Hola ${candidateName}, te informamos que tu entrevista con Convertia ha sido *reagendada*. La nueva cita quedó programada para el día ${dateTimeStr}. ${locationInfo}. ¡Te esperamos!`;

  await sendEvolutionMessage(candidatePhone, message, true);
};