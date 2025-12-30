const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');

// CẤU HÌNH TẠI ĐÂY
const TIKTOK_USERNAME = "new.world.015"; // Thay bằng ID người đang live
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjqr-qR-ko42kk3sfcawFsXbwVUkTU-mpv88FRrndKDsRGZs9bMSRJVWuUw4e5XL1amQ/exec"; // Thay bằng link Apps Script

let tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

tiktokLiveConnection.connect().then(state => {
    console.log(`✅ Đã kết nối tới Live của: ${TIKTOK_USERNAME}`);
    console.log(`🚀 Đang chờ quà tặng...`);
}).catch(err => {
    console.error('❌ Lỗi kết nối:', err);
});

// Lắng nghe sự kiện quà tặng
tiktokLiveConnection.on('gift', data => {
    // giftType 1 là quà tặng thường, repeatEnd = true khi kết thúc chuỗi combo
    if (data.repeatEnd) {
        const giftPayload = {
            senderLevel: data.extendedGiftInfo?.level || 0,
            senderUser: data.uniqueId,
            receiverUser: TIKTOK_USERNAME,
            giftName: data.giftName,
            giftIcon: data.giftPictureUrl, // Link ảnh icon quà
            amount: data.repeatCount,
            totalCoins: data.diamondCount * data.repeatCount
        };

        console.log(`🎁 [${giftPayload.senderUser}] tặng ${giftPayload.amount}x ${giftPayload.giftName} (${giftPayload.totalCoins} xu)`);

        // Gửi dữ liệu về Google Sheets
        axios.post(GOOGLE_SCRIPT_URL, giftPayload)
            .then(() => console.log("   -> Đã ghi vào Sheet"))
            .catch(err => console.error("   -> Lỗi gửi Sheet:", err.message));
    }
});

// Tự động kết nối lại nếu bị ngắt
tiktokLiveConnection.on('disconnected', () => {
    console.log('⚠️ Mất kết nối, đang thử kết nối lại...');
    setTimeout(() => tiktokLiveConnection.connect(), 5000);
});
