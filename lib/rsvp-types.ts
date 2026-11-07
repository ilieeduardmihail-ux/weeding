export type RsvpStatus = {
  name: string;
  attending: boolean;
  /** Set when the guest was added as a plus-one by someone else */
  booked_by: string | null;
  /** Names only: table assignments never leave the admin area. */
  party: { name: string }[];
};
