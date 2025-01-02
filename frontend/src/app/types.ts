export type Stop = {
  stopID: number;
  name: string;
  description: string;
  roomNr: string;
  stopGroupID: number;
  divisionID: number;
};

export type StopGroup = {
  stopGroupID: number;
  name: string;
  description: string;
};

export type Division = {
  divisionID: number;
  name: string;
  color: string;
};

export type TeamMember = {
  name: string;
  class: string;
  schoolYear: string;
}
