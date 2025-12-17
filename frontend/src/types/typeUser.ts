export interface typeUser {
  _id: string;
  email: string;
  phone?: string;
  displayName: string;
  birthday?: string;
  gender?: string;
  avatarUrl?: string;
  createAt?: string;
  updateAt?: string;
}

export interface Friend {
  _id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export interface FriendRequest {
  _id: string;
  from: typeUser;
  to: typeUser;
  message?: string;
}
