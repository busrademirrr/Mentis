import { supabase } from '../lib/supabase';

export interface CognitiveTrait {
    id: string;
    trait_key: string;
    score: number;
}

// Maps backend trait keys to frontend display strings
export const TRAIT_MAP: Record<string, string> = {
    'analytical_thinker': 'Analitik Düşünür',
    'cultural_curator': 'Kültürel Küratör',
    'historical_strategist': 'Tarihsel Stratejist',
    'dialectical_debater': 'Diyalektik Tartışmacı',
    'ethical_philosopher': 'Etik Filozofu'
};

export const getUserCognitiveTraits = async (userId: string): Promise<CognitiveTrait[]> => {
    try {
        const { data, error } = await supabase
            .from('user_cognitive_traits')
            .select('*')
            .eq('user_id', userId)
            .order('score', { ascending: false });

        if (error) {
            console.error('Error fetching cognitive traits:', error);
            return [];
        }

        return data;
    } catch (error) {
        console.error('getUserCognitiveTraits error:', error);
        return [];
    }
};

// Generates a human-readable sentence based on the user's top traits
export const generateCognitiveSummary = (traits: CognitiveTrait[]): string => {
    if (!traits || traits.length === 0) {
        return "Henüz yeterli etkileşim verisi bulunmuyor. Daha fazla okuma ve tartışma yaparak bilişsel profilini oluştur.";
    }

    const topTraits = traits.slice(0, 2).map(t => TRAIT_MAP[t.trait_key] || t.trait_key);
    
    if (topTraits.length === 1) {
        return `Son etkileşimlerin, belirgin bir şekilde ${topTraits[0]} eğilimi gösterdiğini yansıtıyor.`;
    }

    return `Son 30 günde ağırlıklı olarak ${topTraits[0]} ve ${topTraits[1]} eğilimleriyle öne çıkıyor. Karar alma mekanizmalarında bu özellikler belirgin.`;
};
