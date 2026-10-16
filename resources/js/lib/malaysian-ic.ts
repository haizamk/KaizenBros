export type IcPreview = {
    formatted: string;
    valid: boolean;
    message: string | null;
    ageLabel: string | null;
    genderLabel: string | null;
};

function isRealDate(year: number, month: number, day: number): boolean {
    const date = new Date(year, month - 1, day);

    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function formatIdentityCard(input: string): string {
    const digits = input.replace(/\D/g, '').slice(0, 12);

    if (digits.length <= 6) {
        return digits;
    }

    if (digits.length <= 8) {
        return `${digits.slice(0, 6)}-${digits.slice(6)}`;
    }

    return `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`;
}

export function parseMalaysianIc(input: string, todayIso: string): IcPreview {
    const formatted = formatIdentityCard(input);
    const digits = formatted.replace(/\D/g, '');
    const empty = {
        formatted,
        valid: false,
        message: null,
        ageLabel: null,
        genderLabel: null,
    };

    if (digits.length < 6) {
        return empty;
    }

    const [todayYear, todayMonth, todayDay] = todayIso.split('-').map(Number);
    const month = Number(digits.slice(2, 4));
    const day = Number(digits.slice(4, 6));
    let year = (Number(digits.slice(0, 2)) > todayYear % 100 ? 1900 : 2000) + Number(digits.slice(0, 2));

    if (!isRealDate(year, month, day)) {
        return {
            ...empty,
            message: 'Tarikh lahir pada nombor kad pengenalan tidak sah.',
        };
    }

    let birth = new Date(year, month - 1, day);
    const today = new Date(todayYear, todayMonth - 1, todayDay);

    if (birth > today) {
        year -= 100;

        if (!isRealDate(year, month, day)) {
            return {
                ...empty,
                message: 'Tarikh lahir pada nombor kad pengenalan tidak sah.',
            };
        }

        birth = new Date(year, month - 1, day);
    }

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) {
        months -= 1;
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    const complete = digits.length === 12;

    return {
        formatted,
        valid: complete,
        message: complete ? null : 'Lengkapkan 12 digit nombor kad pengenalan.',
        ageLabel: `${years} tahun ${months} bulan`,
        genderLabel: complete ? (Number(digits[11]) % 2 === 1 ? 'Lelaki' : 'Perempuan') : null,
    };
}
