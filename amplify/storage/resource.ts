import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "post-storage", 
  access: (allow) => ({
    "images/*": [allow.authenticated.to(["read", "write", "delete"])],
    "default-profile-pictures/*": [allow.authenticated.to(["read", "write", "delete"])]
  }),
});