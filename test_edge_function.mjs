import fetch from 'node-fetch';

const url = 'https://iuklqyuqwrrniqtskfap.supabase.co/functions/v1/generate-content';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1a2xxeXVxd3JybmlxdHNrZmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjc5NTAsImV4cCI6MjA5MjgwMzk1MH0.T1M3hPYrBqI4tglRS0jQZeMNqkPlV09MvFGI-TRT4RU';

async function test() {
    try {
        console.log("Sending request to Edge Function...");
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`,
                'apikey': anonKey
            },
            body: JSON.stringify({ topic: 'kara delikler', model: 'gemini-1.5-flash' })
        });
        
        const status = res.status;
        const text = await res.text();
        
        console.log("Status:", status);
        console.log("Body:", text);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

test();
