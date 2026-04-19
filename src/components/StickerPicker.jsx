import React, { useState, useRef } from "react";
import { Popover, OverlayTrigger, Spinner } from "react-bootstrap";
import { FiSmile } from "react-icons/fi";
import axios from "axios";

const STICKER_CACHE_KEY = "giphy_trending_stickers";
const CACHE_TTL = 1000 * 60 * 30; // 30 phút

const StickerPicker = ({ onSelect }) => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const loadedRef = useRef(false);
  const fetchingRef = useRef(false);

  const getCache = () => {
    try {
      const raw = sessionStorage.getItem(STICKER_CACHE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed?.data || !parsed?.expiredAt) return null;

      if (Date.now() > parsed.expiredAt) {
        sessionStorage.removeItem(STICKER_CACHE_KEY);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  };

  const saveCache = (data) => {
    try {
      sessionStorage.setItem(
        STICKER_CACHE_KEY,
        JSON.stringify({
          data,
          expiredAt: Date.now() + CACHE_TTL,
        }),
      );
    } catch {
      // bỏ qua nếu sessionStorage lỗi
    }
  };

  const fetchStickers = async () => {
    if (fetchingRef.current) return;
    if (loadedRef.current && stickers.length > 0) return;

    const cached = getCache();
    if (cached?.length) {
      setStickers(cached);
      loadedRef.current = true;
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setErrorText("");

    try {
      const res = await axios.get(
        "https://api.giphy.com/v1/stickers/trending",
        {
          params: {
            api_key: import.meta.env.VITE_GIPHY_API_KEY,
            limit: 30,
          },
        },
      );

      const results =
        res.data?.data
          ?.map((item) => item?.images?.fixed_height?.url)
          .filter(Boolean) || [];

      setStickers(results);
      saveCache(results);
      loadedRef.current = true;
    } catch (e) {
      console.error("Giphy Error", e);

      if (e?.response?.status === 429) {
        setErrorText(
          "Bạn đang tải sticker quá nhiều lần. Thử lại sau ít phút.",
        );
      } else {
        setErrorText("Không tải được sticker.");
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleToggle = () => {
    fetchStickers();
  };

  const popover = (
    <Popover
      id="sticker-popover"
      className="shadow border-0 sticker-container-popover"
    >
      <Popover.Header as="h3" style={{ fontSize: "14px", fontWeight: "bold" }}>
        Stickers
      </Popover.Header>

      <Popover.Body
        style={{
          maxHeight: "300px",
          overflowY: "auto",
          width: "250px",
          padding: "10px",
        }}
      >
        {loading ? (
          <div className="text-center py-2">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : errorText ? (
          <div
            style={{
              fontSize: "13px",
              color: "#dc3545",
              textAlign: "center",
              padding: "10px 6px",
            }}
          >
            {errorText}
          </div>
        ) : stickers.length === 0 ? (
          <div
            style={{
              fontSize: "13px",
              color: "#6c757d",
              textAlign: "center",
              padding: "10px 6px",
            }}
          >
            Không có sticker để hiển thị
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "10px",
            }}
          >
            {stickers.map((url, idx) => (
              <div key={idx} className="sticker-item-wrapper">
                <img
                  src={url}
                  alt="sticker"
                  style={{
                    width: "100%",
                    height: "80px",
                    objectFit: "contain",
                    cursor: "pointer",
                    borderRadius: "4px",
                    transition: "transform 0.2s",
                  }}
                  onClick={() => onSelect(url)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.1)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                />
              </div>
            ))}
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="top"
      overlay={popover}
      rootClose
      onToggle={(nextShow) => {
        if (nextShow) handleToggle();
      }}
    >
      <button type="button" className="btn-emoji-refined">
        <FiSmile />
      </button>
    </OverlayTrigger>
  );
};

export default StickerPicker;
