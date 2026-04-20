import { useState, useEffect, useMemo } from "react";
import { Modal, ListGroup, Image, Badge, Dropdown, Button, Form } from "react-bootstrap";
import {
  FiMoreVertical, FiUserCheck, FiUserMinus, FiUsers,
  FiUserPlus, FiSearch, FiArrowLeft, FiCheckCircle, FiLogOut
} from "react-icons/fi";
import conversationApi from "../api/conversationApi";
import friendshipApi from "../api/friendshipApi";
import toast from "react-hot-toast";

function GroupMembersModal({ show, onHide, members, conversationId, currentUserId, onUpdate }) {
  // States cho tính năng Thêm thành viên
  const [isAdding, setIsAdding] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // States cho tính năng Rời nhóm (Chuyển quyền)
  const [isTransferring, setIsTransferring] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState(null);

  // Dùng chung
  const [search, setSearch] = useState("");

  const currentUserMember = members.find(m => m.id === currentUserId);
  const isOwner = currentUserMember?.role === 'owner';

  // Lấy danh sách bạn bè để mời
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await friendshipApi.getFriends();
        const data = res.data?.data;
        if (!data) return;

        let flatFriends = Array.isArray(data) ? data : Object.values(data).flat();

        // Lọc những người đã có trong nhóm
        const currentMemberIds = members.map(m => m.id);
        const inviteable = flatFriends.filter(f => !currentMemberIds.includes(f._id));
        setFriends(inviteable);
      } catch (err) {
        console.log("Fetch friends error:", err);
      }
    };
    if (isAdding) fetchFriends();
  }, [isAdding, members]);

  // Lọc bạn bè (khi thêm)
  const filteredFriends = useMemo(() => {
    return friends.filter((f) => f.fullName?.toLowerCase().includes(search.toLowerCase()));
  }, [friends, search]);

  // Lọc thành viên (khi chuyển quyền)
  const eligibleNewOwners = useMemo(() => {
    return members.filter((m) =>
      m.id !== currentUserId &&
      m.fullName?.toLowerCase().includes(search.toLowerCase())
    );
  }, [members, currentUserId, search]);

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCloseModal = () => {
    setIsAdding(false);
    setIsTransferring(false);
    setSelectedNewOwner(null);
    setSearch("");
    onHide();
  };

  // --- CÁC HÀM XỬ LÝ API ---

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return toast.error("Vui lòng chọn thành viên");
    try {
      const res = await conversationApi.addMembers(conversationId, selectedUserIds);
      toast.success("Đã thêm thành viên mới!");
      onUpdate(res.data.result);
      setIsAdding(false);
      setSelectedUserIds([]);
    } catch (error) {
      toast.error("Không thể thêm thành viên");
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const res = await conversationApi.removeMember(conversationId, memberId);
      toast.success("Đã xóa khỏi nhóm");
      onUpdate(res.data.result);
    } catch (error) {
      toast.error("Lỗi khi xóa thành viên");
    }
  };

  const handleAssignOwner = async (memberId) => {
    try {
      const res = await conversationApi.assignOwner(conversationId, memberId);
      toast.success("Đã thay đổi trưởng nhóm");
      onUpdate(res.data.result);
    } catch (error) {
      toast.error("Lỗi khi bổ nhiệm");
    }
  };

  const executeLeave = async () => {
    // 1. Tạo một Toast Loading có ID cụ thể để ghim nó lại
    const toastId = toast.loading("Đang xử lý...");

    try {
      await conversationApi.leaveGroup(conversationId);

      // 2. Cập nhật chính cái ID đó thành Success và ép nó biến mất sau 2 giây
      toast.success("Đã rời khỏi nhóm", { id: toastId, duration: 2000 });

      onUpdate({ _id: conversationId, isRemoved: true });
      handleCloseModal();
    } catch (error) {
      // 3. Bắt lỗi cũng dùng đúng ID đó
      toast.error(error.response?.data?.message || "Lỗi khi rời nhóm", { id: toastId, duration: 2000 });
    }
  };

  // Nút Rời Nhóm (Bước 1)
  const handleLeaveGroupClick = () => {
    if (isOwner) {
      // Nếu nhóm chỉ còn 1 mình mình thì rời luôn
      if (members.length <= 1) {
        executeLeave();
      } else {
        // Nếu còn người khác, mở màn hình chuyển quyền
        setIsTransferring(true);
        setSearch("");
      }
      return;
    }

    // Nếu là thành viên bình thường -> Xác nhận rồi rời
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate__animated animate__zoomIn animate__faster' : 'animate__animated animate__zoomOut animate__faster'}`}
        style={{ background: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #f1f5f9', minWidth: '320px' }}>
        <div className="d-flex align-items-center gap-2 fw-bold" style={{ fontSize: '18px', color: '#1e293b' }}>
          <FiLogOut className="text-danger" size={24} /> Xác nhận rời nhóm
        </div>
        <div className="text-muted" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          Bạn sẽ không thể nhận hay xem lại tin nhắn của nhóm này sau khi rời đi. Bạn có chắc chắn không?
        </div>
        <div className="d-flex gap-2 mt-2">
          <Button variant="light" className="flex-grow-1 rounded-pill fw-bold" style={{ padding: '10px' }} onClick={() => toast.dismiss(t.id)}>Hủy</Button>
          <Button variant="danger" className="flex-grow-1 rounded-pill fw-bold shadow-sm" style={{ padding: '10px' }} onClick={() => {
            toast.dismiss(t.id);
            executeLeave();
          }}>Rời nhóm</Button>
        </div>
      </div>
    ), { duration: Infinity, position: 'top-center' });
  };

  // Nút Xác nhận Chuyển quyền & Rời Nhóm (Bước 2)
  const handleTransferAndLeave = async () => {
    if (!selectedNewOwner) return toast.error("Vui lòng chọn trưởng nhóm mới");

    try {
      toast.loading("Đang xử lý...", { id: "leave-transfer" });
      await conversationApi.assignOwner(conversationId, selectedNewOwner);
      await conversationApi.leaveGroup(conversationId);

      toast.success("Đã nhượng quyền và rời nhóm!", { id: "leave-transfer" });
      onUpdate({ _id: conversationId, isRemoved: true });
      handleCloseModal();
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại", { id: "leave-transfer" });
    }
  };

  // --- HÀM RENDER AVATAR DÙNG CHUNG ---
  const renderAvatar = (user, size = 42) => {
    if (user?.avatarUrl) {
      return <Image src={user.avatarUrl} roundedCircle width={size} height={size} style={{ objectFit: "cover" }} />;
    }
    return (
      <div className="d-flex align-items-center justify-content-center text-white"
        style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#3b82f6)", fontWeight: 600, fontSize: size > 40 ? "16px" : "12px" }}>
        {user?.fullName?.charAt(0) || "U"}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={handleCloseModal} centered scrollable className="modern-modal">
      <style>
        {`
          .modern-modal .modal-content {
            border-radius: 24px; border: none; background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px); box-shadow: 0 20px 40px rgba(0,0,0,0.12);
          }
          .modern-header { background: #fff; border-bottom: 1px solid #f1f5f9; padding: 1.5rem; }
          .member-item { transition: all 0.2s ease; border-radius: 16px !important; margin: 0.25rem 0.5rem; cursor: pointer; }
          .member-item:hover { background: #f8fafc !important; }
          .search-input { border-radius: 14px; border: 2px solid #f1f5f9; padding: 10px 12px 10px 45px; background: #f8fafc; }
          .search-input:focus { background: #fff; border-color: #6366f1; box-shadow: none; }
          .btn-confirm { background: linear-gradient(135deg, #6366f1, #4f46e5); border: none; border-radius: 14px; padding: 12px; font-weight: 600; }
          .badge-owner { background: #fff1f2 !important; color: #e11d48 !important; border: 1px solid #fecdd3; font-size: 10px; }
          .no-caret::after { display: none !important; }
          
          /* Custom Radio Button cho Zalo style */
          .custom-radio-container { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; border: 2px solid #cbd5e1; transition: 0.2s; }
          .custom-radio-container.active { border-color: #3b82f6; }
          .custom-radio-inner { width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; transform: scale(0); transition: 0.2s; }
          .custom-radio-container.active .custom-radio-inner { transform: scale(1); }
        `}
      </style>

      {/* DYNAMIC HEADER */}
      <div className="modern-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            {isTransferring ? (
              <>
                <div onClick={() => setIsTransferring(false)} style={{ cursor: 'pointer' }}><FiArrowLeft size={20} /></div>
                <h5 className="mb-0 fw-bold text-dark" style={{ fontSize: '18px' }}>Chọn trưởng nhóm mới trước khi rời</h5>
              </>
            ) : isAdding ? (
              <>
                <div onClick={() => setIsAdding(false)} style={{ cursor: 'pointer' }}><FiArrowLeft size={20} /></div>
                <h5 className="mb-0 fw-bold">Thêm thành viên</h5>
              </>
            ) : (
              <>
                <FiUsers className="text-primary" size={24} />
                <div>
                  <h5 className="mb-0 fw-bold">Thành viên nhóm</h5>
                  <small className="text-muted">{members.length} người tham gia</small>
                </div>
              </>
            )}
          </div>
          {!isAdding && !isTransferring && isOwner && (
            <Button variant="primary" size="sm" className="rounded-pill px-3 shadow-sm" onClick={() => setIsAdding(true)}>
              <FiUserPlus className="me-1" /> Mời
            </Button>
          )}
        </div>
      </div>

      {/* BODY */}
      <Modal.Body className="py-3 px-2">
        {isTransferring ? (
          <>
            {/* VIEW 1: TRƯỞNG NHÓM CHUYỂN QUYỀN */}
            <div className="position-relative mb-3 px-2">
              <FiSearch className="position-absolute" style={{ top: '13px', left: '25px', color: '#94a3b8' }} />
              <Form.Control placeholder="Tìm kiếm thành viên..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {eligibleNewOwners.map(user => (
                <div key={user.id} onClick={() => setSelectedNewOwner(user.id)} className="d-flex align-items-center p-3 member-item"
                  style={{ background: selectedNewOwner === user.id ? "#eef2ff" : "transparent" }}>
                  <div className="me-3">
                    <div className={`custom-radio-container ${selectedNewOwner === user.id ? 'active' : ''}`}>
                      <div className="custom-radio-inner"></div>
                    </div>
                  </div>
                  <div className="me-3">{renderAvatar(user, 42)}</div>
                  <div className="fw-bold flex-grow-1" style={{ color: '#1e293b' }}>{user.fullName}</div>
                </div>
              ))}
              {eligibleNewOwners.length === 0 && <div className="text-center text-muted py-4">Không có thành viên phù hợp</div>}
            </div>
          </>
        ) : isAdding ? (
          <>
            {/* VIEW 2: THÊM BẠN BÈ */}
            <div className="position-relative mb-3 px-2">
              <FiSearch className="position-absolute" style={{ top: '13px', left: '25px', color: '#94a3b8' }} />
              <Form.Control placeholder="Tìm bạn bè..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {filteredFriends.map(user => (
                <div key={user._id} onClick={() => toggleUser(user._id)} className="d-flex align-items-center p-3 member-item"
                  style={{ background: selectedUserIds.includes(user._id) ? "#eef2ff" : "transparent" }}>
                  <div className="position-relative me-3">
                    {renderAvatar(user, 42)}
                    {selectedUserIds.includes(user._id) && (
                      <FiCheckCircle className="position-absolute text-primary bg-white rounded-circle" style={{ bottom: -2, right: -2, fontSize: '18px' }} />
                    )}
                  </div>
                  <div className="fw-bold flex-grow-1" style={{ color: '#1e293b' }}>{user.fullName}</div>
                </div>
              ))}
              {filteredFriends.length === 0 && <div className="text-center text-muted py-4">Không tìm thấy bạn bè</div>}
            </div>

            <div className="p-2">
              <Button variant="primary" className="w-100 btn-confirm mt-2" onClick={handleAddMembers} disabled={selectedUserIds.length === 0}>
                Xác nhận thêm ({selectedUserIds.length})
              </Button>
            </div>
          </>
        ) : (
          <ListGroup variant="flush">
            {/* VIEW 3: DANH SÁCH THÀNH VIÊN MẶC ĐỊNH */}
            {members.map((member) => (
              <ListGroup.Item key={member.id} className="member-item d-flex align-items-center px-3 border-0 py-3">
                <div className="me-3">
                  {renderAvatar({ avatarUrl: member.avatarUrl, fullName: member.fullName }, 42)}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: '15px', color: '#1e293b' }}>
                    {member.fullName} {member.id === currentUserId && <span className="text-muted fw-normal ms-1">(Bạn)</span>}
                  </div>
                  <div className="mt-1">
                    {member.role === 'owner' ? <Badge className="badge-owner">Trưởng nhóm</Badge> : <span className="text-muted" style={{ fontSize: '12px' }}>Thành viên</span>}
                  </div>
                </div>

                {isOwner && member.id !== currentUserId && (
                  <Dropdown onClick={(e) => e.stopPropagation()}>
                    <Dropdown.Toggle as="div" className="no-caret p-2 rounded-circle hover-bg-light" style={{ cursor: 'pointer' }}>
                      <FiMoreVertical size={18} color="#64748b" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="shadow border-0 p-2" style={{ borderRadius: '16px' }}>
                      <Dropdown.Item className="rounded-pill d-flex align-items-center gap-2 py-2" onClick={() => handleAssignOwner(member.id)}>
                        <FiUserCheck size={16} className="text-success" /> Bổ nhiệm trưởng nhóm
                      </Dropdown.Item>
                      <Dropdown.Divider className="mx-2" />
                      <Dropdown.Item className="text-danger rounded-pill d-flex align-items-center gap-2 py-2" onClick={() => handleRemoveMember(member.id)}>
                        <FiUserMinus size={16} /> Xóa khỏi nhóm
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>

      {/* DYNAMIC FOOTER */}
      {isTransferring ? (
        <Modal.Footer className="border-0 px-4 pb-4 pt-2 d-flex gap-2">
          <Button variant="light" className="flex-grow-1 rounded-pill fw-bold" style={{ padding: '12px' }} onClick={() => setIsTransferring(false)}>
            Hủy
          </Button>
          <Button variant="primary" className="flex-grow-1 rounded-pill fw-bold btn-confirm" style={{ padding: '12px' }}
            disabled={!selectedNewOwner} onClick={handleTransferAndLeave}>
            Chọn và tiếp tục
          </Button>
        </Modal.Footer>
      ) : !isAdding && (
        <Modal.Footer className="border-0 px-4 pb-4 pt-2">
          <Button
            variant="outline-danger"
            className="w-100 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2 shadow-sm"
            style={{ padding: '12px 20px', border: '2px solid #fecdd3', background: '#fff1f2', color: '#e11d48', transition: '0.2s' }}
            onClick={handleLeaveGroupClick}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffe4e6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <FiLogOut size={18} /> Rời khỏi nhóm
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}

export default GroupMembersModal;