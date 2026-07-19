const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'app/dashboard/page.tsx',
  'app/dashboard/inbox/page.tsx', 
  'app/dashboard/reports/page.tsx',
  'app/dashboard/channels/page.tsx',
  'app/dashboard/reputation/page.tsx',
  'app/dashboard/content/page.tsx',
  'app/dashboard/settings/page.tsx',
  'app/dashboard/whatsapp/page.tsx',
  'app/dashboard/billing/page.tsx'
];

const replacements = [
  // Lime green to blue accent
  { from: '#C6FF00', to: '#3B82F6' },
  { from: '#C6FF00', to: '#3B82F6' },
  { from: '#C6FF00', to: '#3B82F6' },
  
  // Cyan to neutral gray  
  { from: '#7DF9FF', to: '#A0A0A0' },
  { from: '#7DF9FF', to: '#A0A0A0' },
  
  // RGBA replacements
  { from: 'rgba(198,255,0,0.1)', to: 'rgba(59,130,246,0.1)' },
  { from: 'rgba(198,255,0,0.15)', to: 'rgba(59,130,246,0.15)' },
  { from: 'rgba(198,255,0,0.3)', to: 'rgba(59,130,246,0.3)' },
  { from: 'rgba(198,255,0,0.08)', to: 'rgba(59,130,246,0.08)' },
  { from: 'rgba(198,255,0,0.4)', to: 'rgba(59,130,246,0.4)' },
  { from: 'rgba(198,255,0,0.2)', to: 'rgba(59,130,246,0.2)' },
  { from: 'rgba(198,255,0,0.6)', to: 'rgba(59,130,246,0.6)' },
  
  // Gradient replacements to solid or neutral
  { from: 'linear-gradient(135deg, #C6FF00, #A8E600)', to: '#3B82F6' },
  { from: 'linear-gradient(180deg, #C6FF00, rgba(198,255,0,0.3))', to: '#3B82F6' },
  { from: 'linear-gradient(to right, #C6FF00, #7DF9FF)', to: 'linear-gradient(to right, #3B82F6, #A0A0A0)' },
  
  // Secondary colors to neutral
  { from: '#00D68F', to: '#10B981' }, // Success
  { from: '#FFB800', to: '#F59E0B' }, // Warning
  { from: '#FF4D6D', to: '#EF4444' }, // Error
  
  // Text colors to new palette
  { from: '#F0F0FF', to: '#E8E8E8' },
  { from: 'rgba(240,240,255,0.7)', to: '#A0A0A0' },
  { from: 'rgba(255,255,255,0.05)', to: 'rgba(255,255,255,0.03)' },
  { from: 'rgba(255,255,255,0.1)', to: 'rgba(255,255,255,0.06)' },
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let replacementsCount = 0;
  
  replacements.forEach(({ from, to }) => {
    const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, to);
      replacementsCount += matches.length;
      console.log(`Replaced ${matches.length} instances of ${from} with ${to} in ${file}`);
    }
  });
  
  if (replacementsCount > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${file} with ${replacementsCount} replacements`);
  } else {
    console.log(`No replacements needed in ${file}`);
  }
});

console.log('Color replacement complete!');