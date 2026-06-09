// @ts-ignore - Deno import for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface InterviewEmailPayload {
  to: string;
  candidateName: string;
  jobTitle: string;
  jobLocation: string;
  dayOfWeek: string;
  date: string;
  time: string;
  modality: 'virtual' | 'presencial';
  meetingLink: string;
  address: string;
  platform: string;
  // Optional: when set, replaces the structured interview body with plain text (e.g. WhatsApp message)
  messageBody?: string;
  subject?: string;
  // Optional: CTA button rendered below the message body
  ctaLink?: string;
  ctaLabel?: string;
}

function buildGenericEmailHtml(candidateName: string, messageBody: string, ctaLink?: string, ctaLabel?: string): string {
  // Escape HTML special chars and convert newlines to <br>
  const escaped = messageBody
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    // Convert URLs to clickable links (after HTML escaping)
    .replace(/(https?:\/\/[^\s<"]+)/g, '<a href="$1" style="color:#1a3a2a;word-break:break-all;" target="_blank">$1</a>')
    .replace(/\n/g, '<br>');

  const ctaSection = ctaLink
    ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td align="center">
                    <a href="${ctaLink}"
                       target="_blank"
                       style="background-color:#1a3a2a;color:#ffffff;font-size:18px;font-weight:bold;text-decoration:none;padding:14px 48px;border-radius:30px;display:inline-block;letter-spacing:0.5px;">
                      ${ctaLabel || 'Unirse a la reuni&oacute;n'}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#888888;text-align:center;margin:-8px 0 16px;">
                O copia este enlace en tu navegador:<br>
                <a href="${ctaLink}" style="color:#1a3a2a;word-break:break-all;">${ctaLink}</a>
              </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificaci&oacute;n - Convertia</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0f1923;padding:40px 40px 30px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#1a2c3d;border-radius:20px;padding:6px 14px;">
                          <span style="color:#4ade80;font-size:10px;font-weight:bold;letter-spacing:1px;">&#9675;</span>
                          <span style="color:#ffffff;font-size:14px;font-weight:bold;margin-left:6px;">convertia</span>
                        </td>
                      </tr>
                    </table>
                    <br><br>
                    <p style="color:#ffffff;font-size:28px;font-weight:bold;margin:0;line-height:1.2;">Reclutamiento</p>
                    <p style="color:#ffffff;font-size:28px;font-weight:bold;margin:4px 0 0;">y selecci&oacute;n</p>
                  </td>
                  <td style="text-align:right;vertical-align:top;width:120px;">
                    <div style="width:90px;height:90px;border:2px solid #4ade80;border-radius:50%;display:inline-block;opacity:0.5;margin-top:8px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;color:#1a1a1a;">
              <p style="font-size:16px;margin:0 0 24px;">&#128075;&#10024; <strong>&iexcl;Hola, ${candidateName}!</strong></p>
              <div style="font-size:15px;line-height:1.8;margin:0;">${escaped}</div>
              ${ctaSection}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0f1923;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="background-color:#1a2c3d;border-radius:20px;padding:6px 14px;">
                    <span style="color:#4ade80;font-size:10px;font-weight:bold;">&#9675;</span>
                    <span style="color:#ffffff;font-size:14px;font-weight:bold;margin-left:6px;">convertia</span>
                  </td>
                </tr>
              </table>
              <p style="color:#cccccc;font-size:13px;margin:0 0 16px;">El equipo de Reclutamiento &amp; Selecci&oacute;n</p>
              <p style="color:#888888;font-size:11px;margin:0;">
                &copy;2025. Intelligent Customer Acquisition, S.L.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailHtml(payload: InterviewEmailPayload): string {
  const { candidateName, jobTitle, jobLocation, dayOfWeek, date, time, modality, meetingLink, address, platform } = payload;

  const isPresencial = modality === 'presencial';

  // CTA section: button with link (virtual) or address block (presencial)
  const ctaSection = isPresencial
    ? `
              <p style="font-size:15px;margin:0 0 8px;">
                &#128205; <strong>Direcci&oacute;n:</strong>
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <div style="background-color:#1a3a2a;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 32px;border-radius:30px;display:inline-block;letter-spacing:0.5px;">
                      &#128205; ${address}
                    </div>
                  </td>
                </tr>
              </table>`
    : `
              <p style="font-size:15px;margin:0 0 8px;">
                &#128205; <strong>Plataforma de Entrevista:</strong> ${platform}
              </p>
              <p style="font-size:15px;margin:0 0 24px;">
                &#128073; Dale click en el bot&oacute;n para unirte a la entrevista:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${meetingLink}"
                       target="_blank"
                       style="background-color:#1a3a2a;color:#ffffff;font-size:18px;font-weight:bold;text-decoration:none;padding:14px 48px;border-radius:30px;display:inline-block;letter-spacing:0.5px;mso-padding-alt:14px 48px;">
                      Unirse a la entrevista
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#888888;text-align:center;margin:-16px 0 24px;">
                O copia este enlace en tu navegador:<br>
                <a href="${meetingLink}" style="color:#1a3a2a;word-break:break-all;">${meetingLink}</a>
              </p>`;

  // Body instructions vary by modality
  const modalityNote = isPresencial
    ? `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                Aseg&uacute;rate de lucir genial. &iexcl;Llega con toda tu buena energ&iacute;a! &#128165;
              </p>`
    : `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                Aseg&uacute;rate de tener la c&aacute;mara encendida &#128247;, micr&oacute;fono &#127908; y de lucir genial.
                &iexcl;Con&eacute;ctate con toda tu buena energ&iacute;a! &#128165;
              </p>
              <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong>NOTA:</strong> NO es necesario que ingreses desde tu correo, solo con tu nombre.
              </p>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a Entrevista - Convertia</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#0f1923;padding:40px 40px 30px;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:top;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#1a2c3d;border-radius:20px;padding:6px 14px;">
                          <span style="color:#4ade80;font-size:10px;font-weight:bold;letter-spacing:1px;">&#9675;</span>
                          <span style="color:#ffffff;font-size:14px;font-weight:bold;margin-left:6px;">convertia</span>
                        </td>
                      </tr>
                    </table>
                    <br><br>
                    <p style="color:#ffffff;font-size:28px;font-weight:bold;margin:0;line-height:1.2;">Reclutamiento</p>
                    <p style="color:#ffffff;font-size:28px;font-weight:bold;margin:4px 0 0;">y selecci&oacute;n</p>
                  </td>
                  <td style="text-align:right;vertical-align:top;width:120px;">
                    <div style="width:90px;height:90px;border:2px solid #4ade80;border-radius:50%;display:inline-block;opacity:0.5;margin-top:8px;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:32px 40px;color:#1a1a1a;">

              <p style="font-size:16px;margin:0 0 16px;">&#128075;&#10024; <strong>&iexcl;Hola, ${candidateName}!</strong></p>

              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                Estamos emocionados de invitarte a una entrevista ${isPresencial ? 'presencial' : 'virtual'} para el puesto de
                <strong>${jobTitle}${jobLocation ? ` - ${jobLocation}` : ''}</strong>.
              </p>

              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                &iexcl;Una nueva oportunidad de trabajo que podr&iacute;a ser el comienzo de una etapa maravillosa en tu carrera!
              </p>

              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                La cita es <strong>&iexcl;${dayOfWeek}, ${date} a las &#128336; ${time}</strong>
              </p>

              <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
                &iexcl;Estamos deseando conocerte!
              </p>

              ${modalityNote}

              ${ctaSection}

              <p style="font-size:15px;text-align:center;margin:0 0 4px;">&iexcl;Nos vemos pronto!</p>
              <p style="font-size:15px;text-align:center;font-weight:bold;margin:0;">
                Confirma tu asistencia respondiendo a este correo
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#0f1923;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                <tr>
                  <td style="background-color:#1a2c3d;border-radius:20px;padding:6px 14px;">
                    <span style="color:#4ade80;font-size:10px;font-weight:bold;">&#9675;</span>
                    <span style="color:#ffffff;font-size:14px;font-weight:bold;margin-left:6px;">convertia</span>
                  </td>
                </tr>
              </table>
              <p style="color:#cccccc;font-size:13px;margin:0 0 16px;">El equipo de Reclutamiento &amp; Selecci&oacute;n</p>
              <p style="color:#888888;font-size:11px;margin:0;">
                &copy;2025. Intelligent Customer Acquisition, S.L.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const smtpHost = Deno.env.get('SMTP_HOST') || 'email-smtp.us-east-1.amazonaws.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const smtpFrom = Deno.env.get('SMTP_FROM') || 'reclutamiento@convertia.dev'

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP_USER and SMTP_PASS must be configured in Supabase secrets')
    }

    const payload: InterviewEmailPayload = await req.json()
    const { to, candidateName, jobTitle } = payload

    if (!to || !candidateName || !jobTitle) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, candidateName, jobTitle' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      requireTLS: true,
    })

    const html = payload.messageBody
      ? buildGenericEmailHtml(candidateName, payload.messageBody, payload.ctaLink, payload.ctaLabel)
      : buildEmailHtml(payload)
    const subjectType = payload.modality === 'presencial' ? 'Presencial' : 'Virtual'

    const emailSubject = payload.subject || `Invitación a Entrevista ${subjectType} - ${jobTitle}`

    const info = await transporter.sendMail({
      from: `"Reclutamiento Convertia" <${smtpFrom}>`,
      to,
      subject: emailSubject,
      html,
    })

    console.log('Email sent:', info.messageId, '→', to)

    return new Response(
      JSON.stringify({ success: true, messageId: info.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
