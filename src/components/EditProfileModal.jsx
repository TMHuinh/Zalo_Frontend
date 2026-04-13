import { useState, useEffect } from "react";
import userApi from "../api/userApi";
import { toast } from "react-toastify";
import { Modal, Button, Form } from "react-bootstrap";

function EditProfileModal({ user, isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    gender: "other",
    bio: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        gender: user.gender || "other",
        bio: user.bio || "",
        dateOfBirth: user.dateOfBirth || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await userApi.updateUser(user._id, form);
      toast.success("Cập nhật thành công");

      onSuccess?.(res.data.result);
      onClose();
    } catch (err) {
      toast.error("Cập nhật thất bại");
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Cập nhật thông tin</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* FULL NAME */}
          <Form.Group className="mb-3">
            <Form.Label>Họ tên</Form.Label>
            <Form.Control
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
            />
          </Form.Group>

          {/* PHONE */}
          <Form.Group className="mb-3">
            <Form.Label>Số điện thoại</Form.Label>
            <Form.Control
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </Form.Group>

          {/* GENDER - SELECT */}
          <Form.Group className="mb-3">
            <Form.Label>Giới tính</Form.Label>
            <Form.Select
              name="gender"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </Form.Select>
          </Form.Group>

          {/* BIO */}
          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="bio"
              value={form.bio}
              onChange={handleChange}
            />
          </Form.Group>

          {/* DATE */}
          <Form.Group className="mb-3">
            <Form.Label>Ngày sinh</Form.Label>
            <Form.Control
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Huỷ
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Lưu thay đổi
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EditProfileModal;
