import { PublicKey } from "@/utils/elgamal";

export interface Contact {
  id: string;
  username: string;
  userId: string;
  contactId?: string;
  added_at?: string;
  publicKey: PublicKey;
}