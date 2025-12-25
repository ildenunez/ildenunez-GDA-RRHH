
import { createClient } from '@supabase/supabase-js';

// Credenciales del proyecto Supabase "ktfuhmbludjoqakjhyoo"
const SUPABASE_URL = 'https://ktfuhmbludjoqakjhyoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0ZnVobWJsdWRqb3Fha2poeW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMDA3MDIsImV4cCI6MjA4MDU3NjcwMn0.4k0dhGqN86MJqedRZ3yebKube14S-qvQHm8jOyH_FGM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SCRIPT SQL CORREGIDO PARA ACTUALIZAR LA BASE DE DATOS (Ejecutar en Supabase SQL Editor):
 * 
 * -- 1. Tabla para configuraciones globales
 * CREATE TABLE IF NOT EXISTS settings (
 *     key TEXT PRIMARY KEY,
 *     value JSONB NOT NULL,
 *     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
 * );
 * 
 * -- 2. Tabla para Anuncios/Noticias
 * -- Nota: Usamos TEXT para los IDs porque el sistema usa crypto.randomUUID() desde el frontend
 * -- y la tabla de usuarios existente usa TEXT para su columna ID.
 * CREATE TABLE IF NOT EXISTS news (
 *     id TEXT PRIMARY KEY,
 *     title TEXT NOT NULL,
 *     content TEXT NOT NULL,
 *     author_id TEXT REFERENCES users(id),
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *     publish_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
 *     pinned BOOLEAN DEFAULT FALSE
 * );
 * 
 * -- 3. Actualizar tabla de usuarios (Añadir birthdate si no existe)
 * ALTER TABLE users ADD COLUMN IF NOT EXISTS birthdate DATE;
 * 
 * -- 4. Asegurar columnas de control en solicitudes
 * ALTER TABLE requests 
 * ADD COLUMN IF NOT EXISTS is_justified BOOLEAN DEFAULT FALSE,
 * ADD COLUMN IF NOT EXISTS reported_to_admin BOOLEAN DEFAULT FALSE,
 * ADD COLUMN IF NOT EXISTS is_consumed BOOLEAN DEFAULT FALSE,
 * ADD COLUMN IF NOT EXISTS consumed_hours FLOAT DEFAULT 0,
 * ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE,
 * ADD COLUMN IF NOT EXISTS admin_comment TEXT;
 */
