import { createClient } from '@supabase/supabase-js';

// Ces identifiants sont publics par conception (protégés par les règles de sécurité
// "Row Level Security" définies côté base de données) : ce n'est pas un problème
// qu'ils soient visibles dans le code.
const SUPABASE_URL = 'https://gjzuplnbhragllsxjtxl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vvCXkmwjdcO5io4AeAEorA_3P8DwT2Z';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
