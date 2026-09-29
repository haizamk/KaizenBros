import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'KaizenBros Dialysis Centre',
  description: 'Production dialysis centre management platform with dedicated Patient Portal, Nurse Clinical Workflow, Admin Control, and Public Website.',
  openGraph: {
    title: 'KaizenBros Dialysis Centre',
    description: 'Production dialysis centre management platform with dedicated Patient Portal, Nurse Clinical Workflow, Admin Control, and Public Website.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KaizenBros Dialysis Centre',
    description: 'Production dialysis centre management platform with dedicated Patient Portal, Nurse Clinical Workflow, Admin Control, and Public Website.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
