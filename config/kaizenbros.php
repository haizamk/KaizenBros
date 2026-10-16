<?php

return [

    /*
    | Maklumat pusat diambil daripada profil demo KaizenBros sedia ada.
    | Nombor telefon pesakit dalam seeder adalah nombor rekaan.
    */
    'centre' => [
        'name' => 'Pusat Dialisis KaizenBros Semenyih',
        'brand' => 'KaizenBros Dialysis',
        'slogan' => 'Rawatan Hemodialisis Berkualiti & Mesra Pesakit',
        'kkm_license' => 'KKM/BPFK/78219/2024',
        'address' => 'No. 27 & 29G, Jalan 5/10, Seksyen 5, Bandar Rinching, 43500 Semenyih, Selangor, Malaysia',
        'phone_main' => '03-8727 8899',
        'hotline_24h' => '019-388 9922',
        'email' => 'klinik@kaizenbros.com.my',
        'whatsapp_number' => '60193889922',
        'operating_hours' => [
            ['days' => 'Isnin - Sabtu', 'time' => '5:30 AM - 8:00 PM'],
            ['days' => 'Ahad', 'time' => 'Panggilan Kecemasan Sahaja'],
        ],
        'capacity_machines' => 12,
        'chairs' => ['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09', 'A-10', 'A-11', 'A-12'],
        'machine_model' => 'Fresenius 4008S NG / 5008S HDF',
        'water_system' => 'Double Pass Reverse Osmosis System',
        'panels' => ['PERKESO / SOCSO', 'JPA / KWAP', 'Zakat Selangor', 'BAITULMAL', 'NKF'],
        'medical_director' => 'Dr. Ahmad Farhan bin Mohamad (Nefrologi)',
        'head_nurse' => 'Sister Siti Fatimah binti Rosli (SRN)',
        'map' => [
            'latitude' => '2.92592',
            'longitude' => '101.86000',
            'embed_url' => 'https://maps.google.com/maps?q=2.92592,101.86000+(Pusat+Dialisis+KaizenBros)&z=19&output=embed',
            'google_url' => 'https://maps.google.com/?q=2.92592,101.86000',
            'waze_url' => 'https://waze.com/ul?ll=2.92592,101.86000&navigate=yes',
        ],
    ],

    'lab_pdf_ocr' => [
        'enabled' => env('LAB_PDF_OCR', true),
        'dpi' => 160,
        'max_pages' => 6,
        'timeout_seconds' => 120,
        'language' => 'eng',
        'pdftoppm' => env('LAB_PDF_PDFTOPPM', '/usr/bin/pdftoppm'),
        'tesseract' => env('LAB_PDF_TESSERACT', '/usr/bin/tesseract'),
        'working_directory' => storage_path('app'),
    ],

    'demo_accounts' => [
        [
            'role' => 'Jururawat',
            'name' => 'Sister Siti Fatimah binti Rosli',
            'email' => 'nurse@kaizenbros.com.my',
            'password' => 'Nurse@2026',
        ],
        [
            'role' => 'Pentadbir',
            'name' => 'Dr. Ahmad Farhan bin Mohamad',
            'email' => 'admin@kaizenbros.com.my',
            'password' => 'Admin@2026',
        ],
        [
            'role' => 'Pesakit',
            'name' => 'Tan Ah Kow',
            'email' => 'tan.ahkow@demo.kaizenbros.my',
            'password' => 'Pesakit@2026',
        ],
    ],

];
