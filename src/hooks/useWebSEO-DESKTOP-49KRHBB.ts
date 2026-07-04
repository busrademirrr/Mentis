import { useEffect } from 'react';
import { Platform } from 'react-native';

interface SEOProps {
    title: string;
    description?: string;
    ogImage?: string;
}

/**
 * Custom hook to manage SEO (Title, Meta Description, OG tags) on the Web.
 * Fails silently on mobile platforms.
 */
export const useWebSEO = ({ title, description, ogImage }: SEOProps) => {
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Set document title
        document.title = `${title} | Mentis`;

        // Function to set or create meta tags
        const setMetaTag = (name: string, content: string, property: boolean = false) => {
            const attribute = property ? 'property' : 'name';
            let meta: HTMLMetaElement | null = document.querySelector(`meta[${attribute}="${name}"]`);
            
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attribute, name);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        if (description) {
            setMetaTag('description', description);
            setMetaTag('og:description', description, true);
        }

        setMetaTag('og:title', title, true);
        
        if (ogImage) {
            setMetaTag('og:image', ogImage, true);
        }

    }, [title, description, ogImage]);
};
