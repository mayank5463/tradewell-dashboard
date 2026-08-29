import api from "../../services/api";


export const resetPaperAccount = () => async (dispatch) => {
  try {
    const { data } = await api.post("/wallet/reset");

    return { success: true, data };
  } catch (err) {
    const message = err.response?.data?.error || err.message || "Failed to reset account.";
    return { success: false, error: message };
  }
};