import { supabase } from '@/integrations/supabase/client';

interface InterviewEmailData {
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  jobLocation: string;
  interviewDate: Date;
  interviewTime: string; // "HH:MM"
  modality: 'virtual' | 'presencial';
  meetingLink?: string;
  address?: string;
}

function detectPlatform(meetingLink: string): string {
  if (meetingLink.includes('teams.microsoft.com')) return 'Teams';
  if (meetingLink.includes('zoom.us')) return 'Zoom';
  if (meetingLink.includes('meet.google.com')) return 'Google Meet';
  if (meetingLink.includes('webex.com')) return 'Webex';
  return 'Virtual';
}

function formatDayOfWeek(date: Date): string {
  const days = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];
  return days[date.getDay()];
}

function formatDateSpanish(date: Date): string {
  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];
  return `${date.getDate()} DE ${months[date.getMonth()]} DE ${date.getFullYear()}`;
}

function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour24 = parseInt(hours);
  const ampm = hour24 >= 12 ? 'P.M.' : 'A.M.';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export const sendInterviewEmail = async (data: InterviewEmailData): Promise<void> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not configured');

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  // Normalize meeting link: ensure it starts with https:// for virtual
  let meetingLink = data.meetingLink || '';
  if (meetingLink && !meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
    meetingLink = 'https://' + meetingLink;
  }

  const payload = {
    to: data.candidateEmail,
    candidateName: data.candidateName,
    jobTitle: data.jobTitle,
    jobLocation: data.jobLocation || '',
    dayOfWeek: formatDayOfWeek(data.interviewDate),
    date: formatDateSpanish(data.interviewDate),
    time: formatTime12h(data.interviewTime),
    modality: data.modality,
    meetingLink,
    address: data.address || '',
    platform: meetingLink ? detectPlatform(meetingLink) : 'Virtual',
  };

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send-interview-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    }
  );

  const responseData = await response.json();

  if (!response.ok || !responseData.success) {
    throw new Error(responseData.error || `HTTP ${response.status}: Failed to send email`);
  }

  console.log('Interview email sent successfully to', data.candidateEmail);
};

/**
 * Sends a status-change notification email using the Convertia branded template.
 * The messageBody is taken directly from the WhatsApp message for each state,
 * so content stays in sync automatically.
 */
export const sendStatusEmail = async (
  to: string,
  candidateName: string,
  jobTitle: string,
  subject: string,
  messageBody: string,
  ctaLink?: string,
  ctaLabel?: string,
): Promise<void> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) throw new Error('VITE_SUPABASE_URL is not configured');

  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const payload = {
    to,
    candidateName,
    jobTitle,
    jobLocation: '',
    dayOfWeek: '',
    date: '',
    time: '',
    modality: 'virtual' as const,
    meetingLink: '',
    address: '',
    platform: '',
    messageBody,
    subject,
    ...(ctaLink && { ctaLink }),
    ...(ctaLabel && { ctaLabel }),
  };

  const response = await fetch(
    `${supabaseUrl}/functions/v1/send-interview-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(payload),
    }
  );

  const responseData = await response.json();

  if (!response.ok || !responseData.success) {
    throw new Error(responseData.error || `HTTP ${response.status}: Failed to send email`);
  }

  console.log('Status email sent successfully to', to);
};
