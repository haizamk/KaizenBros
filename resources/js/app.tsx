import { createInertiaApp } from '@inertiajs/react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import { initializeTextSize } from '@/hooks/use-text-size';
import PublicLayout from '@/layouts/public-layout';
import ClinicLayout from '@/layouts/clinic-layout';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'daftar':
            case name.startsWith('promosi/'):
                return PublicLayout;
            case name.startsWith('jururawat/'):
            case name.startsWith('pesakit/'):
            case name.startsWith('admin/'):
                return ClinicLayout;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#14b8a6',
    },
});

// This will set light / dark mode on load...
initializeTheme();
initializeTextSize();
