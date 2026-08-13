import sharp from 'sharp'

const width = 1200
const height = 630

const editorialCanvas = Buffer.from(`
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#f7f7f2"/>
    <path d="M0 120C220 40 410 210 700 118S1010 52 1200 148" fill="none" stroke="#c9dde0" stroke-width="2"/>
    <path d="M0 500C280 410 520 570 800 478S1020 420 1200 510" fill="none" stroke="#ead9a8" stroke-width="2"/>
    <text x="90" y="210" font-family="Georgia, serif" font-size="61" fill="#202a2d">Rafael Navarro</text>
    <text x="94" y="268" font-family="Arial, sans-serif" font-size="30" fill="#45636b">Exploration • Digital • AI</text>
    <line x1="94" y1="310" x2="590" y2="310" stroke="#b65f4a" stroke-width="6"/>
    <text x="94" y="376" font-family="Georgia, serif" font-size="36" fill="#202a2d">Rafael&apos;s Exploration Journal</text>
    <text x="94" y="426" font-family="Arial, sans-serif" font-size="23" fill="#4d5a5d">Connecting technical insight, digital delivery,</text>
    <text x="94" y="460" font-family="Arial, sans-serif" font-size="23" fill="#4d5a5d">and AI-enabled decisions.</text>
    <text x="94" y="554" font-family="Arial, sans-serif" font-size="21" fill="#6e7b7d">onepalo.github.io</text>
  </svg>
`)

const figure = await sharp('src/assets/candidate/rafael-detail-background-simple.png')
  .resize({ height: 610, fit: 'contain' })
  .png()
  .toBuffer()

await sharp({ create: { width, height, channels: 4, background: '#f7f7f2' } })
  .composite([
    { input: editorialCanvas },
    { input: figure, left: 840, top: 10 },
  ])
  .png()
  .toFile('public/rafael-navarro-social-preview.png')