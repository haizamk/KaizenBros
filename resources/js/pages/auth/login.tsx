import { useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type DemoAccount = {
    role: string;
    name: string;
    email: string;
    password: string;
};

type Props = {
    status?: string;
    canResetPassword: boolean;
    demoAccounts?: DemoAccount[];
};

export default function Login({ status, canResetPassword, demoAccounts = [] }: Props) {
    const form = useForm({
        email: '',
        password: '',
        remember: false,
    });

    return (
        <>
            <form
                className="flex flex-col gap-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    form.post(store.url());
                }}
            >
                <div className="grid gap-2">
                    <Label htmlFor="email">Emel</Label>
                    <Input
                        id="email"
                        type="email"
                        name="email"
                        required
                        autoFocus
                        autoComplete="username"
                        value={form.data.email}
                        onChange={(event) => form.setData('email', event.target.value)}
                        placeholder="emel@kaizenbros.com.my"
                        className="min-h-12 text-base"
                    />
                    <InputError message={form.errors.email} />
                </div>

                <div className="grid gap-2">
                    <div className="flex items-center">
                        <Label htmlFor="password">Kata laluan</Label>
                        {canResetPassword && (
                            <TextLink href={request()} className="ml-auto text-sm">
                                Lupa kata laluan?
                            </TextLink>
                        )}
                    </div>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        required
                        autoComplete="current-password"
                        value={form.data.password}
                        onChange={(event) => form.setData('password', event.target.value)}
                        className="min-h-12 text-base"
                    />
                    <InputError message={form.errors.password} />
                </div>

                <div className="flex items-center space-x-3">
                    <Checkbox
                        id="remember"
                        name="remember"
                        checked={form.data.remember}
                        onCheckedChange={(checked) => form.setData('remember', checked === true)}
                    />
                    <Label htmlFor="remember">Ingat saya</Label>
                </div>

                <Button type="submit" className="mt-2 min-h-12 w-full text-base font-black" disabled={form.processing} data-test="login-button">
                    {form.processing && <Spinner />}
                    Log masuk
                </Button>
            </form>

            {status && <div className="text-center text-sm font-medium text-green-400">{status}</div>}

            {demoAccounts.length > 0 && (
                <div className="space-y-2 rounded-2xl border border-[#1F385C] bg-[#0B132B] p-4">
                    <p className="text-sm font-bold text-teal-200">Akaun demo pembangunan</p>
                    {demoAccounts.map((account) => (
                        <button
                            key={account.email}
                            type="button"
                            className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[#1F385C] px-3 text-left text-sm"
                            onClick={() => form.setData({ ...form.data, email: account.email, password: account.password })}
                        >
                            <span>
                                <span className="block font-bold text-white">{account.role}</span>
                                <span className="text-slate-300">{account.email}</span>
                            </span>
                            <span className="font-mono text-xs text-cyan-200">{account.password}</span>
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Log masuk KaizenBros',
    description: 'Gunakan emel dan kata laluan yang diberikan oleh pusat.',
};
