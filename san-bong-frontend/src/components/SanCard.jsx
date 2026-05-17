import { Link } from 'react-router-dom';
import { fmt } from '../lib/utils.jsx';

const thumbs = [
  { cls: 'san-thumbnail-green', icon: '⚽' },
  { cls: 'san-thumbnail-teal', icon: '🏃' },
  { cls: 'san-thumbnail-blue', icon: '🥅' },
];

export function SanCard({ san, index = 0 }) {
  const th = thumbs[index % thumbs.length];

  return (
    <div className="san-card">
      <div className={`san-thumbnail ${th.cls}`}>
        <div className="san-thumb-pattern" />
        <div className="san-thumb-icon">{th.icon}</div>
        <div className="san-loai-badge">{fmt.loaiSan(san.loai_san)}</div>
      </div>

      <div className="san-body">
        <div className="san-name">{san.ten_san}</div>
        <div className="san-desc">
          {san.mo_ta || 'Sân bóng chất lượng cao, cỏ nhân tạo tiêu chuẩn.'}
        </div>
        <div className="san-price">
          {fmt.tien(san.gia_thue)} <span>/ giờ</span>
        </div>
      </div>

      <div className="san-footer">
        <Link to={`/dat-san?id=${san.id}`} className="btn btn-primary btn-sm flex-1">
          Đặt ngay
        </Link>
        <Link to={`/lich-san?id=${san.id}`} className="btn btn-outline btn-sm">
          Xem lịch
        </Link>
      </div>
    </div>
  );
}
