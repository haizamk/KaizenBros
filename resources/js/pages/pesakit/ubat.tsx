import { Head } from '@inertiajs/react';
import PatientNav, { MissingPatient } from '@/components/patient-nav';

type Medication = {
    id: number;
    medication_name: string;
    dosage: string;
    frequency: string;
    route: string;
};

export default function UbatPesakit({
    patient,
    medications,
}: {
    patient: { name: string } | null;
    medications: Medication[];
}) {
    return (
        <>
            <Head title="Senarai ubat" />
            {!patient ? (
                <MissingPatient />
            ) : (
                <div className="space-y-4">
                    <PatientNav />
                    <header>
                        <h1 className="text-3xl font-black sm:text-4xl">Senarai ubat</h1>
                        <p className="mt-2 text-lg leading-relaxed text-slate-200">Ubat ini direkodkan oleh jururawat atau pentadbir. Jangan ubah dos tanpa nasihat kakitangan.</p>
                    </header>
                    {medications.length === 0 ? (
                        <p className="rounded-3xl border border-[#1F385C] bg-[#132238] p-5 text-lg">Tiada ubat aktif direkodkan.</p>
                    ) : (
                        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            {medications.map((medication) => (
                                <li key={medication.id} className="rounded-3xl border border-amber-800 bg-[#132238] p-5">
                                    <p className="text-2xl font-black">{medication.medication_name}</p>
                                    <p className="mt-2 text-lg">{medication.dosage}</p>
                                    <p className="text-lg">{medication.frequency}</p>
                                    <p className="text-lg">{medication.route}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </>
    );
}
