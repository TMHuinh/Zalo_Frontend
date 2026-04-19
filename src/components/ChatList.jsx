import { useEffect, useState, useMemo, useRef } from "react";
import { Form, Button, Badge, Row, Col, Image, Dropdown, Modal } from "react-bootstrap";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import AddFriendModal from "../components/AddFriendModal";
import conversationApi from "../api/conversationApi";
import { getUserIdFromToken } from "../utils/auth";
import socket from "../socket/socket";
import { FiUserPlus, FiMoreVertical, FiTrash2, FiUsers, FiEdit3, FiAlertTriangle, FiCamera, FiLogOut, FiCheckCircle } from "react-icons/fi";
import { HiUserGroup } from "react-icons/hi";
import CreateGroupModal from "./CreateGroupModal";
import GroupMembersModal from "./GroupMembersModal"; 
import toast, { Toaster } from "react-hot-toast";

function ChatList({
  onSelectConversation,
  activeConversationId,
  conversations,
  setConversations,
}) {
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [unread, setUnread] = useState({});
  const [openGroupModal, setOpenGroupModal] = useState(false);

  const [showMembersModal, setShowMembersModal] = useState(false);
  const [membersList, setMembersList] = useState([]);
  
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupName, setEditGroupName] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetGroup, setTargetGroup] = useState(null);
  
  const fileInputRef = useRef(null);
  const currentUserId = getUserIdFromToken();

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]+>/g, "");
  };

  const handleGroupUpdate = (updatedConv) => {
    if (typeof setConversations === "function") {
      setConversations(prev => prev.map(c => c._id === updatedConv._id ? updatedConv : c));
    }
    if (updatedConv.type === 'group') {
      const formattedMembers = updatedConv.members.map(m => ({
        id: m.userId._id || m.userId,
        fullName: m.userId.fullName,
        avatarUrl: m.userId.avatarUrl,
        role: m.role
      }));
      setMembersList(formattedMembers);
    }
  };

  const handleOpenEditModal = (conv) => {
    setTargetGroup(conv._id);
    setEditGroupName(conv.name || "");
    setPreviewAvatar(conv.avatarUrl || null);
    setSelectedFile(null);
    setShowEditGroupModal(true);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleUpdateGroupInfo = async () => {
    if (!editGroupName.trim()) return toast.error("Tên nhóm không được để trống");
    const formData = new FormData();
    formData.append("name", editGroupName);
    if (selectedFile) formData.append("avatar", selectedFile);

    const updatePromise = conversationApi.updateGroupInfo(targetGroup, formData);
    toast.promise(updatePromise, {
      loading: 'Đang lưu thay đổi...',
      success: (res) => {
        const updated = res.data.result;
        if (typeof setConversations === "function") {
          setConversations(prev => prev.map(c => c._id === targetGroup ? { ...c, name: updated.name, avatarUrl: updated.avatarUrl } : c));
        }
        setShowEditGroupModal(false);
        return "Cập nhật nhóm thành công!";
      },
      error: "Cập nhật thất bại!",
    });
  };

  const handleShowMembers = async (conversationId) => {
    setTargetGroup(conversationId);
    try {
      const res = await conversationApi.getGroupMembers(conversationId);
      setMembersList(res.data.result || []);
      setShowMembersModal(true);
    } catch (error) {
      toast.error("Lỗi lấy danh sách thành viên");
    }
  };

  const [confirmModal, setConfirmModal] = useState({ show: false, type: "", data: null });

  useEffect(() => {
    if (!activeConversationId) return;
    setUnread((prev) => ({ ...prev, [activeConversationId]: 0 }));
  }, [activeConversationId]);

  useEffect(() => {
    const handleReceive = async (data) => {
      const targetConv = conversations?.find((conv) => conv._id === data.conversationId);
      if (!targetConv || targetConv._id === activeConversationId) return;
      setUnread((prev) => ({ ...prev, [targetConv._id]: (prev[targetConv._id] || 0) + 1 }));
    };

    const handleUserOnline = (userId) => {
      if (typeof setConversations === "function") {
        setConversations(prev => prev.map(conv => ({
          ...conv,
          members: conv.members.map(m => m.userId?._id === userId ? { ...m, userId: { ...m.userId, isOnline: true } } : m)
        })));
      }
    };

    const handleUserOffline = (userId) => {
      if (typeof setConversations === "function") {
        setConversations(prev => prev.map(conv => ({
          ...conv,
          members: conv.members.map(m => m.userId?._id === userId ? { ...m, userId: { ...m.userId, isOnline: false } } : m)
        })));
      }
    };

    socket.on("receive_message", handleReceive);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [activeConversationId, conversations, setConversations]);

  const filtered = useMemo(() => {
    return (conversations || []).filter((c) => {
      const members = c?.members || [];
      const otherUser = members.find((m) => m?.userId?._id !== currentUserId);
      const name = c.type === "group" ? c.name : otherUser?.userId?.fullName || "Unknown";
      return (name || "").toLowerCase().includes((search || "").toLowerCase());
    });
  }, [conversations, search, currentUserId]);

  const recent = filtered.filter((c) => unread[c._id] > 0);
  const others = filtered.filter((c) => !unread[c._id]);

  const handleConfirmAction = async () => {
    const conversationId = confirmModal.data;
    const isDisband = confirmModal.type === "disband";

    try {
      const apiCall = isDisband 
        ? conversationApi.disbandGroup(conversationId) 
        : conversationApi.deleteConversation(conversationId);

      toast.promise(apiCall, {
        loading: isDisband ? 'Đang giải tán...' : 'Đang xóa...',
        success: () => {
          if (typeof setConversations === "function") {
            setConversations(prev => prev.filter(c => c._id !== conversationId));
          }
          if (activeConversationId === conversationId) onSelectConversation?.(null);
          return isDisband ? "Giải tán nhóm thành công" : "Xóa cuộc hội thoại thành công";
        },
        error: "Thao tác thất bại",
      });
    } catch (error) { console.error(error); }
    setConfirmModal({ show: false, type: "", data: null });
  };

  const renderItem = (conv) => {
    const members = conv?.members || [];
    const isGroup = conv.type === "group";
    const otherUser = members.find((m) => m?.userId?._id !== currentUserId);
    const user = otherUser?.userId;
    const isActive = activeConversationId === conv._id;
    const isOwner = conv.ownerId === currentUserId;

    return (
      <div key={conv._id} onClick={() => { setUnread((prev) => ({ ...prev, [conv._id]: 0 })); onSelectConversation?.(conv); }}
        className="mb-1 chat-item-row"
        style={{ cursor: "pointer", padding: "12px", borderRadius: 16, background: isActive ? "#eef2ff" : "#fff", position: "relative", transition: "all 0.2s ease" }}>
        <Row className="align-items-center g-0">
          <Col xs="auto" className="me-3">
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #00c6ff, #0072ff)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", overflow: 'hidden' }}>
              {(isGroup ? conv.avatarUrl : user?.avatarUrl) ? 
                <Image src={isGroup ? conv.avatarUrl : user.avatarUrl} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : 
                (isGroup ? <HiUserGroup size={24} /> : (user?.fullName?.charAt(0) || "?"))
              }
            </div>
          </Col>
          <Col style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {isGroup ? conv.name || `Nhóm chat (${members.length})` : user?.fullName || "Unknown"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {conv.lastMessageId ? (conv.lastMessageId.isRecalled ? "Tin nhắn đã thu hồi" : stripHtml(conv.lastMessageId.content)) : "Chưa có tin nhắn"}
            </div>
          </Col>
          <Col xs="auto" className="ms-2 d-flex align-items-center">
            {unread[conv._id] > 0 && <Badge pill bg="danger" className="unread-badge" style={{ fontSize: 10 }}>{unread[conv._id] > 9 ? "9+" : unread[conv._id]}</Badge>}
            <div className="action-menu">
              <Dropdown onClick={(e) => e.stopPropagation()}>
                <Dropdown.Toggle as="div" className="no-caret" style={{ cursor: 'pointer', padding: '4px' }}>
                  <FiMoreVertical color="#64748b" size={20} />
                </Dropdown.Toggle>
                <Dropdown.Menu align="end" className="shadow-lg border-0" style={{ borderRadius: '12px', minWidth: '180px', padding: '8px' }}>
                  {isGroup && (
                    <>
                      <Dropdown.Item className="rounded-2 d-flex align-items-center gap-2 py-2" onClick={() => handleShowMembers(conv._id)}>
                        <FiUsers size={16} className="text-primary" /> Xem thành viên
                      </Dropdown.Item>
                      <Dropdown.Item className="rounded-2 d-flex align-items-center gap-2 py-2" onClick={() => handleOpenEditModal(conv)}>
                        <FiEdit3 size={16} className="text-success" /> Cài đặt nhóm
                      </Dropdown.Item>
                      <Dropdown.Divider />
                    </>
                  )}
                  <Dropdown.Item className="text-danger rounded-2 d-flex align-items-center gap-2 py-2" onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, type: "delete", data: conv._id }); }}>
                    <FiTrash2 size={16} /> Xóa hội thoại
                  </Dropdown.Item>
                  {isGroup && isOwner && (
                    <Dropdown.Item className="text-danger rounded-2 d-flex align-items-center gap-2 py-2" onClick={(e) => { e.stopPropagation(); setConfirmModal({ show: true, type: "disband", data: conv._id }); }}>
                      <FiLogOut size={16} /> Giải tán nhóm
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  return (
    <div className="p-3 chat-list-wrapper" style={{ background: "#f1f5f9", height: "100%", overflowY: "auto" }}>
      <style>{`
        .chat-item-row .action-menu { display: none; }
        .chat-item-row:hover .action-menu { display: block; }
        .chat-item-row:hover .unread-badge { display: none; }
        .no-caret::after { display: none !important; }
        .dropdown-item:hover { background-color: #f8fafc; }
        .dropdown-item.text-danger:hover { background-color: #fff1f2; }
        .dropdown-item { transition: all 0.2s ease; font-size: 14px; font-weight: 500; }
        
        /* MODERN MODAL STYLES */
        .modern-modal .modal-content {
          border-radius: 24px;
          border: none;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.12);
        }
        .modern-modal .modal-header { border-bottom: 1px solid #f1f5f9; padding: 1.5rem; }
        .modern-modal .modal-body { padding: 1.5rem; }
        
        .avatar-edit-container { 
          position: relative; 
          width: 110px; 
          height: 110px; 
          margin: 0 auto 25px; 
          cursor: pointer;
          border-radius: 50%;
          padding: 3px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
        }
        .avatar-edit-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #fff;
          overflow: hidden;
          position: relative;
        }
        .avatar-edit-overlay { 
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.4); border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          color: white; font-size: 24px; opacity: 0; transition: 0.3s; 
        }
        .avatar-edit-container:hover .avatar-edit-overlay { opacity: 1; }
        
        .btn-modern-confirm {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          border: none; border-radius: 14px; padding: 12px; font-weight: 600;
          box-shadow: 0 10px 20px rgba(99, 102, 241, 0.2); transition: 0.3s;
        }
        .btn-modern-confirm:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(99, 102, 241, 0.3); }
        
        .icon-box-modern {
          width: 70px; height: 70px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 32px; margin: 0 auto 20px;
        }
      `}</style>

      <Toaster position="top-center" reverseOrder={false} containerStyle={{ zIndex: 99999 }} />

      <div className="d-flex align-items-center gap-2 mb-3">
        <Form.Control placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ borderRadius: 20, height: 42, border: "1px solid #e2e8f0", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)" }} />
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-add-friend">Thêm bạn</Tooltip>}>
          <Button onClick={() => setOpenModal(true)} style={{ borderRadius: "50%", width: 42, height: 42, background: "#6366f1", border: "none" }}><FiUserPlus /></Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-create-group">Tạo nhóm</Tooltip>}>
          <Button onClick={() => setOpenGroupModal(true)} style={{ borderRadius: "50%", width: 42, height: 42, background: "#10b981", border: "none" }}><HiUserGroup /></Button>
        </OverlayTrigger>
      </div>

      {recent.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 10 }}> Hoạt động gần đây </div>
          <div className="d-flex flex-column gap-2 mb-3">
            {recent.map(renderItem)}
          </div>
        </>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 10 }}> Tất cả cuộc trò chuyện </div>
      <div className="d-flex flex-column gap-2">
        {others.map(renderItem)}
      </div>

      {/* MODERN GROUP SETTINGS MODAL */}
      <Modal show={showEditGroupModal} onHide={() => setShowEditGroupModal(false)} centered className="modern-modal">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold" style={{ color: '#1e293b' }}>Cài đặt nhóm</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="avatar-edit-container" onClick={() => fileInputRef.current.click()}>
            <div className="avatar-edit-inner">
                {previewAvatar ? 
                  <Image src={previewAvatar} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> :
                  <div className="bg-primary text-white d-flex align-items-center justify-content-center h-100"><HiUserGroup size={45} /></div>
                }
                <div className="avatar-edit-overlay"><FiCamera /></div>
            </div>
          </div>
          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={onFileChange} />
          
          <Form.Group className="text-start mb-4">
            <Form.Label className="small fw-bold text-muted px-1">Tên nhóm hiển thị</Form.Label>
            <Form.Control 
                type="text" 
                value={editGroupName} 
                onChange={(e) => setEditGroupName(e.target.value)} 
                style={{ borderRadius: 14, padding: '12px', border: '2px solid #f1f5f9', background: '#f8fafc' }} 
            />
          </Form.Group>
          
          <Button variant="primary" className="w-100 btn-modern-confirm" onClick={handleUpdateGroupInfo}>
            Lưu thay đổi
          </Button>
        </Modal.Body>
      </Modal>

      {/* MODERN CONFIRM MODAL */}
      <Modal show={confirmModal.show} onHide={() => setConfirmModal({ ...confirmModal, show: false })} centered className="modern-modal" size="sm">
        <Modal.Body className="text-center py-4 px-3">
          <div className="icon-box-modern" style={{ background: confirmModal.type === "disband" ? '#fff1f2' : '#f8fafc', color: confirmModal.type === "disband" ? '#e11d48' : '#64748b' }}>
            {confirmModal.type === "disband" ? <FiLogOut /> : <FiTrash2 />}
          </div>
          <h5 className="fw-bold mb-2" style={{ color: '#1e293b' }}>
            {confirmModal.type === "disband" ? "Giải tán nhóm?" : "Xóa cuộc trò chuyện?"}
          </h5>
          <p className="text-muted small mb-4 px-2">
            {confirmModal.type === "disband" 
              ? "Hành động này sẽ xóa vĩnh viễn tất cả thành viên và tin nhắn của nhóm."
              : "Bạn chắc chắn muốn xóa hội thoại này khỏi danh sách của mình?"
            }
          </p>
          <div className="d-flex gap-2">
            <Button variant="light" className="flex-grow-1 rounded-3 fw-600" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>Hủy</Button>
            <Button variant={confirmModal.type === "disband" ? "danger" : "primary"} className="flex-grow-1 rounded-3 fw-600 shadow-sm" onClick={handleConfirmAction}>
               {confirmModal.type === "disband" ? "Giải tán" : "Xác nhận"}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <GroupMembersModal 
        show={showMembersModal}
        onHide={() => setShowMembersModal(false)}
        members={membersList}
        conversationId={targetGroup}
        currentUserId={currentUserId}
        onUpdate={handleGroupUpdate}
        conversations={conversations}
      />

      {openModal && <AddFriendModal onClose={() => setOpenModal(false)} />}
      {openGroupModal && (
        <CreateGroupModal 
          onClose={() => setOpenGroupModal(false)} 
          onCreated={(newConv) => { 
            if (typeof setConversations === "function") setConversations(prev => [newConv, ...prev]); 
          }} 
        />
      )}
    </div>
  );
}

export default ChatList;