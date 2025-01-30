import { ObjectId } from "mongodb";
import { GraphQLError } from "graphql";
import { ContactModel, type phoneAPI } from "./types.ts";
import { Collection } from "mongodb";

type getid = {
  id: string;
};

type update = {
  id: string;
  name?: string;
  phone?: string;
};

type addcontact = {
  name: string;
  phone: string;
  friends: string[];
};

type Context = {
  ContactCollection: Collection<ContactModel>;
};

export const resolvers = {
  Contact: {
    id: (parent: ContactModel): string => {
      return parent._id?.toString();
    },

    friends: async (_: unknown, parent: ContactModel, ctx: Context) => {
      if (!Array.isArray(parent.friends)) {
        return [];
      }
      const ids = parent.friends.map((id) => new ObjectId(id));
      return await ctx.ContactCollection.find({ _id: { $in: ids } }).toArray();
    },
  },

  Query: {
    getContacts: async (
      _: unknown,
      __: unknown,
      ctx: Context
    ): Promise<ContactModel[]> => {
      const con = await ctx.ContactCollection.find().toArray();
      return con;
    },
    getContact: async (
      _: unknown,
      args: getid,
      ctx: Context
    ): Promise<ContactModel | null> => {
      const con = await ctx.ContactCollection.findOne({
        _id: new ObjectId(args.id),
      });
      return con;
    },
  },

  Mutation: {
    deleteContact: async (
      _: unknown,
      args: getid,
      ctx: Context
    ): Promise<boolean> => {
      const { deletedCount } = await ctx.ContactCollection.deleteOne({
        _id: new ObjectId(args.id),
      });
      return deletedCount === 1;
    },

    addContact: async (
      _: unknown,
      args: addcontact,
      ctx: Context
    ): Promise<ContactModel> => {
      const API_KEY = Deno.env.get("API_KEY");

      if (!API_KEY) {
        console.error("API_KEY is not set");
        Deno.exit(1);
      }

      const { name, phone, friends } = args;

      const exist = await ctx.ContactCollection.findOne({ phone });
      if (exist) throw new GraphQLError("TELEFONO EXISTE");

      const friendexist = friends.map((f) => {
        if (!ObjectId.isValid(f)) throw new GraphQLError("ERROR");
        return new ObjectId(f);
      });

      const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`;

      const data = await fetch(url, { headers: { "x-api-key": API_KEY } });

      const response: phoneAPI = await data.json();

      if (!response.is_valid) throw new GraphQLError("ERROR");

      const add = await ctx.ContactCollection.insertOne({
        name,
        phone,
        friends: friendexist,
        country: response.country,
      });

      return {
        _id: add.insertedId,
        name,
        phone,
        friends: friendexist,
        country: response.country,
      };
    },

    updateContact: async (
      _: unknown,
      params: update,
      context: Context
    ): Promise<ContactModel | null> => {
      const { id, name, phone } = params;

      const update: Partial<ContactModel> = {};

      if (name !== undefined) update.name = name;
      if (phone !== undefined) {
        update.phone = phone;
        const API_KEY = Deno.env.get("API_KEY");

        if (!API_KEY) {
          console.error("API_KEY is not set");
          Deno.exit(1);
        }
        const url = `https://api.api-ninjas.com/v1/validatephone?number=${phone}`;

        const data = await fetch(url, { headers: { "x-api-key": API_KEY } });

        const response: phoneAPI = await data.json();

        if (!response.is_valid) throw new GraphQLError("ERROR");
        update.country = response.country;
      }

      const updateArgs = await context.ContactCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: update }
      );
      if (updateArgs.modifiedCount !== 1)
        throw new GraphQLError("Error updateARGS");

      const contact = await context.ContactCollection.findOne({
        _id: new ObjectId(id),
      });
      return contact;
    },
  },
};
