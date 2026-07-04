import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// LÜTFEN KENDİ SUPABASE BİLGİLERİNİZİ GİRİN
// Uygulamanız Supabase ortam değerleri atanana kadar "sample" modunda çalışacaktır.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://xxxxxxxx.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
