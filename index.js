const { WebcastPushConnection } = require('tiktok-live-connector');
const axios = require('axios');
const express = require('express');

// --- 1. CẤU HÌNH HỆ THỐNG ---
const TIKTOK_USERNAME = "new.world.015"; // Thay ID người livestream vào đây
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjqr-qR-ko42kk3sfcawFsXbwVUkTU-mpv88FRrndKDsRGZs9bMSRJVWuUw4e5XL1amQ/exec"; // Dán link Apps Script vào đây
const PORT = process.env.PORT || 3000;

// --- 2. TẠO WEB SERVER (CHỐNG NGỦ ĐÔNG) ---
const app = express();
app.get('/', (req, res) => {
    res.send('Hệ thống TikTok Tracker đang hoạt động 24/7!');
});
app.listen(PORT, () => {
    console.log(`📡 Server mồi đang chạy trên port ${PORT}`);
});

// --- 3. KẾT NỐI TIKTOK LIVE ---
let tiktokLiveConnection = new WebcastPushConnection(TIKTOK_USERNAME);

function connectToTikTok() {
    tiktokLiveConnection.connect()
        .then(state => {
            console.log(`✅ Đã kết nối tới Live của: ${TIKTOK_USERNAME} (Room ID: ${state.roomId})`);
        })
        .catch(err => {
            console.error('❌ Lỗi kết nối, thử lại sau 10 giây...', err.message);
            setTimeout(connectToTikTok, 10000);
        });
}

// --- 4. LẮNG NGHE SỰ KIỆN QUÀ TẶNG ---
tiktokLiveConnection.on('gift', data => {
    // Chỉ gửi khi kết thúc chuỗi tặng quà (repeatEnd) để tránh quá tải Sheet
    if (data.repeatEnd) {
        const giftPayload = {
            senderLevel: data.extendedGiftInfo?.level || 0,
            senderUser: data.uniqueId,
            receiverUser: TIKTOK_USERNAME,
            giftName: data.giftName,
            giftIcon: data.giftPictureUrl,
            amount: data.repeatCount,
            totalCoins: data.diamondCount * data.repeatCount
        };

        console.log(`🎁 [${giftPayload.senderUser}] tặng ${giftPayload.amount}x ${giftPayload.giftName}`);

        // Gửi dữ liệu về Google Sheets
        axios.post(GOOGLE_SCRIPT_URL, giftPayload)
            .then(() => console.log("   -> Đã ghi vào Sheet thành công"))
            .catch(err => console.error("   -> Lỗi gửi Sheet:", err.message));
    }
});

// Tự động kết nối lại khi bị ngắt kết nối giữa chừng
tiktokLiveConnection.on('disconnected', () => {
    console.log('⚠️ Mất kết nối TikTok, đang kết nối lại...');
    setTimeout(connectToTikTok, 5000);
});

// Chạy lệnh kết nối
connectToTikTok();
