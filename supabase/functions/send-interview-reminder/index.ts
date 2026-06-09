// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.7"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Colombia timezone offset: UTC-5
const COLOMBIA_OFFSET_MS = -5 * 60 * 60 * 1000

function getNowColombia(): Date {
  const now = new Date()
  return new Date(now.getTime() + COLOMBIA_OFFSET_MS)
}

function buildReminderHtml(params: {
  candidateName: string
  jobTitle: string
  jobLocation: string
  dayOfWeek: string
  date: string
  time: string
  minutesLeft: number
  modality: string
  meetingLink: string
  address: string
  platform: string
}): string {
  const { candidateName, jobTitle, jobLocation, dayOfWeek, date, time, minutesLeft, modality, meetingLink, address, platform } = params
  const isPresencial = modality === 'presencial'

  const ctaSection = isPresencial
    ? `<p style="font-size:15px;margin:0 0 8px;">&#128205; <strong>Direcci&oacute;n:</strong></p>
       <table width="100%" cellpadding="0" cellspacing="0"><tr>
         <td align="center" style="padding:8px 0 32px;">
           <div style="background-color:#1a3a2a;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 32px;border-radius:30px;display:inline-block;">
             &#128205; ${address}
           </div>
         </td>
       </tr></table>`
    : `<p style="font-size:15px;margin:0 0 8px;">&#128421; <strong>Plataforma:</strong> ${platform}</p>
       <p style="font-size:15px;margin:0 0 20px;">&#128073; Haz click en el bot&oacute;n para unirte:</p>
       <table width="100%" cellpadding="0" cellspacing="0"><tr>
         <td align="center" style="padding:8px 0 24px;">
           <a href="${meetingLink}" target="_blank"
              style="background-color:#1a3a2a;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none;padding:14px 48px;border-radius:30px;display:inline-block;">
             Unirse a la entrevista
           </a>
         </td>
       </tr></table>
       <p style="font-size:12px;color:#888888;text-align:center;margin:-12px 0 24px;">
         O copia: <a href="${meetingLink}" style="color:#1a3a2a;word-break:break-all;">${meetingLink}</a>
       </p>`

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Recordatorio de Entrevista - Convertia</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background-color:#0f1923;padding:32px 40px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>
            <div style="background-color:#1a2c3d;border-radius:20px;padding:6px 14px;display:inline-block;margin-bottom:20px;">
              <span style="color:#4ade80;font-size:10px;font-weight:bold;">&#9675;</span>
              <span style="color:#ffffff;font-size:14px;font-weight:bold;margin-left:6px;">convertia</span>
            </div>
            <br>
            <!-- Alert badge -->
            <div style="background-color:#d97706;border-radius:20px;padding:6px 16px;display:inline-block;margin-bottom:12px;">
              <span style="color:#ffffff;font-size:13px;font-weight:bold;">
                &#9203; Recordatorio — faltan ${minutesLeft} minutos
              </span>
            </div>
            <br>
            <p style="color:#ffffff;font-size:24px;font-weight:bold;margin:8px 0 0;line-height:1.2;">Tu entrevista es</p>
            <p style="color:#ffffff;font-size:24px;font-weight:bold;margin:4px 0 0;">muy pronto</p>
          </td>
          <td style="text-align:right;vertical-align:top;width:100px;">
            <div style="width:80px;height:80px;border:2px solid #d97706;border-radius:50%;display:inline-block;opacity:0.6;margin-top:8px;"></div>
          </td>
        </tr></table>
      </td></tr>

      <!-- BODY -->
      <tr><td style="padding:32px 40px;color:#1a1a1a;">

        <p style="font-size:16px;margin:0 0 16px;">&#9203;&#128293; <strong>&iexcl;Hola, ${candidateName}!</strong></p>

        <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
          Te recordamos que en <strong>${minutesLeft} minutos</strong> tienes tu entrevista ${isPresencial ? 'presencial' : 'virtual'}
          para el puesto de <strong>${jobTitle}${jobLocation ? ` - ${jobLocation}` : ''}</strong>.
        </p>

        <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
          &#128197; <strong>${dayOfWeek}, ${date} a las &#128336; ${time}</strong>
        </p>

        ${isPresencial
          ? `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
               Aseg&uacute;rate de llegar a tiempo y lucir genial. &#128165;
             </p>`
          : `<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
               Aseg&uacute;rate de tener la c&aacute;mara &#128247; y micr&oacute;fono &#127908; listos.
               &iexcl;Con&eacute;ctate con toda tu buena energ&iacute;a! &#128165;
             </p>`
        }

        ${ctaSection}

        <p style="font-size:15px;text-align:center;font-weight:bold;margin:0;">
          &iexcl;&Eacute;xito en tu entrevista! &#127881;
        </p>

      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background-color:#0f1923;padding:24px 40px;text-align:center;">
        <div style="background-color:#1a2c3d;border-radius:20px;padding:6px 14px;display:inline-block;margin-bottom:10px;">
          <span style="color:#4ade80;font-size:10px;font-weight:bold;">&#9675;</span>
          <span style="color:#ffffff;font-size:14px;font-weight:bold;margin-left:6px;">convertia</span>
        </div>
        <p style="color:#cccccc;font-size:13px;margin:0 0 8px;">El equipo de Reclutamiento &amp; Selecci&oacute;n</p>
        <p style="color:#888888;font-size:11px;margin:0;">&copy;2025. Intelligent Customer Acquisition, S.L.</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const smtpHost = Deno.env.get('SMTP_HOST') || 'email-smtp.us-east-1.amazonaws.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587')
    const smtpUser = Deno.env.get('SMTP_USER')!
    const smtpPass = Deno.env.get('SMTP_PASS')!
    const smtpFrom = Deno.env.get('SMTP_FROM') || 'reclutamiento@convertia.dev'

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP_USER and SMTP_PASS not configured')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Current time in Colombia (UTC-5)
    const nowColombia = getNowColombia()
    const todayStr = nowColombia.toISOString().split('T')[0] // YYYY-MM-DD
    const nowMinutes = nowColombia.getUTCHours() * 60 + nowColombia.getUTCMinutes()

    console.log(`Running reminder check — Colombia time: ${nowColombia.toISOString().slice(11, 16)} | Total minutes from midnight: ${nowMinutes}`)

    // Fetch all RC interviews scheduled for today that haven't been fully reminded
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        meeting_date,
        meeting_time,
        meeting_link,
        meeting_modality,
        meeting_address,
        reminder_30_sent_at,
        reminder_15_sent_at,
        candidates (
          email,
          first_name,
          last_name,
          location
        ),
        jobs (
          title
        )
      `)
      .eq('status', 'entrevista-rc')
      .eq('meeting_date', todayStr)
      .not('meeting_time', 'is', null)
      .not('candidates.email', 'is', null)

    if (error) throw new Error(`DB query error: ${error.message}`)
    if (!applications || applications.length === 0) {
      console.log('No RC interviews scheduled for today')
      return new Response(JSON.stringify({ success: true, processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost, port: smtpPort, secure: false,
      auth: { user: smtpUser, pass: smtpPass },
      requireTLS: true,
    })

    const dayNames = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO']
    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

    let sent = 0

    for (const app of applications) {
      const candidate = Array.isArray(app.candidates) ? app.candidates[0] : app.candidates
      const job = Array.isArray(app.jobs) ? app.jobs[0] : app.jobs

      if (!candidate?.email) continue

      // Parse meeting time — format is "HH:MM:SS" or "HH:MM"
      const timeParts = (app.meeting_time as string).split(':')
      const meetingHour = parseInt(timeParts[0])
      const meetingMinute = parseInt(timeParts[1])
      const meetingTotalMinutes = meetingHour * 60 + meetingMinute

      const minutesUntilMeeting = meetingTotalMinutes - nowMinutes

      console.log(`App ${app.id} — meeting at ${app.meeting_time}, minutes until: ${minutesUntilMeeting}`)

      // Format display values
      const meetingDate = new Date(app.meeting_date as string + 'T12:00:00Z')
      const dayOfWeek = dayNames[meetingDate.getUTCDay()]
      const dateStr = `${meetingDate.getUTCDate()} DE ${monthNames[meetingDate.getUTCMonth()]} DE ${meetingDate.getUTCFullYear()}`
      const hour12 = meetingHour % 12 || 12
      const ampm = meetingHour >= 12 ? 'P.M.' : 'A.M.'
      const timeStr = `${hour12}:${String(meetingMinute).padStart(2, '0')} ${ampm}`

      const modality = (app.meeting_modality as string) || 'virtual'
      const meetingLink = (app.meeting_link as string) || ''
      const address = (app.meeting_address as string) || ''

      let platformRaw = meetingLink.toLowerCase()
      const platform = platformRaw.includes('teams') ? 'Teams'
        : platformRaw.includes('zoom') ? 'Zoom'
        : platformRaw.includes('meet.google') ? 'Google Meet'
        : 'Virtual'

      const candidateName = `${candidate.first_name} ${candidate.last_name}`
      const jobTitle = job?.title || 'la vacante'
      const jobLocation = candidate.location || ''

      // --- 30-minute reminder: window 28–32 min ---
      if (minutesUntilMeeting >= 28 && minutesUntilMeeting <= 32 && !app.reminder_30_sent_at) {
        try {
          const html = buildReminderHtml({ candidateName, jobTitle, jobLocation, dayOfWeek, date: dateStr, time: timeStr, minutesLeft: 30, modality, meetingLink, address, platform })
          await transporter.sendMail({
            from: `"Reclutamiento Convertia" <${smtpFrom}>`,
            to: candidate.email,
            subject: `⏰ Recordatorio: Tu entrevista es en 30 minutos — ${jobTitle}`,
            html,
          })
          await supabase.from('applications').update({ reminder_30_sent_at: new Date().toISOString() }).eq('id', app.id)
          console.log(`30-min reminder sent to ${candidate.email}`)
          sent++
        } catch (e) {
          console.error(`Failed 30-min reminder for ${candidate.email}:`, e)
        }
      }

      // --- 15-minute reminder: window 13–17 min ---
      if (minutesUntilMeeting >= 13 && minutesUntilMeeting <= 17 && !app.reminder_15_sent_at) {
        try {
          const html = buildReminderHtml({ candidateName, jobTitle, jobLocation, dayOfWeek, date: dateStr, time: timeStr, minutesLeft: 15, modality, meetingLink, address, platform })
          await transporter.sendMail({
            from: `"Reclutamiento Convertia" <${smtpFrom}>`,
            to: candidate.email,
            subject: `⏰ Recordatorio: Tu entrevista es en 15 minutos — ${jobTitle}`,
            html,
          })
          await supabase.from('applications').update({ reminder_15_sent_at: new Date().toISOString() }).eq('id', app.id)
          console.log(`15-min reminder sent to ${candidate.email}`)
          sent++
        } catch (e) {
          console.error(`Failed 15-min reminder for ${candidate.email}:`, e)
        }
      }
    }

    console.log(`Done — sent ${sent} reminder(s)`)
    return new Response(JSON.stringify({ success: true, processed: applications.length, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in send-interview-reminder:', error)
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
