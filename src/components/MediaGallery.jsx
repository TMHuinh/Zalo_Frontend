import { useState, useEffect, useCallback, useMemo } from "react";
import { HiX, HiPhotograph, HiDownload, HiCalendar } from "react-icons/hi";
import messageApi from "../api/messageApi";

const DATE_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "today", label: "Hôm nay" },
  { value: "yesterday", label: "Hôm qua" },
  { value: "week", label: "Tuần này" },
  { value: "month", label: "Tháng này" },
];

const getDateLabel = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hôm nay";
  if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const isInRange = (dateStr, range) => {
  if (range === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const startOfWeek = new Date(today);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const target = startOfDay(date);

  switch (range) {
    case "today": return target.getTime() === today.getTime();
    case "yesterday": return target.getTime() === yesterday.getTime();
    case "week": return target >= startOfWeek && target <= today;
    case "month": return target >= startOfMonth && target <= today;
    default: return true;
  }
};

function MediaGallery({ show, onHide, conversationId }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filterSender, setFilterSender] = useState(null);
  const [filterDate, setFilterDate] = useState("all");

  const fetchMedia = useCallback(async (p) => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const res = await messageApi.getConversationMedia(conversationId, p);
      const raw = res.data.data?.data || res.data.data || res.data.result?.data || res.data.result;
      const items = Array.isArray(raw) ? raw : [];
      setMedia((prev) => [...prev, ...items]);
      setHasMore(items.length >= 20);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (show && conversationId) {
      setMedia([]);
      setPage(1);
      setHasMore(true);
      setFilterSender(null);
      setFilterDate("all");
      fetchMedia(1);
    }
  }, [show, conversationId, fetchMedia]);

  const allImages = useMemo(() => {
    return media.flatMap((item) => {
      const img = item.attachment;
      if (img && (img.type === "image" || img.mimeType?.startsWith("image"))) {
        return [{
          _key: item._id,
          url: img.url,
          createdAt: item.createdAt,
          senderId: item.sender?._id,
          senderName: item.sender?.fullName,
          senderAvatar: item.sender?.avatarUrl,
        }];
      }
      if (item.attachments) {
        return item.attachments
          .filter((f) => f.type === "image" || f.mimeType?.startsWith("image"))
          .map((f, i) => ({
            _key: `${item._id}-${i}`,
            url: f.url || f.fileUrl,
            createdAt: item.createdAt,
            senderId: item.sender?._id,
            senderName: item.sender?.fullName,
            senderAvatar: item.sender?.avatarUrl,
          }));
      }
      return [];
    });
  }, [media]);

  const senders = useMemo(() => {
    const map = {};
    allImages.forEach((img) => {
      if (img.senderId && !map[img.senderId]) {
        map[img.senderId] = {
          id: img.senderId,
          name: img.senderName || "Unknown",
          avatar: img.senderAvatar,
        };
      }
    });
    return Object.values(map);
  }, [allImages]);

  const filteredImages = useMemo(() => {
    return allImages.filter((img) => {
      if (filterSender && img.senderId !== filterSender) return false;
      if (!isInRange(img.createdAt, filterDate)) return false;
      return true;
    });
  }, [allImages, filterSender, filterDate]);

  const groupedImages = useMemo(() => {
    const groups = {};
    filteredImages.forEach((img) => {
      const label = getDateLabel(img.createdAt);
      if (!groups[label]) groups[label] = [];
      groups[label].push(img);
    });
    return groups;
  }, [filteredImages]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchMedia(next);
  };

  if (!show) return null;

  return (
    <div className="media-gallery-overlay" onClick={onHide}>
      <div className="media-gallery" onClick={(e) => e.stopPropagation()}>
        <div className="media-gallery-header">
          <h4>
            <HiPhotograph size={20} />
            Ảnh / Video
          </h4>
          <button className="media-gallery-close" onClick={onHide}>
            <HiX size={20} />
          </button>
        </div>

        <div className="media-gallery-filters">
          <div className="media-filter-group">
            <HiCalendar size={16} className="media-filter-icon" />
            <select
              className="media-filter-select"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {senders.length > 1 && (
            <div className="media-filter-group">
              <select
                className="media-filter-select"
                value={filterSender || ""}
                onChange={(e) => setFilterSender(e.target.value || null)}
              >
                <option value="">Tất cả người gửi</option>
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="media-gallery-body">
          {loading && media.length === 0 && (
            <div className="media-gallery-loading">Đang tải...</div>
          )}

          {!loading && allImages.length === 0 && (
            <div className="media-gallery-empty">Chưa có ảnh/video nào</div>
          )}

          {!loading && allImages.length > 0 && filteredImages.length === 0 && (
            <div className="media-gallery-empty">Không tìm thấy ảnh phù hợp</div>
          )}

          {Object.entries(groupedImages).map(([dateLabel, images]) => (
            <div key={dateLabel} className="media-gallery-date-group">
              <div className="media-gallery-date-label">{dateLabel}</div>
              <div className="media-gallery-grid">
                {images.map((img) => (
                  <div
                    key={img._key}
                    className="media-gallery-item"
                    onClick={() => setPreviewUrl(img.url)}
                    title={img.senderName}
                  >
                    <img src={img.url} alt="" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedImages).length > 0 && hasMore && (
            <div className="media-gallery-more-wrap">
              <button
                className="media-gallery-more-btn"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </div>
      </div>

      {previewUrl && (
        <div className="media-preview-overlay" onClick={() => setPreviewUrl(null)}>
          <div className="media-preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="media-preview-close"
              onClick={() => setPreviewUrl(null)}
            >
              <HiX size={24} />
            </button>
            <img src={previewUrl} alt="preview" className="media-preview-img" />
            <a
              href={previewUrl}
              download
              className="media-preview-download"
              target="_blank"
              rel="noreferrer"
            >
              <HiDownload size={18} />
              Tải xuống
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaGallery;
