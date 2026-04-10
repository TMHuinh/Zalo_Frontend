import { useState } from "react";
import friendshipApi from "../api/friendshipApi";
import userApi from "../api/userApi";
import { toast } from "react-toastify";

function AddFriendModal({ onClose }) {
    const [phone, setPhone] = useState("");
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!phone) return toast.warning("Nhập số điện thoại");

        try {
            setSearching(true);
            setUser(null);

            const res = await userApi.searchByPhone(phone);
            setUser(res.data.data);

        } catch (err) {
            const message =
                err.response?.data?.message || "Không tìm thấy người dùng";

            toast.error(message);
            setUser(null);

        } finally {
            setSearching(false);
        }
    };

    const handleAddFriend = async (id) => {
        try {
            setLoading(true);

            const res = await friendshipApi.sendRequest(id);

            toast.success(res.data.message || "Đã gửi lời mời kết bạn");

            onClose();

        } catch (err) {
            const message =
                err.response?.data?.message || "Không thể gửi lời mời";

            toast.error(message);

            console.log("Friend error:", err.response?.data || err.message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h3 style={styles.title}>Tìm bạn bè</h3>

                {/* INPUT */}
                <input
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={styles.input}
                />

                <button onClick={handleSearch} style={styles.searchBtn}>
                    {searching ? "Đang tìm..." : "Tìm kiếm"}
                </button>

                {/* RESULT */}
                {user && (
                    <div style={styles.resultCard}>
                        <img
                            src={
                                user.avatar ||
                                "https://ui-avatars.com/api/?name=" +
                                encodeURIComponent(user.fullName || user.name)
                            }
                            alt="avatar"
                            style={styles.avatar}
                        />

                        <div style={{ flex: 1 }}>
                            <p style={styles.name}>
                                {user.fullName || user.name}
                            </p>
                            <p style={styles.phone}>{user.phone}</p>

                            <button
                                onClick={() => handleAddFriend(user._id)}
                                disabled={loading}
                                style={styles.addBtn}
                            >
                                {loading ? "Đang gửi..." : "Kết bạn"}
                            </button>
                        </div>
                    </div>
                )}

                <button onClick={onClose} style={styles.closeBtn}>
                    Đóng
                </button>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        width: 420,
        background: "#fff",
        borderRadius: 14,
        padding: 20,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        fontFamily: "Arial",
    },
    title: {
        marginBottom: 12,
        fontSize: 16,
        fontWeight: 600,
    },
    input: {
        width: "100%",
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        outline: "none",
    },
    searchBtn: {
        marginTop: 10,
        width: "100%",
        padding: 10,
        background: "#0b74e5",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        cursor: "pointer",
        fontWeight: 500,
    },
    resultCard: {
        marginTop: 15,
        display: "flex",
        gap: 12,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        alignItems: "center",
        background: "#fafafa",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: "50%",
        objectFit: "cover",
    },
    name: {
        margin: 0,
        fontWeight: 600,
        fontSize: 14,
    },
    phone: {
        margin: "4px 0",
        color: "#666",
        fontSize: 13,
    },
    addBtn: {
        marginTop: 6,
        background: "#22c55e",
        color: "#fff",
        border: "none",
        padding: "6px 10px",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 12,
    },
    closeBtn: {
        marginTop: 12,
        width: "100%",
        padding: 10,
        borderRadius: 10,
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
    },
};

export default AddFriendModal;