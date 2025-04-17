export interface DataPoint {
  upvotes: number;
  title: string;
  content: string;
  topComment: string | null;
}

export interface RedditPostData {
  id: string;
  title: string;
  selftext: string;
  ups: number;
}

export interface RedditPostWrapper {
  data: RedditPostData;
}

export interface RedditAPIResponse {
  data: {
    children: RedditPostWrapper[];
  };
}
