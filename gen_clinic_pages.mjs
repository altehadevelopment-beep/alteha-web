
import ComingSoonPage from '@/components/dashboard/ComingSoon';
const files = [
    'app/dashboard/clinic/auctions/page.tsx',
    'app/dashboard/clinic/packages/page.tsx',
    'app/dashboard/clinic/orders/page.tsx',
    'app/dashboard/clinic/payments/page.tsx',
    'app/dashboard/clinic/chat/page.tsx',
    'app/dashboard/clinic/notifications/page.tsx',
    'app/dashboard/clinic/score/page.tsx',
    'app/dashboard/clinic/settings/page.tsx',
    'app/dashboard/clinic/profile/page.tsx'
];

import fs from 'fs';
import path from 'path';

files.forEach(file => {
    const title = file.split('/')[3].charAt(0).toUpperCase() + file.split('/')[3].slice(1);
    const content = `import ComingSoonPage from '@/components/dashboard/ComingSoon';\n\nexport default function ${title}Page() {\n    return <ComingSoonPage title="${title}" />;\n}\n`;
    fs.writeFileSync(path.join(process.cwd(), file), content);
});
