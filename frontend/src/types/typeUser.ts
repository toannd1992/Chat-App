export interface typeUser {
  _id: string;
  email: string;

  displayName: string;
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
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}
