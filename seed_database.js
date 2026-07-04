// seed_database.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Hata: .env dosyasında Supabase bilgileri bulunamadı.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const MOCK_USER_ID = '11111111-1111-1111-1111-111111111111';

const MOCK_POSTS = [
    // FELSEFE
    {
        type: 'hero',
        category: 'Felsefe',
        title: 'Nietzsche ve Üstinsan',
        content: 'Nietzsche, insanın aşılması gereken bir köprü olduğunu söyler. Peki gerçekten bir üstinsan yaratmak mümkün mü?',
        short_description: 'Nietzsche nin Übermensch kavramı günümüzde ne ifade ediyor?',
        is_premium: false,
        is_featured: true,
        payload: {
            author: { name: 'Friedrich Nietzsche', role: 'Filozof' },
            tags: ['Nihilizm', 'Varoluşçuluk'],
            image_url: 'https://images.unsplash.com/photo-1601004456950-8b1e4a3b7d1e?q=80&w=600&auto=format&fit=crop'
        }
    },
    {
        type: 'quiz',
        category: 'Felsefe',
        title: 'Stoacılık Testi',
        content: 'Epiktetos un temel görüşü nedir?',
        is_premium: false,
        payload: {
            question: 'Stoacı felsefeye göre insanın asıl amacı nedir?',
            options: ['Mutluluk', 'Erdem', 'Zenginlik', 'Güç'],
            correct_answer: 1,
            difficulty: 'Orta',
            xp_reward: 50
        }
    },
    {
        type: 'discussion',
        category: 'Felsefe',
        title: 'Özgür İrade Yanılsama mı?',
        content: 'Nörobilim ve determinizm karşısında özgür irade.',
        is_premium: false,
        payload: {
            title: 'Özgür İrade vs Determinizm',
            content_snippet: 'Kararlarımızı gerçekten biz mi alıyoruz yoksa evrensel neden sonuç zincirinin bir parçası mıyız?',
            side_a: 'Özgür İrade',
            side_b: 'Determinizm',
            votes_A: 120,
            votes_B: 240
        }
    },

    // TARİH
    {
        type: 'hero',
        category: 'Tarih',
        title: 'Roma nın Çöküşü',
        content: 'Roma İmparatorluğu neden ikiye bölündü ve Batı Roma neden yıkıldı?',
        short_description: 'Dünya tarihinin en büyük çöküşünün anatomisi.',
        is_premium: true,
        is_featured: false,
        payload: {
            author: { name: 'Tarih Arşivi', role: 'Kurum' },
            tags: ['Antik Roma', 'İmparatorluk'],
            image_url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=600&auto=format&fit=crop'
        }
    },
    {
        type: 'quiz',
        category: 'Tarih',
        title: 'Rönesans Nerede Başladı?',
        content: 'Rönesans hangi İtalyan şehrinde doğmuştur?',
        is_premium: false,
        payload: {
            question: 'Rönesans ın doğduğu kabul edilen İtalyan şehri hangisidir?',
            options: ['Roma', 'Venedik', 'Floransa', 'Milano'],
            correct_answer: 2,
            difficulty: 'Kolay',
            xp_reward: 20
        }
    },
    {
        type: 'discussion',
        category: 'Tarih',
        title: 'Tarihi Kim Yazar?',
        content: 'Tarih gerçekten kazananlar tarafından mı yazılır?',
        is_premium: false,
        payload: {
            title: 'Tarihyazımı',
            content_snippet: 'Resmi tarih mi yalan söyler, yoksa sözlü tarih mi abartır?',
            side_a: 'Kazananlar Yazar',
            side_b: 'Objektif Yazılabilir',
            votes_A: 500,
            votes_B: 120
        }
    },

    // SANAT
    {
        type: 'hero',
        category: 'Sanat',
        title: 'Sürrealizm ve Dalí',
        content: 'Bilinçaltının sanatla buluştuğu nokta: Sürrealizm.',
        short_description: 'Salvador Dalí nin Eriyen Saatleri ne anlatıyor?',
        is_premium: false,
        is_featured: false,
        payload: {
            author: { name: 'Sanat Dünyası', role: 'Dergi' },
            tags: ['Sürrealizm', 'Dalí'],
            image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop'
        }
    },
    {
        type: 'quiz',
        category: 'Sanat',
        title: 'Renk Teorisi',
        content: 'Ara renkler nasıl oluşur?',
        is_premium: false,
        payload: {
            question: 'Sarı ve Mavi renk karıştırılırsa hangi renk elde edilir?',
            options: ['Mor', 'Yeşil', 'Turuncu', 'Kahverengi'],
            correct_answer: 1,
            difficulty: 'Kolay',
            xp_reward: 10
        }
    },
    {
        type: 'discussion',
        category: 'Sanat',
        title: 'Sanat Toplum İçin mi?',
        content: 'Ebedi tartışma: Sanat sanat için midir, yoksa toplum için mi?',
        is_premium: false,
        payload: {
            title: 'Sanatın Amacı',
            content_snippet: 'Bir sanat eseri mutlaka toplumsal bir mesaj vermeli midir?',
            side_a: 'Sanat İçindir',
            side_b: 'Toplum İçindir',
            votes_A: 340,
            votes_B: 350
        }
    }
];

async function seedDatabase() {
    console.log("Veritabanına veriler ekleniyor...");
    
    for (const post of MOCK_POSTS) {
        const { error } = await supabase.from('posts').insert(post);
        if (error) {
            console.error("Hata oluştu:", error.message);
            if (error.code === 'PGRST205') {
                console.error("LÜTFEN ÖNCE SUPABASE PANELİNDEN 'supabase_schema.sql' DOSYASINDAKİ KODLARI ÇALIŞTIRARAK TABLOLARI OLUŞTURUN.");
                process.exit(1);
            }
        } else {
            console.log(`Eklendi: [${post.category}] ${post.title}`);
        }
    }
    
    console.log("İşlem tamamlandı!");
}

seedDatabase();
