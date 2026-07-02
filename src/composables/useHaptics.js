import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function useHaptics() {
    
    // Light vibration for generic UI touches (like opening a menu or clicking a tab)
    const hapticSelection = async () => {
        try {
            await Haptics.selectionStart();
        } catch (e) {
            // Probably running in a web browser without haptic support, ignore quietly
        }
    };

    // Medium impact for confirming an action (like checking a box or finishing a step)
    const hapticImpactLight = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            // Ignore if unsupported
        }
    };
    
    // Heavy impact for major state changes (like deleting an item or finishing an order)
    const hapticImpactHeavy = async () => {
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            // Ignore if unsupported
        }
    };
    
    // Notification for success (e.g. order saved successfully)
    const hapticSuccess = async () => {
        try {
            await Haptics.notification({ type: 'SUCCESS' });
        } catch (e) {
            // Ignore if unsupported
        }
    };
    
    // Notification for error/warning
    const hapticError = async () => {
        try {
            await Haptics.notification({ type: 'ERROR' });
        } catch (e) {
            // Ignore if unsupported
        }
    };

    return {
        hapticSelection,
        hapticImpactLight,
        hapticImpactHeavy,
        hapticSuccess,
        hapticError
    };
}
