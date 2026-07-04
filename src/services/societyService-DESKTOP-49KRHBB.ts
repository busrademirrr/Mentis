import { Society, LiveDebate, LivePresence } from '../types/database.types';

// sample data to simulate Supabase architecture
export const sampleHeroSociety: Society = {
    id: '1',
    name: 'VAROLUŞ AKADEMİSİ',
    description: 'Modern varoluşsal problemler ve özgürlük üzerine derin tartışmalar.',
    prestige_tier: 'elite',
    created_at: new Date().toISOString(),
    memberCount: 12400,
    onlineCount: 328,
    activeDebatesCount: 842,
    currentDebate: {
        id: 'd1',
        society_id: '1',
        title: 'İnsan gerçekten özgür mü?',
        category: 'Felsefe',
        thesis: 'Özgürlük bir illüzyondur.',
        heat_score: 98,
        is_active: true,
        created_at: new Date().toISOString()
    }
};

export const sampleSocieties: Society[] = [
    {
        id: '2',
        name: 'STOACI AKADEMİ',
        description: 'Disiplin, erdem ve bilinç.',
        prestige_tier: 'elite',
        created_at: new Date().toISOString(),
        memberCount: 8200,
        onlineCount: 184,
        currentDebate: {
            id: 'd2',
            society_id: '2',
            title: 'Mutluluk kontrol edilebilir mi?',
            category: 'Felsefe',
            thesis: 'Dış etkenler mutluluğu belirlemez.',
            heat_score: 85,
            is_active: true,
            created_at: new Date().toISOString()
        }
    },
    {
        id: '3',
        name: 'YENİ RÖNESANS',
        description: 'Sanatın yapay zeka ile evrimi ve yaratıcılığın sınırları.',
        prestige_tier: 'standard',
        created_at: new Date().toISOString(),
        memberCount: 4500,
        onlineCount: 92,
        currentDebate: {
            id: 'd3',
            society_id: '3',
            title: 'Yapay zeka sanat üretebilir mi?',
            category: 'Sanat',
            thesis: 'Sanat niyet gerektirir.',
            heat_score: 105,
            is_active: true,
            created_at: new Date().toISOString()
        }
    }
];

export const sampleLiveDebates: LiveDebate[] = [
    {
        id: 'd3',
        society_id: '3',
        title: 'Yapay zeka sanat üretebilir mi?',
        category: 'Teknoloji',
        thesis: 'Yapay zeka orijinal sanat yapamaz.',
        heat_score: 105,
        is_active: true,
        created_at: new Date().toISOString(),
        participantsCount: 124,
        lastMessage: 'Sanat niyet gerektirir.'
    },
    {
        id: 'd4',
        society_id: '1',
        title: 'Bilinç fiziksel bir olgu mudur?',
        category: 'Bilim',
        thesis: 'Bilinç nöronal aktivitenin yan ürünüdür.',
        heat_score: 72,
        is_active: true,
        created_at: new Date().toISOString(),
        participantsCount: 56,
        lastMessage: 'Kuantum etkilerini göz ardı edemeyiz.'
    }
];

export const societyService = {
    getHeroSociety: async (): Promise<Society> => {
        return new Promise(resolve => setTimeout(() => resolve(sampleHeroSociety), 300));
    },
    
    getSocieties: async (category?: string): Promise<Society[]> => {
        return new Promise(resolve => setTimeout(() => resolve(sampleSocieties), 400));
    },

    getLiveDebatesStream: async (): Promise<LiveDebate[]> => {
        return new Promise(resolve => setTimeout(() => resolve(sampleLiveDebates), 350));
    }
};
