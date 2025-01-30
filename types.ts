import { ObjectId, OptionalId } from "mongodb";

export type Contacto = {
  id: string;
  name: string;
  phone: string;
  friends: string[];
  country: string;
};

export type ContactModel = OptionalId<{
  name: string;
  phone: string;
  friends: ObjectId[];
  country: string;
}>;

export type phoneAPI = {
  is_valid: boolean;
  country: string;
};
