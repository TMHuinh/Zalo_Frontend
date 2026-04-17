import React, { useState, useEffect } from "react";
import { Popover, OverlayTrigger, Spinner } from "react-bootstrap";
import { FiSmile } from "react-icons/fi";
import axios from "axios";

const StickerPicker = ({ onSelect }) => {
  const [stickers, setStickers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStickers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "https://api.giphy.com/v1/stickers/trending",
        {
          params: {
            api_key: import.meta.env.VITE_GIPHY_API_KEY,
            limit: 30, // Lấy 21 để chia hết cho 3 cột
          },
        },
      );
      const results = res.data.data.map((e) => e.images.fixed_height.url);
      setStickers(results);
    } catch (e) {
      console.error("Giphy Error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickers();
  }, []);

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
          <div className="text-center">
            <Spinner animation="border" size="sm" variant="primary" />
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr", // Chỉnh thành 3 cột ở đây
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
      rootClose // Thuộc tính này giúp nhấn ra ngoài là tự đóng
    >
      <button type="button" className="btn-emoji-refined">
        <FiSmile />
      </button>
    </OverlayTrigger>
  );
};

export default StickerPicker;
