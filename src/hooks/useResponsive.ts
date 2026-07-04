import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
};

export const useResponsive = () => {
    const { width } = useWindowDimensions();

    const isMobile = width < BREAKPOINTS.MOBILE;
    const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
    const isDesktop = width >= BREAKPOINTS.TABLET;
    
    // Provide an additional breakpoint for large screens (e.g. centering a 1200px container)
    const isLargeDesktop = width >= BREAKPOINTS.DESKTOP;

    return {
        width,
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
    };
};
