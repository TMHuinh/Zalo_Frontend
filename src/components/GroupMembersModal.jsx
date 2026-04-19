import { useState, useEffect, useMemo } from "react";
import { Modal, ListGroup, Image, Badge, Dropdown, Button, Form } from "react-bootstrap";
import { FiMoreVertical, FiUserCheck, FiUserMinus, FiUsers, FiUserPlus, FiSearch, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import conversationApi from "../api/conversationApi";
import friendshipApi from "../api/friendshipApi";
import toast from "react-hot-toast";

function GroupMembersModal({ show, onHide, members, conversationId, currentUserId, onUpdate }) {
  const [isAdding, setIsAdding] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [search, setSearch] = useState("");

  const currentUserMember = members.find(m => m.id === currentUserId);
  const isOwner = currentUserMember?.role === 'owner';

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await friendshipApi.getFriends();
        const data = res.data?.data;
        if (!data) return;

        let flatFriends = Array.isArray(data) ? data : Object.values(data).flat();
        const currentMemberIds = members.map(m => m.id);
        const inviteable = flatFriends.filter(f => !currentMemberIds.includes(f._id));
        setFriends(inviteable);
      } catch (err) {
        console.log("Fetch friends error:", err);
      }
    };
    if (isAdding) fetchFriends();
  }, [isAdding, members]);

  const filteredFriends = useMemo(() => {
    const keyword = search.toLowerCase();
    return friends.filter((f) => f.fullName?.toLowerCase().includes(keyword));
  }, [friends, search]);

  const toggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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
      onHide();
    } catch (error) {
      toast.error("Lỗi khi xóa thành viên");
    }
  };

  const handleAssignOwner = async (memberId) => {
    try {
      const res = await conversationApi.assignOwner(conversationId, memberId);
      toast.success("Đã thay đổi trưởng nhóm");
      onUpdate(res.data.result);
      onHide();
    } catch (error) {
      toast.error("Lỗi khi bổ nhiệm");
    }
  };

  // Hàm render Avatar dùng chung giống CreateGroupModal
  const renderAvatar = (user, size = 42) => {
    if (user?.avatarUrl) {
      return (
        <Image 
          src={user.avatarUrl} 
          roundedCircle 
          width={size} 
          height={size} 
          style={{ objectFit: "cover" }} 
        />
      );
    }
    return (
      <div
        className="d-flex align-items-center justify-content-center text-white"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg,#6366f1,#3b82f6)",
          fontWeight: 600,
          fontSize: size > 40 ? "16px" : "12px"
        }}
      >
        {user?.fullName?.charAt(0) || "U"}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={() => { onHide(); setIsAdding(false); }} centered scrollable className="modern-modal">
      <style>
        {`
          .modern-modal .modal-content {
            border-radius: 24px;
            border: none;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.12);
          }
          .modern-header {
            background: #fff;
            border-bottom: 1px solid #f1f5f9;
            padding: 1.5rem;
          }
          .member-item {
            transition: all 0.2s ease;
            border-radius: 16px !important;
            margin: 0.25rem 0.5rem;
            cursor: pointer;
          }
          .member-item:hover {
            background: #f8fafc !important;
          }
          .search-input {
            border-radius: 14px;
            border: 2px solid #f1f5f9;
            padding: 10px 12px 10px 45px;
            background: #f8fafc;
          }
          .search-input:focus {
            background: #fff;
            border-color: #6366f1;
            box-shadow: none;
          }
          .btn-confirm {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            border: none;
            border-radius: 14px;
            padding: 12px;
            font-weight: 600;
          }
          .badge-owner {
            background: #fff1f2 !important;
            color: #e11d48 !important;
            border: 1px solid #fecdd3;
            font-size: 10px;
          }
          .no-caret::after { display: none !important; }
        `}
      </style>

      <div className="modern-header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3">
            {isAdding ? (
              <div onClick={() => setIsAdding(false)} style={{cursor:'pointer'}}><FiArrowLeft size={20} /></div>
            ) : (
              <FiUsers className="text-primary" size={24} />
            )}
            <div>
              <h5 className="mb-0 fw-bold">{isAdding ? "Thêm thành viên" : "Thành viên"}</h5>
              {!isAdding && <small className="text-muted">{members.length} thành viên</small>}
            </div>
          </div>
          {!isAdding && (
            <Button variant="primary" size="sm" className="rounded-pill px-3" onClick={() => setIsAdding(true)}>
              <FiUserPlus /> Mời
            </Button>
          )}
        </div>
      </div>

      <Modal.Body className="py-3 px-2">
        {isAdding ? (
          <>
            <div className="position-relative mb-3 px-2">
              <FiSearch className="position-absolute" style={{ top: '13px', left: '25px', color: '#94a3b8' }} />
              <Form.Control 
                placeholder="Tìm bạn bè..." 
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {filteredFriends.map(user => (
                <div key={user._id} onClick={() => toggleUser(user._id)} 
                     className="d-flex align-items-center p-3 member-item"
                     style={{ background: selectedUserIds.includes(user._id) ? "#eef2ff" : "transparent" }}>
                  <div className="position-relative me-3">
                    {renderAvatar(user, 42)}
                    {selectedUserIds.includes(user._id) && (
                       <FiCheckCircle className="position-absolute text-primary bg-white rounded-circle" 
                                      style={{ bottom: -2, right: -2, fontSize: '18px' }} />
                    )}
                  </div>
                  <div className="fw-bold flex-grow-1">{user.fullName}</div>
                </div>
              ))}
            </div>

            <div className="p-2">
              <Button variant="primary" className="w-100 btn-confirm mt-3" onClick={handleAddMembers} disabled={selectedUserIds.length === 0}>
                Xác nhận ({selectedUserIds.length})
              </Button>
            </div>
          </>
        ) : (
          <ListGroup variant="flush">
            {members.map((member) => (
              <ListGroup.Item key={member.id} className="member-item d-flex align-items-center px-3 border-0 py-3">
                <div className="me-3">
                  {renderAvatar({ avatarUrl: member.avatarUrl, fullName: member.fullName }, 42)}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: '15px' }}>
                    {member.fullName} {member.id === currentUserId && "(Bạn)"}
                  </div>
                  <div className="mt-1">
                    {member.role === 'owner' ? 
                      <Badge className="badge-owner">Trưởng nhóm</Badge> : 
                      <span className="text-muted" style={{ fontSize: '12px' }}>Thành viên</span>
                    }
                  </div>
                </div>
                {isOwner && member.id !== currentUserId && (
                  <Dropdown onClick={(e) => e.stopPropagation()}>
                    <Dropdown.Toggle as="div" className="no-caret p-2 rounded-circle hover-bg-light" style={{cursor:'pointer'}}>
                      <FiMoreVertical size={18} color="#64748b" />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="shadow border-0 p-2" style={{ borderRadius: '16px' }}>
                      <Dropdown.Item className="rounded-pill d-flex align-items-center gap-2 py-2" onClick={() => handleAssignOwner(member.id)}>
                        <FiUserCheck className="text-success" /> Bổ nhiệm trưởng nhóm
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className="text-danger rounded-pill d-flex align-items-center gap-2 py-2" onClick={() => handleRemoveMember(member.id)}>
                        <FiUserMinus /> Xóa khỏi nhóm
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default GroupMembersModal;