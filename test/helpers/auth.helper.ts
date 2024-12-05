import { Profile } from "../../src/modules/profiles/models/profile.model"

export async function createTestProfile(
  type: "client" | "contractor" = "client"
) {
  return await Profile.create({
    firstName: "Test",
    lastName: "User",
    profession: type === "client" ? "Manager" : "Developer",
    balance: type === "client" ? 1000 : 0,
    type,
  })
}

export function getAuthHeader(profileId: number) {
  return { profile_id: profileId.toString() }
}
