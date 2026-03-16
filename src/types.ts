export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  avatarColor: string;
  lastActive: string;
  status: 'online' | 'offline';
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  position: Vector3;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  environmentType: 'space' | 'forest' | 'minimal';
}
