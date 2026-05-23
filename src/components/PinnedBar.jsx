import { FiMoreHorizontal } from "react-icons/fi";

function PinnedBar({
  pinnedMessages,
  showAllPinned,
  setShowAllPinned,
  pinnedMenuId,
  setPinnedMenuId,
  pinnedMenuRef,
  pinnedDropdownRef,
  scrollToMessage,
  getReplyPreviewText,
  handleUnpinFromBar,
}) {
  if (pinnedMessages.length === 0) return null;

  const firstPinned = pinnedMessages[0]?.messageId || pinnedMessages[0];
  const extraCount = pinnedMessages.length - 1;

  return (
    <div className="pinned-bar-facebook">
      <div className="pinned-bar-facebook-main">
        <div className="pinned-facebook-left">
          <div className="pinned-facebook-icon">💬</div>

          <div
            className="pinned-facebook-content"
            onClick={() => {
              if (!firstPinned?._id) return;
              scrollToMessage(firstPinned._id);
              setPinnedMenuId(null);
            }}
          >
            <div className="pinned-facebook-title">Tin nhắn</div>
            <div className="pinned-facebook-text">
              {getReplyPreviewText(firstPinned)}
            </div>
          </div>
        </div>

        <div className="pinned-facebook-actions">
          {extraCount > 0 && (
            <button
              type="button"
              className={`pinned-facebook-more ${showAllPinned ? "expanded" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setShowAllPinned((prev) => !prev);
                setPinnedMenuId(null);
              }}
            >
              +{extraCount} ghim <span className="caret">▾</span>
            </button>
          )}

          {extraCount === 0 && (
            <div
              className="pinned-single-menu-wrap"
              ref={pinnedMenuId === firstPinned?._id ? pinnedMenuRef : null}
            >
              <button
                type="button"
                className="pinned-single-more-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setPinnedMenuId((prev) =>
                    prev === firstPinned?._id ? null : firstPinned?._id,
                  );
                }}
              >
                <FiMoreHorizontal />
              </button>

              {pinnedMenuId === firstPinned?._id && (
                <div
                  className="pinned-single-dropdown"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="pinned-single-dropdown-item unpin"
                    onClick={() => handleUnpinFromBar(firstPinned)}
                  >
                    Bỏ ghim
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAllPinned && pinnedMessages.length > 1 && (
        <div
          className="pinned-facebook-dropdown"
          ref={pinnedDropdownRef}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="pinned-facebook-dropdown-header">
            <span>Danh sách ghim ({pinnedMessages.length})</span>
            <button
              type="button"
              className="pinned-facebook-collapse"
              onClick={() => setShowAllPinned(false)}
            >
              Thu gọn <span>⌃</span>
            </button>
          </div>

          <div className="pinned-facebook-list">
            {pinnedMessages.map((item, index) => {
              const pinnedMsg = item.messageId || item;
              const pinnedId = pinnedMsg?._id;

              return (
                <div key={pinnedId || index} className="pinned-facebook-item">
                  <div
                    className="pinned-facebook-item-body"
                    onClick={() => {
                      if (!pinnedId) return;
                      scrollToMessage(pinnedId);
                      setShowAllPinned(false);
                      setPinnedMenuId(null);
                    }}
                  >
                    <div className="pinned-facebook-item-title">Tin nhắn</div>
                    <div className="pinned-facebook-item-text">
                      {getReplyPreviewText(pinnedMsg)}
                    </div>
                  </div>

                  <div
                    className="pinned-facebook-item-actions"
                    ref={pinnedMenuId === pinnedId ? pinnedMenuRef : null}
                  >
                    <button
                      type="button"
                      className="pinned-facebook-item-more"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPinnedMenuId((prev) =>
                          prev === pinnedId ? null : pinnedId,
                        );
                      }}
                    >
                      <FiMoreHorizontal />
                    </button>

                    {pinnedMenuId === pinnedId && (
                      <div
                        className="pinned-facebook-item-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="pinned-facebook-item-menu-btn unpin"
                          onClick={() => handleUnpinFromBar(item)}
                        >
                          Bỏ ghim
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PinnedBar;
