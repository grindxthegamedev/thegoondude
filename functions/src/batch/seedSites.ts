/**
 * Seed Sites
 * Curated list of top 100 adult sites for batch processing
 */

import { onRequest } from 'firebase-functions/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { defineSecret } from 'firebase-functions/params';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const adminHashSecret = defineSecret('ADMIN_HASH');
const DEV_ADMIN_HASH = 'b2b2f104d32c638903e151a9b20d6e27b41d8c0c84cf8458738f83ca2f1dd744';

function verifyPassword(password: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const expected = adminHashSecret.value() || DEV_ADMIN_HASH;
    return hash === expected;
}

const TOP_SITES = [
    // --- TUBES ---
    { name: 'Pornhub', url: 'https://pornhub.com', category: 'tubes' },
    { name: 'XNXX', url: 'https://xnxx.com', category: 'tubes' },
    { name: 'XVideos', url: 'https://xvideos.com', category: 'tubes' },
    { name: 'RedTube', url: 'https://redtube.com', category: 'tubes' },
    { name: 'YouPorn', url: 'https://youporn.com', category: 'tubes' },
    { name: 'Eporner', url: 'https://eporner.com', category: 'tubes' },
    { name: 'SpankBang', url: 'https://spankbang.com', category: 'tubes' },
    { name: 'Motherless', url: 'https://motherless.com', category: 'tubes' },
    { name: 'XHamster', url: 'https://xhamster.com', category: 'tubes' },
    { name: 'PornTREX', url: 'https://porntrex.com', category: 'tubes' },
    { name: 'Thumbzilla', url: 'https://thumbzilla.com', category: 'tubes' },
    { name: 'Tube8', url: 'https://tube8.com', category: 'tubes' },
    { name: 'SxyPrn', url: 'https://sxyprn.com', category: 'tubes' },
    { name: 'Beeg', url: 'https://beeg.com', category: 'tubes' },
    { name: 'DaftSex', url: 'https://daftsex.com', category: 'tubes' },
    { name: 'HQPorner', url: 'https://hqporner.com', category: 'tubes' },
    { name: 'PornDoe', url: 'https://porndoe.com', category: 'tubes' },
    { name: 'CumLouder', url: 'https://cumlouder.com', category: 'tubes' },
    { name: 'TnaFlix', url: 'https://tnaflix.com', category: 'tubes' },
    { name: 'SunPorno', url: 'https://sunporno.com', category: 'tubes' },
    { name: 'Fuq', url: 'https://fuq.com', category: 'tubes' },
    { name: 'Fapster', url: 'https://fapster.xx', category: 'tubes' }, // Verify TLD
    { name: 'ThePornDude', url: 'https://theporndude.com', category: 'tubes' }, // Meta but useful
    { name: 'Vporn', url: 'https://vporn.com', category: 'tubes' },
    { name: 'PornHeal', url: 'https://pornheal.com', category: 'tubes' },

    // --- HENTAI ---
    { name: 'Hanime', url: 'https://hanime.tv', category: 'hentai' },
    { name: 'HentaiHaven', url: 'https://hentaihaven.xxx', category: 'hentai' },
    { name: 'nHentai', url: 'https://nhentai.net', category: 'hentai' },
    { name: 'Gelbooru', url: 'https://gelbooru.com', category: 'hentai' },
    { name: 'Rule34', url: 'https://rule34.xxx', category: 'hentai' },
    { name: 'Sankaku Complex', url: 'https://sankakucomplex.com', category: 'hentai' },
    { name: 'E-Hentai', url: 'https://e-hentai.org', category: 'hentai' },
    { name: 'Tsumino', url: 'https://tsumino.com', category: 'hentai' },
    { name: 'Pururin', url: 'https://pururin.io', category: 'hentai' },
    { name: 'HentaiFoundry', url: 'https://hentai-foundry.com', category: 'hentai' },
    { name: 'MuchoHentai', url: 'https://muchohentai.com', category: 'hentai' },
    { name: 'Simply Hentai', url: 'https://simply-hentai.com', category: 'hentai' },
    { name: 'HentaiPulse', url: 'https://hentaipulse.com', category: 'hentai' },
    { name: 'HentaiWorld', url: 'https://hentaiworld.tv', category: 'hentai' },
    { name: 'Hentai2Read', url: 'https://hentai2read.com', category: 'hentai' },
    { name: 'Hitomi', url: 'https://hitomi.la', category: 'hentai' },
    { name: '8muses', url: 'https://8muses.com', category: 'hentai' },
    { name: 'Fakku', url: 'https://fakku.net', category: 'hentai' },
    { name: 'Nutaku', url: 'https://nutaku.net', category: 'hentai' },
    { name: 'HentaiHeroes', url: 'https://hentaiheroes.com', category: 'hentai' },

    // --- CAMS ---
    { name: 'Chaturbate', url: 'https://chaturbate.com', category: 'cams' },
    { name: 'BongaCams', url: 'https://bongacams.com', category: 'cams' },
    { name: 'Stripchat', url: 'https://stripchat.com', category: 'cams' },
    { name: 'CamSoda', url: 'https://camsoda.com', category: 'cams' },
    { name: 'MyFreeCams', url: 'https://myfreecams.com', category: 'cams' },
    { name: 'Jerkmate', url: 'https://jerkmate.com', category: 'cams' },
    { name: 'LiveJasmin', url: 'https://livejasmin.com', category: 'cams' },
    { name: 'Streamate', url: 'https://streamate.com', category: 'cams' },
    { name: 'Cams.com', url: 'https://cams.com', category: 'cams' },
    { name: 'Cam4', url: 'https://cam4.com', category: 'cams' },
    { name: 'ImLive', url: 'https://imlive.com', category: 'cams' },
    { name: 'Flirt4Free', url: 'https://flirt4free.com', category: 'cams' },
    { name: 'Xlovecam', url: 'https://xlovecam.com', category: 'cams' },
    { name: 'SakuraLive', url: 'https://sakuralive.com', category: 'cams' },
    { name: 'Baberotica', url: 'https://baberotica.com', category: 'cams' },

    // --- AMATEUR & COMMUNITY ---
    { name: 'OnlyFans', url: 'https://onlyfans.com', category: 'amateur' },
    { name: 'ManyVids', url: 'https://manyvids.com', category: 'amateur' },
    { name: 'Fansly', url: 'https://fansly.com', category: 'amateur' },
    { name: 'Clips4Sale', url: 'https://clips4sale.com', category: 'amateur' },
    { name: 'IWantClips', url: 'https://iwantclips.com', category: 'amateur' },
    { name: 'LoyalFans', url: 'https://loyalfans.com', category: 'amateur' },
    { name: 'JustForFans', url: 'https://justforfans.com', category: 'amateur' },
    { name: 'ModelHub', url: 'https://modelhub.com', category: 'amateur' },
    { name: 'Pornhub Amateur', url: 'https://pornhub.com/amateur', category: 'amateur' },
    { name: 'Reddit NSFW', url: 'https://reddit.com/r/nsfw', category: 'amateur' }, // Tricky crawl
    { name: 'EroMe', url: 'https://erome.com', category: 'amateur' },
    { name: 'Thothub', url: 'https://thothub.to', category: 'amateur' },
    { name: 'CooMeat', url: 'https://coomeet.com', category: 'amateur' },
    { name: 'Omegle Alternative', url: 'https://omegle.com', category: 'amateur' }, // Defunct, replace
    { name: 'Fapopedia', url: 'https://fapopedia.net', category: 'amateur' },

    // --- PREMIUM / HIGH QUALITY ---
    { name: 'Brazzers', url: 'https://brazzers.com', category: 'premium' },
    { name: 'RealityKings', url: 'https://realitykings.com', category: 'premium' },
    { name: 'NaughtyAmerica', url: 'https://naughtyamerica.com', category: 'premium' },
    { name: 'Mofos', url: 'https://mofos.com', category: 'premium' },
    { name: 'BangBros', url: 'https://bangbros.com', category: 'premium' },
    { name: 'DigitalPlayground', url: 'https://digitalplayground.com', category: 'premium' },
    { name: 'EvilAngel', url: 'https://evilangel.com', category: 'premium' },
    { name: 'JulesJordan', url: 'https://julesjordan.com', category: 'premium' },
    { name: 'Kink.com', url: 'https://kink.com', category: 'premium' },
    { name: 'AdultTime', url: 'https://adulttime.com', category: 'premium' },
    { name: 'TeamSkeet', url: 'https://teamskeet.com', category: 'premium' },
    { name: 'Nubiles', url: 'https://nubiles.net', category: 'premium' },
    { name: 'Twistys', url: 'https://twistys.com', category: 'premium' },
    { name: 'MetArt', url: 'https://metart.com', category: 'premium' },
    { name: 'X-Art', url: 'https://x-art.com', category: 'premium' },

    // --- AI / INTERACTIVE / GAME ---
    { name: 'Pump34', url: 'https://pump34.com', category: 'interactive' },
    { name: 'LifeSelector', url: 'https://lifeselector.com', category: 'interactive' },
    { name: 'Virt-A-Mate', url: 'https://virtamatedb.com', category: 'interactive' }, // Database
    { name: 'AI Hentai', url: 'https://aihentai.com', category: 'interactive' }, // Placeholder
    { name: 'Character.ai NSFW', url: 'https://janitorai.com', category: 'interactive' },
    { name: 'Perchance AI', url: 'https://perchance.org/ai-text-adventure', category: 'interactive' },
    { name: 'Yodayo', url: 'https://yodayo.com', category: 'interactive' },
    { name: 'Civitai', url: 'https://civitai.com', category: 'interactive' },
    { name: 'PixAI', url: 'https://pixai.art', category: 'interactive' },
    { name: 'LustyCompanion', url: 'https://lustycompanion.com', category: 'interactive' },
];

function generateSlug(name: string): string {
    return name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export const adminSeedSites = onRequest(
    { memory: '256MiB', timeoutSeconds: 300, cors: true, secrets: [adminHashSecret] },
    async (req, res) => {
        if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

        const { adminPassword } = req.body;
        if (!adminPassword || !verifyPassword(adminPassword)) {
            res.status(401).send('Unauthorized');
            return;
        }

        let added = 0;
        let skipped = 0;

        for (const site of TOP_SITES) {
            const slug = generateSlug(site.name);
            const siteId = slug; // Use slug as ID for simplicity

            const docRef = db.collection('sites').doc(siteId);
            const doc = await docRef.get();

            if (!doc.exists) {
                await docRef.set({
                    name: site.name,
                    url: site.url,
                    slug: slug,
                    description: '', // Empty - AI will generate during review
                    category: site.category,
                    submitterEmail: 'admin-seed@thegoondude.com',
                    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
                    status: 'pending', // Ready for batch processor
                    tags: [site.category, 'top-100', 'seeded'],
                    votes: 0,
                    rating: null,
                });
                added++;
            } else {
                skipped++;
            }
        }

        res.json({ success: true, added, skipped, total: TOP_SITES.length });
    }
);
