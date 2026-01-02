
import { createClient } from '@supabase/supabase-js';

// Credenciales del proyecto Supabase "ktfuhmbludjoqakjhyoo"
const SUPABASE_URL = 'https://ktfuhmbludjoqakjhyoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZnVobWJsdWRqb3Fha2poeW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDA3MDIsImV4cCI6MjA4MDU3NjcwMn0.4k0dhGqN86MJqedRZ3yebKube14S-qvQHm8jOyH_FGM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * --------------------------------------------------------------------------
 * SENTENCIA DE REPARACIÓN (EJECUTAR EN SQL EDITOR DE SUPABASE):
 * --------------------------------------------------------------------------
 * 
 * -- 1. Restamos los 31 días que se sumaron de más a todos los empleados
 * UPDATE users SET days_available = days_available - 31;
 * 
 * -- 2. Borramos los registros del reinicio mal ejecutado para limpiar el historial
 * --    (Ajustamos por el campo reason que es el identificador único de este proceso)
 * DELETE FROM requests 
 * WHERE reason = 'Carga inicial Vacaciones año 2026';
 * 
 */
