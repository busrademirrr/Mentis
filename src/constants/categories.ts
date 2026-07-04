export interface CategoryDef {
    id: string;
    label: string;
    icon: string;
    color: string;
}

export const CATEGORIES: CategoryDef[] = [
    { id: 'felsefe', label: 'Felsefe', icon: 'book-open', color: '#10b981' }, // emerald
    { id: 'tarih', label: 'Tarih', icon: 'clock', color: '#3b82f6' }, // blue
    { id: 'bilim', label: 'Bilim', icon: 'flask-conical', color: '#06b6d4' }, // cyan
    { id: 'psikoloji', label: 'Psikoloji', icon: 'brain', color: '#8b5cf6' }, // violet
    { id: 'teknoloji', label: 'Teknoloji', icon: 'cpu', color: '#6366f1' }, // indigo
    { id: 'yapay_zeka', label: 'Yapay Zeka', icon: 'bot', color: '#ec4899' }, // pink
    { id: 'yazilim', label: 'Yazılım', icon: 'code', color: '#14b8a6' }, // teal
    { id: 'matematik', label: 'Matematik', icon: 'calculator', color: '#f59e0b' }, // amber
    { id: 'fizik', label: 'Fizik', icon: 'atom', color: '#3b82f6' } // blue
];

export const getCategoryColor = (label: string): string => {
    const cat = CATEGORIES.find(c => c.label === label);
    return cat ? cat.color : '#8b5cf6'; // default primary
};

export const getCategoryIcon = (label: string): string => {
    const cat = CATEGORIES.find(c => c.label === label);
    return cat ? cat.icon : 'hash';
};

export const CATEGORY_LABELS = CATEGORIES.map(c => c.label);
