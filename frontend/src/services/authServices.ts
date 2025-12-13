import api from "@/lib/axios";

export const authServices = {
  signUp: async (
    fistname: string,
    lastname: string,
    email: string,
    password: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      {
        fistname,
        lastname,
        email,
        password,
      },
      { withCredentials: true }
    );

    return res.data;
  },

  signIn: async (email: string, password: string) => {
    const res = await api.post(
      "/auth/signin",
      { email, password },
      { withCredentials: true }
    );
    return res.data;
  },

  signOut: async () => {
    return await api.post("/auth/signout", {}, { withCredentials: true });
  },

  fetchMe: async () => {
    const res = await api.get("/users/me", { withCredentials: true });
    return res.data;
  },

  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data;
  },
};
