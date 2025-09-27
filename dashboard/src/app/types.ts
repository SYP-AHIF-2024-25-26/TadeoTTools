export type StudentAssignment = {
  studentId: string;
  stopId: number;
  stopName: string;
  status: Status;
};

export type Student = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
  studentClass: string;
  department: string;
  studentAssignments: StudentAssignment[];
  showStops?: boolean;
};

export type Stop = {
  id: number;
  name: string;
  roomNr: string;
  description: string;
  divisionIds: number[];
  stopGroupIds: number[];
  orders: number[];
  studentAssignments: StudentAssignmentOfStop[];
};

export type Teacher = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
  assignedStops: number[];
};

export type TeacherAssignment = {
  teacherId: string;
  stopId: number;
}

export type StopOfStudent = {
  name: string;
  status: Status;
  description: string;
  roomNr: string;
};

export enum Status {
  Pending,
  Accepted,
  Declined,
}

export type StudentAssignmentOfStop = {
  studentId: string;
  status: Status;
}

export type StopWithoutOrders = {
  id: number;
  name: string;
  roomNr: string;
  description: string;
  divisionIds: number[];
  stopGroupIds: number[];
  studentAssignments: StudentAssignmentOfStop[];
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
  stopGroupId: number;
  isShown: boolean;
};