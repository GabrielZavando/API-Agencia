// export interface User extends DecodedIdToken {
export interface User {
  role?: string;
  uid: string;
  email?: string;
  [key: string]: any; // Allow other properties from DecodedIdToken
}

export interface Project {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'archived';
  files?: string[];
  reports?: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}
