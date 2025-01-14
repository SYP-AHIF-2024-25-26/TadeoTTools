export type Stop = {
  id: number;
  name: string;
  description: string;
  roomNr: string;
  stopGroupIds: number[];
  divisionIds: number[];
  orders: number[];
};

export type StopGroup = {
  id: number;
  name: string;
  description: string;
  rank: number;
  stopIds: number[];
};

export type Division = {
  id: number;
  name: string;
  color: string;
};
