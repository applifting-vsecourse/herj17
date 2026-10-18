import { QuackMood } from '@/modules/quack/domain/quack';

export type Profile = {
  id: string;
  name: string;
  username: string;
  bio?: string;
  defaultMood?: QuackMood;
};

export type ProfileUpdate = {
  name: string;
  username: string;
  bio?: string;
  defaultMood?: QuackMood;
};

export class UsernameTakenError extends Error {
  constructor(username: string) {
    super(`Username "${username}" is already taken`);
  }
}
