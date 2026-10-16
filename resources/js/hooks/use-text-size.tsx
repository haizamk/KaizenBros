import { useSyncExternalStore } from 'react';

export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

const listeners = new Set<() => void>();
let currentSize: TextSize = 'md';

const setCookie = (value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const maxAge = days * 24 * 60 * 60;
    document.cookie = `text_size=${value};path=/;max-age=${maxAge};SameSite=Lax`;
};

const isTextSize = (value: string | null): value is TextSize => {
    return value === 'sm' || value === 'md' || value === 'lg' || value === 'xl';
};

const readStoredSize = (): TextSize => {
    if (typeof window === 'undefined') {
        return 'md';
    }

    const stored = localStorage.getItem('text_size');

    return isTextSize(stored) ? stored : 'md';
};

const applySize = (size: TextSize): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.dataset.text = size;
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

export function initializeTextSize(): void {
    if (typeof window === 'undefined') {
        return;
    }

    currentSize = readStoredSize();

    if (!localStorage.getItem('text_size')) {
        localStorage.setItem('text_size', 'md');
        setCookie('md');
    }

    applySize(currentSize);
}

export function useTextSize(): {
    textSize: TextSize;
    updateTextSize: (size: TextSize) => void;
} {
    const textSize = useSyncExternalStore(
        subscribe,
        () => currentSize,
        () => 'md',
    );

    const updateTextSize = (size: TextSize): void => {
        currentSize = size;
        localStorage.setItem('text_size', size);
        setCookie(size);
        applySize(size);
        notify();
    };

    return { textSize, updateTextSize };
}
