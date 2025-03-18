export type Stop = {
  id: number;
  name: string;
  roomNr: string;
  description: string;
  divisionIds: number[];
  stopGroupIds: number[];
  orders: number[];
};

export type StopOfStudent = {
  name: string;
  status: Status,
  description: string;
  roomNr: string;
}

export enum Status {
  Pending,
  Accepted,
  Declined
}


export type StopWithoutOrders = {
  id: number;
  name: string;
  roomNr: string;
  description: string;
  divisionIds: number[];
  stopGroupIds: number[];
};

export type StopGroup = {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  stopIds: number[];
};

export type Division = {
  id: number;
  name: string;
  color: string;
};

export type Info = {
  id: number;
  type: 'info' | 'error';
  message: string;
};

export type StopsShownInStopGroup = {
  stopGroupId: number,
  isShown: boolean
}
