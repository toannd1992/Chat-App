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
  updateAvatar: async (avatar: string) => {
    const res = await api.post(
      "users/avatar",
      { avatar },
      { withCredentials: true }
    );
    return res.data;
  },
  updateProfile: async (data: {
    displayName: string;
    phone: string;
    birthday: string;
    gender: string;
  }) => {
    const { displayName, phone, birthday, gender } = data;
    const res = await api.post(
      "users/update",
      { displayName, phone, birthday, gender },
      { withCredentials: true }
    );
    return res.data;
  },
  refresh: async () => {
    const res = await api.post("/auth/refresh", { withCredentials: true });
    return res.data;
  },

  seachUser: async (keyword: string) => {
    const res = await api.get(`/users/search?keyword=${keyword}`, {
      withCredentials: true,
    });

    return res.data.user;
  },
};
