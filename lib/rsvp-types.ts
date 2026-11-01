export type RsvpStatus = {
  name: string;
  attending: boolean;
  table_number: number | null;
  /** Set when the guest was added as a plus-one by someone else */
  booked_by: string | null;
  party: { name: string; table_number: number | null }[];
};
