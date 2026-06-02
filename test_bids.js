const fs = require('fs');
const token = fs.readFileSync('raw_token.txt', 'utf8').trim();

async function run() {
    // 1. Get auction details to find ID and other stuff
    const aucRes = await fetch('https://qaback.alteha.com:3232/api/auctions/details/AUC-1779445706122?role=ADMIN', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const auction = await aucRes.json();
    console.log("Auction Details Response Status:", aucRes.status);
    console.log("Auction Data:", JSON.stringify(auction, null, 2).substring(0, 500));

    // 2. Get bids
    const aucId = auction.data ? auction.data.id : auction.id;
    if (aucId) {
        const bidsRes = await fetch(`https://qaback.alteha.com:3232/api/bids?auctionId.equals=${aucId}&auction.id.equals=${aucId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const bids = await bidsRes.json();
        console.log("Bids Data Status:", bidsRes.status);
        console.log("Bids Data:", JSON.stringify(bids, null, 2).substring(0, 500));
    }

    // 3. Get attachments
    const attRes = await fetch(`https://qaback.alteha.com:3232/api/auctions/AUC-1779445706122/attachments?actorRole=ADMIN`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const att = await attRes.json();
    console.log("Attachments Status:", attRes.status);
    console.log("Attachments:", JSON.stringify(att, null, 2).substring(0, 300));
}
run();
