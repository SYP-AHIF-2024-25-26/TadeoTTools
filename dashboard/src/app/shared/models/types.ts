export type StudentAssignment = {
  id?: number;
  edufsUsername: string;
  stopId: number;
  stopName: string;
  status: Status;
  stopManagers?: string[];
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
  infrastructure: string;
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
  infrastructure: string;
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
  infrastructure: string;
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

export type ImportResult = {
  added: number;
  skipped: number;
};

export type Info = {
  id: number;
  type: 'info' | 'error';
  message: string;
  // Optional button in the toast, e.g. "Undo".
  action?: { label: string; run: () => void };
};

export type FeatureFlag = {
  isEnabled: boolean;
  value: string;
};

export type FeedbackQuestion = {
  id?: number;
  question: string;
  type: 'Text' | 'Rating' | 'SingleChoice' | 'MultipleChoice';
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

export type FeedbackResponses = {
  responseCount: number;
  latestAt: string | null;
  questions: FeedbackQuestionSummary[];
};

export type FeedbackQuestionSummary = {
  questionId: number;
  question: string;
  type: FeedbackQuestion['type'];
  answeredCount: number;
  average: number | null;
  // Rating: one entry per value from min to max. Choice: one per current option.
  counts: { value: string; count: number }[];
  // Answers that match no current option or are outside the rating range.
  otherCount: number;
  textAnswers: { answer: string; timestamp: string }[];
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

export type OverviewStudents = {
  total: number;
  approved: number;
  pending: number;
  conflict: number;
  unassigned: number;
};

export type OverviewGroup = {
  id: number;
  name: string;
  isPublic: boolean;
  stopIds: number[];
};

export type OverviewStop = {
  id: number;
  name: string;
  roomNr: string;
  hasDescription: boolean;
  divisionColors: string[];
  managerCount: number;
  approvedStudentCount: number;
  pendingStudentCount: number;
};

export type Overview = {
  students: OverviewStudents;
  feedbackQuestionCount: number;
  feedbackSessionCount: number;
  latestFeedbackAt: string | null;
  countdown: { isEnabled: boolean; value: string | null };
  groups: OverviewGroup[];
  stops: OverviewStop[];
};

// Buffet (cashier kiosk). Prices and amounts are in cents; a negative price is a voucher.
export type BuffetProduct = {
  id: number;
  name: string;
  unit: string;
  priceCents: number;
  menuCount: number;
  soldCount: number;
};

export type SaveBuffetProductRequest = {
  name: string;
  unit: string;
  priceCents: number;
};

export type CashMovement = {
  id: number;
  time: string;
  amountCents: number;
};

export type Buffet = {
  id: number;
  location: string;
  description: string;
  // Product ids in counter order.
  menu: number[];
  cashMovements: CashMovement[];
  orderCount: number;
};

export type SaveBuffetRequest = {
  location: string;
  description: string;
};

export type ProductSales = {
  productId: number;
  name: string;
  quantity: number;
  revenueCents: number;
};

export type BuffetSales = {
  buffetId: number;
  location: string;
  orderCount: number;
  revenueCents: number;
  cashCents: number;
  products: ProductSales[];
};

export type Sales = {
  orderCount: number;
  revenueCents: number;
  buffets: BuffetSales[];
};

export type SalesHour = {
  hour: number;
  orderCount: number;
  revenueCents: number;
};

export type SalesDay = {
  // "2026-11-20", the open day's date in Vienna time.
  date: string;
  orderCount: number;
  revenueCents: number;
  hours: SalesHour[];
};

export type ProductRank = {
  productId: number;
  name: string;
  quantity: number;
  revenueCents: number;
};

export type SalesStatistics = {
  orderCount: number;
  revenueCents: number;
  // Items without vouchers.
  itemCount: number;
  voucherCount: number;
  voucherCents: number;
  days: SalesDay[];
  products: ProductRank[];
};

export type District = {
  id: number;
  // Three digits of Statistik Austria, e.g. 410 for Linz-Land.
  number: number;
  name: string;
  cityCount: number;
};

export type SaveDistrictRequest = {
  number: number;
  name: string;
};

export type City = {
  id: number;
  zipCode: string;
  name: string;
  // The Gemeindekennziffer; several Viennese postcodes share one.
  number: number;
  districtId: number;
  visitorCount: number;
};

export type SaveCityRequest = {
  zipCode: string;
  name: string;
  number: number;
  districtId: number;
};

// The two choice lists of the registration kiosk; also the URL segment.
export type RegistrationOptionKind = 'reasons-for-visit' | 'school-types';

export type RegistrationOptions = {
  reasonsForVisit: string[];
  schoolTypes: string[];
};

export type VisitorSummary = {
  count: number;
  adultsCount: number;
  photoCount: number;
};

export type DeleteVisitorsResult = {
  visitors: number;
  photos: number;
};
