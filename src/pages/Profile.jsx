import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import userApi from "../api/userApi";

import ProfileModal from "./../components/ProfileModel";

function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await userApi.getById(id);
        setUser(res.data.result.result);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [id]);

  if (!user) return <p>Loading...</p>;

  return (
    <div
      style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}
    >
      <div
        onClick={() => setIsModalOpen(true)}
        style={{
          cursor: "pointer",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#0b5ed7",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 36,
        }}
      >
        {user.fullName.charAt(0)}
      </div>

      <ProfileModal
        user={user}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onChangePassword={() => navigate("/change-password")}
        onUpdateInfo={() =>
          alert("Chức năng cập nhật thông tin chưa được triển khai")
        }
      />
    </div>
  );
}

export default Profile;
