export type DetailItem = {
  type: "place" | "hotel" | "activity";
  name: string;
  description: string;
  image: string;
  tag?: string;
  rating?: number;
  location?: string;
  bestTime?: string;
  weather?: string;
  activities?: string[];
  price?: string;
  imageQuery?: string;
};

export type Message = {
  role: "user" | "assistant";
  text?: string;
  places?: DetailItem[];
  hotel?: DetailItem;
  activities?: DetailItem[];
};
