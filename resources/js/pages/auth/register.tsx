import { Head } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { login } from '@/routes';

export default function Register() {
    return (
        <>
            <Head title="Pendaftaran ditutup" />
            <p className="text-center text-sm text-muted-foreground">
                Akaun tidak dibuka sendiri. Hantar permohonan di{' '}
                <TextLink href="/daftar">borang pesakit baru</TextLink>
                {' '}atau{' '}
                <TextLink href={login()}>log masuk</TextLink>.
            </p>
        </>
    );
}

Register.layout = {
    title: 'Pendaftaran ditutup',
    description: 'Akaun staf dan pesakit dikeluarkan oleh pusat.',
};
