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

  // Send to Evolution-API
  const requestBody = {
    number: recipientNumber,
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

export const sendWelcomeMessage = async (candidatePhone: string, candidateName: string): Promise<void> => {
  const welcomeMessage = `Hola ${candidateName}, bienvenido a Convertia, estás en el proceso de contratación, por favor sube estos documentos a este link: youtube.com`;

  await sendEvolutionMessage(candidatePhone, welcomeMessage, true);
};