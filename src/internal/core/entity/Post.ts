export interface Post {
  id: string;
  title: string;
  content: string;
  upvotes: number;
  topComment?: string | null;
}

export type RelevantPost = Post;
