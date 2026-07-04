require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const fs = require('fs');
const envFile = fs.readFileSync('.env', 'utf8');
const supabaseUrl = envFile.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const supabase = createClient(supabaseUrl, supabaseKey);

async function trigger() {
    // 1. Get the current user (the one who is logged in - we'll just get the most recently active user or we can get all users)
    const { data: users } = await supabase.from('users').select('*').limit(2);
    
    if (!users || users.length === 0) {
        console.log("No users found in database.");
        return;
    }

    // Assuming the first user is the one we want to notify (the logged in user is usually the primary one testing)
    // Or we just insert it for EVERY user so they definitely see it!
    
    for (const u of users) {
        let actorId = users.length > 1 && users[0].id !== u.id ? users[0].id : null;
        if (!actorId && users.length > 1) actorId = users[1].id;
        
        await supabase.from('notifications').insert({
            user_id: u.id,
            actor_id: actorId, // someone else, or null
            type: 'follow',
            title: 'Socrates seni takip etmeye başladı!',
            body: 'Artık düellolarda ve paylaşımlarda bağlantıdasınız.',
            is_read: false
        });
        
        await supabase.from('notifications').insert({
            user_id: u.id,
            actor_id: actorId,
            type: 'message',
            title: 'Yeni bir mesajın var',
            body: 'Merhaba, bugün nasılsın?',
            is_read: false
        });
        
        await supabase.from('notifications').insert({
            user_id: u.id,
            type: 'achievement',
            title: 'İlk zafer!',
            body: 'Arenadaki ilk düellonu kazandın ve 50XP kazandın.',
            is_read: false
        });
    }

    console.log("Test notifications inserted!");
}

trigger();
