export type StudentAssignment = {
  studentId: string,
  stopId: number,
  stopName: string,
  status: Status
}

export type Student = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
  studentClass: string;
  department: string;
  studentAssignments: StudentAssignment[];
}

export type Stop = {
  id: number;
  name: string;
  roomNr: string;
  description: string;
  divisionIds: number[];
  stopGroupIds: number[];
  orders: number[];
};

export type TeacherAssignment = {
  stopId: number;
  status: Status;
}

export type Teacher = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
  assignments: TeacherAssignment[];
}

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
