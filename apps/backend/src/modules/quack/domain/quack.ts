export type QuackAuthor = {
  id: string;
  name: string;
  username: string;
};

export type QuackMood = 'happy' | 'sad' | 'angry' | 'silly';

export type Quack = {
  id: string;
  text: string;
  mood?: QuackMood;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: QuackAuthor;
};
