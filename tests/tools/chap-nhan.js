// Test case thuộc giới hạn đã biết / rủi ro được chấp nhận (quyết định cuối đợt 3, 06/11/2026).
// Dữ liệu gốc giữ nguyên "Không đạt"; khi tổng hợp đợt 3 các lượt này tính là "Chấp nhận rủi ro" và không tính vào mẫu số tỉ lệ đạt.
module.exports = {
    'TC-S12-01': { loi: 'BUG-02', ly: 'Giới hạn kiến trúc đã biết: web tĩnh không có máy chủ, dữ liệu và phiên nằm trong localStorage nên không thể chặn triệt để việc giả user_id ở phía trình duyệt; cần backend kiểm quyền.' },
    'TC-S12-16': { loi: 'BUG-07', ly: 'Rủi ro được chấp nhận: tổng dung lượng trang chủ trên Firefox tính cả video nền; nhóm quyết định giữ nguyên chất lượng video/ảnh.' },
    'TC-S12-17': { loi: 'BUG-07', ly: 'Rủi ro được chấp nhận: 4 ảnh phòng farmhouse > 500 KB giữ nguyên chất lượng theo quyết định của nhóm; đã tối ưu bằng tải lười.' },
};
