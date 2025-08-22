export interface UserDTO {
  id: string;
  userIp: string;
  userMac: string;
  telegramId: number;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
