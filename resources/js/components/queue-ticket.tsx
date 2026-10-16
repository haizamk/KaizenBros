export type QueueTicketData = {
    queue_label: string | null;
    queue_turn: number | null;
    queue_position: number | null;
    ahead_count: number | null;
};

function aheadSentence(count: number): string {
    if (count === 0) {
        return 'Tiada pesakit di hadapan anda.';
    }

    if (count === 1) {
        return 'Seorang pesakit di hadapan anda.';
    }

    return `${count} pesakit di hadapan anda.`;
}

export default function QueueTicket({ ticket }: { ticket: QueueTicketData }) {
    if (!ticket.queue_label || ticket.queue_turn === null) {
        return null;
    }

    return (
        <div className="rounded-2xl border-2 border-amber-600 p-4">
            <p className="text-base font-bold text-amber-100">Nombor giliran</p>
            <p className="text-5xl font-black tracking-wide text-amber-200">{ticket.queue_label}</p>
            <p className="text-2xl font-black">Giliran ke-{ticket.queue_turn} hari ini</p>
            {ticket.queue_position !== null && ticket.ahead_count !== null ? (
                <p className="mt-2 text-lg leading-relaxed">
                    Kedudukan semasa dalam barisan menunggu: ke-{ticket.queue_position}. {aheadSentence(ticket.ahead_count)}
                </p>
            ) : null}
        </div>
    );
}
