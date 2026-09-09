import { useContext } from 'react';
import { NotificationsContext } from '@/contexts/NotificationsContext.jsx';

export function useNotifications() {
    const context = useContext(NotificationsContext);
    if (context === undefined) {
        throw new Error('useNotifications deve ser usado dentro de NotificationsProvider');
    }
    return context;
}
