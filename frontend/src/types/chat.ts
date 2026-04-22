export interface Message {
  id: string;
  from: string;
  text: string;
  timestamp: string;
}

export interface UserState {
  code: string | null;
  name: string;
  gender: string;
  partnerId: string | null;
  partnerName: string | null;
}

export interface Friend {
  code: string;
}
