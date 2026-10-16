import { Head, Link } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { logout } from '@/routes';
import { dashboard } from '@/routes';

export default function VerifyEmail() {
    return (
        <>
            <Head title="Pengesahan emel" />

            <div className="space-y-6 text-center">
                <p className="text-base leading-relaxed">
                    Pengesahan emel dimatikan untuk portal ini. Anda boleh terus ke papan pemuka.
                </p>
                <Link
                    href={dashboard()}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground"
                >
                    Ke papan pemuka
                </Link>
                <TextLink href={logout()} className="mx-auto block text-sm">
                    Log keluar
                </TextLink>
            </div>
        </>
    );
}

VerifyEmail.layout = {
    title: 'Pengesahan emel',
    description: 'Pengesahan emel tidak diperlukan untuk portal KaizenBros.',
};
