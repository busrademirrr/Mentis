const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Hata: .env dosyasında Supabase bilgileri bulunamadı.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createData() {
    console.log("Kullanıcılar oluşturuluyor...");

    const usersToCreate = [
        { email: 'bilim_insani2@mentis.test', password: 'password123', username: 'bilim_uzmani', full_name: 'Dr. Bilim' },
        { email: 'felsefeci2@mentis.test', password: 'password123', username: 'sokrates_mirasi', full_name: 'Felsefe Uzmanı' },
        { email: 'tarihci2@mentis.test', password: 'password123', username: 'tarih_arsivi', full_name: 'Tarih Arşivi' }
    ];

    const createdUsers = [];

    for (const u of usersToCreate) {
        // Try to create the user
        const { data, error } = await supabase.auth.signUp({
            email: u.email,
            password: u.password,
            options: {
                data: {
                    username: u.username,
                    full_name: u.full_name
                }
            }
        });

        if (error) {
            console.log(`Kullanıcı oluşturulamadı veya zaten var (${u.email}):`, error.message);
            // Attempt to login if already exists
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: u.email,
                password: u.password
            });
            if (!signInError && signInData?.user) {
                createdUsers.push(signInData.user);
                console.log(`Giriş yapıldı: ${u.email}`);
            }
        } else if (data?.user) {
            createdUsers.push(data.user);
            console.log(`Kullanıcı oluşturuldu: ${u.email}`);
        }
    }

    if (createdUsers.length === 0) {
        console.error("Hiç kullanıcı oluşturulamadı veya giriş yapılamadı. Posts tablosuna yazar olmadan devam ediliyor...");
    }

    const bilimUser = createdUsers.find(u => u.email === 'bilim_insani2@mentis.test') || createdUsers[0] || {};
    const felsefeUser = createdUsers.find(u => u.email === 'felsefeci2@mentis.test') || createdUsers[0] || {};
    const tarihUser = createdUsers.find(u => u.email === 'tarihci2@mentis.test') || createdUsers[0] || {};

    const posts = [
        // BİLİM - Bilgi Kartı
        {
            type: 'article',
            category: 'Bilim',
            title: 'Kuantum Dolanıklık Nedir?',
            content: 'Kuantum dolanıklık, iki veya daha fazla kuantum parçacığının, aralarındaki mesafe ne olursa olsun birbirlerinin durumlarını anında etkileyecek şekilde birbirine bağlı olması durumudur. Einstein bunu "uzaktan ürkütücü eylem" olarak adlandırmıştı.',
            short_description: 'Einstein\'ın "uzaktan ürkütücü eylem" dediği kuantum fenomeni.',
            author_id: bilimUser.id || null,
            is_premium: false,
            payload: {
                tags: ['Kuantum', 'Fizik']
            }
        },
        // BİLİM - Quiz
        {
            type: 'quiz',
            category: 'Bilim',
            title: 'Güneş Sistemi Quiz',
            content: 'Güneş sistemi hakkında temel bilginizi ölçün.',
            short_description: 'Gezegenleri ne kadar iyi tanıyorsunuz?',
            author_id: bilimUser.id || null,
            is_premium: false,
            payload: {
                question: 'Güneş sistemindeki en büyük gezegen hangisidir?',
                options: ['Mars', 'Venüs', 'Jüpiter', 'Satürn'],
                correct_answer: 2,
                difficulty: 'Kolay',
                xp_reward: 20
            }
        },
        // BİLİM - Tartışma
        {
            type: 'discussion',
            category: 'Bilim',
            title: 'Yapay Zeka İnsanlığı Geçer Mi?',
            content: 'Yapay zekanın gelişimi insanlığın sonunu mu getirecek, yoksa bizi bir üst seviyeye mi taşıyacak?',
            short_description: 'Yapay zekanın geleceği hakkında ne düşünüyorsunuz?',
            author_id: bilimUser.id || null,
            is_premium: false,
            payload: {
                title: 'Yapay Zeka Tehdit mi, Fırsat mı?',
                content_snippet: 'YZ gelişimi sınırlandırılmalı mı?',
                side_a: 'Büyük Bir Tehdit',
                side_b: 'İnsanlık İçin Fırsat',
                votes_A: 150,
                votes_B: 300
            }
        },

        // FELSEFE - Bilgi Kartı
        {
            type: 'article',
            category: 'Felsefe',
            title: 'Mağara Alegorisi',
            content: 'Platon\'un Mağara Alegorisi, insanların gerçeği değil, gerçeğin gölgelerini algıladığını savunan meşhur bir düşünce deneyidir. İnsanlar bir mağaraya zincirlenmiştir ve sadece duvara yansıyan gölgeleri görürler.',
            short_description: 'Gerçekliği nasıl algılıyoruz? Platon\'un meşhur alegorisi.',
            author_id: felsefeUser.id || null,
            is_premium: false,
            payload: {
                tags: ['Platon', 'Gerçeklik']
            }
        },
        // FELSEFE - Quiz
        {
            type: 'quiz',
            category: 'Felsefe',
            title: 'Filozofları Eşleştir',
            content: 'Ünlü sözleri hangi filozofların söylediğini bulun.',
            short_description: 'Felsefe bilginizi test edin.',
            author_id: felsefeUser.id || null,
            is_premium: false,
            payload: {
                question: '"Düşünüyorum, öyleyse varım" sözü kime aittir?',
                options: ['Sokrates', 'Aristoteles', 'Descartes', 'Kant'],
                correct_answer: 2,
                difficulty: 'Orta',
                xp_reward: 30
            }
        },

        // TARİH - Tartışma
        {
            type: 'discussion',
            category: 'Tarih',
            title: 'Endüstri Devrimi: İlerleme mi, Çöküş mü?',
            content: 'Endüstri Devrimi insanlığa büyük teknolojik ilerlemeler getirdi ancak çevre kirliliği ve işçi sömürüsünü de başlattı.',
            short_description: 'Endüstri Devrimi nin bedeli ne oldu?',
            author_id: tarihUser.id || null,
            is_premium: false,
            payload: {
                title: 'Endüstri Devriminin Etkileri',
                content_snippet: 'Teknolojik ilerleme mi daha ağır basar, yoksa yarattığı yıkım mı?',
                side_a: 'Büyük İlerleme',
                side_b: 'Doğanın Çöküşü',
                votes_A: 400,
                votes_B: 250
            }
        }
    ];

    console.log("İçerikler ekleniyor...");
    for (const post of posts) {
        if (!post.author_id) delete post.author_id; // Remove if null to avoid FK constraint error if not supported
        
        const { error } = await supabase.from('posts').insert(post);
        if (error) {
            console.error(`Hata (${post.title}):`, error.message);
        } else {
            console.log(`Eklendi: [${post.category}] ${post.title}`);
        }
    }

    console.log("İşlem tamamlandı! Feed sayfasını yenileyerek içerikleri görebilirsiniz.");
}

createData();
