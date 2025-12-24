export type StudentAssignment = {
  id?: number;
  edufsUsername: string;
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
  stopManagerAssignments: string[];
};

export type StopManager = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
  assignedStops: number[];
};

export type StopManagerAssignment = {
  stopManagerId: string;
  stopId: number;
};

export type StopOfStudent = {
  name: string;
  status: Status;
  description: string;
  roomNr: string;
  otherStudents: OtherStudentsOfStop[];
};

export type OtherStudentsOfStop = {
  lastName: string;
  firstName: string;
  studentClass: string;
  department: string;
  status: Status; // maybe?
};

export enum Status {
  Pending,
  Accepted,
  Declined,
}

export type StudentAssignmentOfStop = {
  edufsUsername: string;
  status: Status;
};

export type StopWithoutOrders = {
  id: number;
  name: string;
  description: string;
  roomNr: string;
  divisionIds: number[];
  stopGroupIds: number[];
  studentAssignments: StudentAssignmentOfStop[];
  stopManagerAssignments: string[];
};

export type StopAsStopManager = {
  id: number;
  name: string;
  roomNr: string;
  description: string;
  studentAssignments: StudentAssignmentOfStop[];
};

export type StopGroup = {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  stopIds: number[];
  order: number;
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

export type FeedbackQuestion = {
  id?: number;
  question: string;
  type: 'text' | 'choice' | 'rating';
  required: boolean;
  placeholder?: string;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  ratingLabels?: string;
  order: number;
  dependencies?: FeedbackDependency[];
};

export type FeedbackDependency = {
  dependsOnQuestionId: number;
  conditionValue: string;
};

// Request DTOs

export type CreateStopGroupRequest = {
  name: string;
  description: string;
  isPublic: boolean;
};

export type UpdateStopGroupRequest = {
  id: number;
  name: string;
  description: string;
  isPublic: boolean;
  stopIds: number[];
};

export type CreateStudentRequest = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
  studentClass: string;
  department: string;
};

export type CreateStopManagerRequest = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
};

export type UpdateStopManagerRequest = {
  edufsUsername: string;
  firstName: string;
  lastName: string;
};

export type CreateDivisionRequest = {
  name: string;
  color: string;
};

export type UpdateDivisionRequest = {
  id: number;
  name: string;
  color: string;
};

export type AddAdminRequest = {
  name: string;
};
