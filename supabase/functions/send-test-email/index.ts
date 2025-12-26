
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import nodemailer from "npm:nodemailer"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar Preflight (CORS) obligatorio
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extraemos los nuevos campos (subject, message, html) del cuerpo de la petición
    const { to, config, subject, message, html } = await req.json()
    
    // Configurar transporte con Nodemailer
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true para 465, false para otros (como 587 con STARTTLS)
      auth: {
        user: config.user,
        pass: config.password,
      },
    })

    // Enviar el correo usando los datos recibidos o los de diagnóstico por defecto
    await transporter.sendMail({
      from: config.user,
      to: to,
      subject: subject || "Diagnóstico SMTP - GdA RRHH",
      text: message || "Si recibes este correo, tu configuración SMTP en GdA RRHH funciona correctamente utilizando Nodemailer.",
      html: html || (message ? message.replace(/\n/g, '<br>') : undefined)
    })

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (error) {
    console.error("Error en Edge Function:", error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message,
      details: error.toString() 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
