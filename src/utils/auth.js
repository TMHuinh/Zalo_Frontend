import { jwtDecode } from "jwt-decode";

export const getUserIdFromToken = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return decoded.userId;
    } catch (err) {
        console.error("Token lỗi", err);
        return null;
    }
};