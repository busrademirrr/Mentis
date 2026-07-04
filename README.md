<div align="center">
  <img src="https://raw.githubusercontent.com/busrademirrr/Mentis/main/MentisApp/assets/icon.png" width="120" height="120" alt="Mentis Logo">
  <h1>Mentis - Günlük 5 Dakikalık Kültür Platformu</h1>
  
  <p>
    <b>Entelektüel gelişimi oyunlaştıran, modern sosyal kültür ve bilgi paylaşım platformu.</b>
  </p>

  <div>
    <img src="https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" />
    <img src="https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  </div>
</div>

<br />

## 🌟 Proje Hakkında

Mentis, kullanıcıların günde sadece 5 dakikada genel kültürünü geliştirebileceği, okudukları kısa "Bilgi Kartları" ile quizler çözerek hem öğrenmelerini hem de eğlenmelerini sağlayan modern bir sosyal medya uygulamasıdır. 

Eski versiyondaki (Flutter/Firebase) monolitik yapıdan kurtulup, yepyeni bir teknoloji yığınıyla (**React Native & Supabase**) baştan aşağı, performans odaklı ve "Product-Level" kalite standartlarında yeniden yazılmıştır.

## ✨ Temel Özellikler

- **🧠 Bilgi Kartları (Knowledge Cards):** Tarih, mitoloji, felsefe, bilim gibi alanlarda her gün yenilenen, 5 dakikada okunabilen yoğun içerikler.
- **⚔️ Arena & Quiz (Oyunlaştırma):** Öğrenilen bilgileri test edebileceğiniz çoktan seçmeli quizler, puan tabanlı rekabetçi lig sistemi ve liderlik tabloları.
- **💬 Tartışma Odaları (Debates):** Konu bazlı fikir alışverişi yapabileceğiniz, zihin açıcı sohbet ve argüman alanları.
- **🤝 Modern Takip Sistemi:** Product-Level standartlarında; anında güncellenen, spam korumalı, Supabase Realtime ile canlı çalışan gelişmiş takip (follower/following) altyapısı.
- **🔔 Gerçek Zamanlı Bildirimler (Realtime Notifications):** Biri sizi takip ettiğinde, postunuza yorum veya beğeni geldiğinde sayfayı yenilemenize gerek kalmadan anında gelen bildirimler.
- **🎨 Zengin Profil Yönetimi:** Kullanıcı adından biyografiye, özelleştirilmiş avatarlardan sosyal medya hesap linklerine kadar kapsamlı, yaşayan bir profil deneyimi.
- **🔒 Güvenli Veritabanı:** Supabase Row Level Security (RLS) ile tamamen güvenli, dışarıdan müdahaleye kapalı güvenli veri akışı.

## 🚀 Teknolojik Altyapı (Tech Stack)

### Frontend (İstemci)
- **Framework:** React Native / Expo (Çapraz Platform: iOS, Android, Web)
- **Dil:** TypeScript
- **Navigasyon:** React Navigation
- **İkonlar & Animasyonlar:** Lucide React Native, Moti, Reanimated
- **Tasarım Sistemi:** Glassmorphism ve Dark Mode öncelikli, "Premium" estetik anlayışı

### Backend (Sunucu & Veritabanı)
- **BaaS:** Supabase (PostgreSQL)
- **Gerçek Zamanlı Veri (Realtime):** Supabase Realtime Channels
- **Güvenlik (Security):** Supabase Auth & Row Level Security (RLS)
- **Depolama (Storage):** Supabase Storage (Avatar ve Medya yönetimi için)
- **API & Mantık:** Edge Functions ve RPC (Remote Procedure Calls)

## 📦 Kurulum ve Çalıştırma

Projeyi yerel bilgisayarınızda çalıştırmak için aşağıdaki adımları takip edin:

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Expo CLI (`npm install -g expo-cli`)
- Bir Supabase projesi ve API anahtarları

### Adımlar

1. **Repoyu Klonlayın:**
   ```bash
   git clone https://github.com/busrademirrr/Mentis.git
   cd Mentis
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre Değişkenlerini Ayarlayın:**
   Proje ana dizininde bir `.env` dosyası oluşturun ve Supabase bilgilerinizi ekleyin:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Uygulamayı Başlatın:**
   ```bash
   npx expo start
   ```
   *Terminalde çıkan QR kodu Expo Go uygulaması ile okutarak telefonunuzda test edebilir veya `w` tuşuna basarak tarayıcıda Web versiyonunu açabilirsiniz.*

## 🛡️ Veritabanı (Database) Yapılandırması
Projedeki "Product-Level" özelliklerin çalışması için Supabase PostgreSQL üzerinde özel trigger'lar ve fonksiyonlar kullanılmıştır. Gerekli tüm şema (schema) kurulum dosyaları kök dizindeki `.sql` uzantılı dosyalarda mevcuttur (Örn: `mentis_safe_v2_and_v3_for_supabase.sql`). 

## 👨‍💻 Geliştirici
- **Büşra Demir** - [GitHub Profil](https://github.com/busrademirrr)

---
*Mentis, bir sosyal medyadan daha fazlasıdır; zihninizi besleyecek günlük bir rutindir.*
