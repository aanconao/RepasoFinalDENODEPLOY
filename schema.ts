export const schema = `#graphql
    type Contact{
        id: ID!
        name: String!
        phone: String!
        friends: [Contact!]!
        country: String!
    }
    type Query{
        getContact(id:ID!):Contact
        getContacts:[Contact!]!
    }
    type Mutation{
        addContact(name:String!, phone:String!, friends:[ID!]!):Contact!
        deleteContact(id:ID!):Boolean!
        updateContact(id:ID! ,name:String!, phone:String!):Contact
    }
`;
